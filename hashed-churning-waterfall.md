# TaskFlow SaaS Backend Architecture Plan

## Overview

Backend for TaskFlow - a multi-tenant SaaS task management application with real-time sync.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Language | Java |
| Framework | Spring Boot 3 |
| Database | PostgreSQL (single DB, shared schema) |
| File Storage | MinIO (S3-compatible, self-hosted) |
| Auth | OAuth2/OIDC (Google, GitHub, Microsoft) |
| Real-time | WebSockets (STOMP) |
| Caching | Redis |
| Deployment | Docker / Containerized |

## Multi-Tenancy Strategy

- **Single database, shared schema** with `tenant_id` column on all tables
- PostgreSQL Row-Level Security (RLS) for additional isolation
- Tenant ID extracted from JWT and set in `ThreadLocal` context
- All queries scoped by tenant automatically

---

## Database Schema

### Core Tables

```
organizations
├── id (UUID, PK)
├── name, slug (unique)
├── plan (free/pro/enterprise)
├── settings (JSONB)
└── created_at, updated_at

users
├── id (UUID, PK)
├── email (unique)
├── name, avatar_url
├── oauth_provider, oauth_id
└── created_at, last_login_at

organization_members
├── organization_id → organizations
├── user_id → users
└── role (owner/admin/member)
```

### Task Management

```
tasks
├── id (UUID, PK)
├── tenant_id → organizations
├── title, tag, status, priority
├── due_date, description, area
├── position (for ordering)
├── parent_task_id (self-ref)
├── created_by → users
└── version (optimistic lock)

subtasks
├── task_id → tasks
├── text, done, position
└── tenant_id
```

### Notebooks & Notecards

```
notebooks
├── id, tenant_id
├── name, color, description
└── position, created_by

notecards
├── id, tenant_id
├── notebook_id → notebooks
├── title, content, code_block
├── reminder, tint, position
└── created_by

check_items
├── notecard_id → notecards
├── text, done, position
└── tenant_id

task_notecards (max 2 per task)
├── task_id → tasks
├── notecard_id → notecards
└── position (0 or 1)
```

### User Data

```
user_preferences
├── tenant_id, user_id
├── default_view, theme
└── notifications (JSONB)

scratchpads
├── tenant_id, user_id
└── content (TEXT)
```

### File Storage (Metadata in PostgreSQL, Files in MinIO)

```
files
├── id (UUID, PK)
├── tenant_id → organizations
├── storage_key (MinIO object path)
├── original_name
├── content_type (image/png, text/csv, etc.)
├── size_bytes
├── preview_key (MinIO path for preview/thumbnail)
├── preview_type (image, text, pdf, spreadsheet, none)
├── uploaded_by → users
├── created_at
└── metadata (JSONB - dimensions, duration, etc.)

notecard_files (links files to notecards)
├── notecard_id → notecards
├── file_id → files
├── position
└── tenant_id
```

**Storage Architecture:**
```
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │     MinIO       │
│  (metadata)     │     │  (actual files) │
├─────────────────┤     ├─────────────────┤
│ files table:    │     │ Buckets:        │
│  - id           │────►│  - taskflow-files/
│  - storage_key  │     │    └─ {tenant}/{id}/original
│  - preview_key  │────►│    └─ {tenant}/{id}/preview
│  - content_type │     │                 │
│  - size_bytes   │     │ Features:       │
└─────────────────┘     │  - S3 API       │
                        │  - Presigned URLs│
                        │  - Bucket policies│
                        └─────────────────┘
```

---

## API Endpoints

### Authentication
```
GET  /api/v1/auth/login/{provider}     # Initiate OAuth
GET  /api/v1/auth/callback/{provider}  # OAuth callback
POST /api/v1/auth/refresh              # Refresh JWT
GET  /api/v1/auth/me                   # Current user
```

### Tasks
```
GET    /api/v1/tasks                   # List (filter, paginate)
POST   /api/v1/tasks                   # Create
GET    /api/v1/tasks/{id}              # Get details
PUT    /api/v1/tasks/{id}              # Update
PATCH  /api/v1/tasks/{id}/status       # Update status
DELETE /api/v1/tasks/{id}              # Delete
POST   /api/v1/tasks/reorder           # Batch reorder
```

### Subtasks
```
POST   /api/v1/tasks/{id}/subtasks           # Add
PATCH  /api/v1/tasks/{id}/subtasks/{sid}/toggle  # Toggle done
DELETE /api/v1/tasks/{id}/subtasks/{sid}     # Delete
```

### Notebooks & Notecards
```
GET    /api/v1/notebooks               # List
POST   /api/v1/notebooks               # Create
GET    /api/v1/notebooks/{id}          # Get with cards
PUT    /api/v1/notebooks/{id}          # Update
DELETE /api/v1/notebooks/{id}          # Delete

POST   /api/v1/notebooks/{id}/notecards    # Create card
GET    /api/v1/notecards/{id}              # Get card
PUT    /api/v1/notecards/{id}              # Update card
DELETE /api/v1/notecards/{id}              # Delete card
```

### Task-Notecard Attachments
```
POST   /api/v1/tasks/{id}/notecards/{ncId}   # Attach (max 2)
DELETE /api/v1/tasks/{id}/notecards/{ncId}   # Detach
```

### User Data
```
GET /api/v1/preferences    # Get preferences
PUT /api/v1/preferences    # Update preferences
GET /api/v1/scratchpad     # Get scratchpad
PUT /api/v1/scratchpad     # Update scratchpad
```

### File Management
```
POST   /api/v1/files                    # Upload file (multipart)
GET    /api/v1/files/{id}               # Get file metadata
GET    /api/v1/files/{id}/download      # Get presigned download URL
GET    /api/v1/files/{id}/preview       # Get presigned preview URL
DELETE /api/v1/files/{id}               # Delete file

POST   /api/v1/notecards/{id}/files     # Attach file to notecard
DELETE /api/v1/notecards/{id}/files/{fid}  # Detach file
```

**File Upload Flow:**
```
1. Client → POST /api/v1/files (multipart/form-data)
2. Backend validates: size ≤ 25MB, allowed content type
3. Backend uploads to MinIO: {tenant}/{uuid}/original
4. Backend generates preview (async):
   - Images: 400px thumbnail
   - CSV/Excel: First 10 rows as JSON
   - PDF: First page as image
   - Code/Text: First 50 lines
5. Backend stores metadata in PostgreSQL
6. Returns: { id, previewUrl, downloadUrl }
```

**Supported File Types & Previews:**
| Type | Extensions | Preview |
|------|------------|---------|
| Images | png, jpg, gif, webp, svg | Thumbnail (400px) |
| Spreadsheets | csv, xlsx, xls | First 10 rows |
| Documents | pdf | First page image |
| Code/Text | txt, md, json, xml, yaml | First 50 lines |
| Archives | zip, tar, gz | File listing |
| Other | * | Icon only |

**File Size Limits:**
- Default: 25 MB per file
- Images: 10 MB
- Total per tenant (free): 1 GB
- Total per tenant (pro): 50 GB

---

## WebSocket Events

**Connection:** `wss://api.taskflow.io/ws?token={jwt}`

### Server → Client Events
```
task.created    { data: Task }
task.updated    { id, changes }
task.deleted    { id }
task.reordered  { status, orderedIds }

notebook.created/updated/deleted
notecard.created/updated/deleted

subtask.toggled    { taskId, subtaskId, done }
checkitem.toggled  { notecardId, itemId, done }

file.uploaded     { id, notecardId, previewUrl }
file.deleted      { id, notecardId }
file.preview_ready { id, previewUrl, previewType }
```

---

## Project Structure

```
taskflow-backend/
├── build.gradle.kts
├── Dockerfile
├── docker-compose.yml
└── src/main/kotlin/com/taskflow/
    ├── TaskFlowApplication.kt
    ├── config/
    │   ├── SecurityConfig.kt
    │   ├── WebSocketConfig.kt
    │   ├── JpaConfig.kt
    │   ├── TenantConfig.kt
    │   └── MinioConfig.kt        # MinIO client config
    ├── domain/
    │   ├── model/                # JPA entities
    │   │   └── File.kt           # File metadata entity
    │   ├── enum/                 # TaskStatus, Priority, PreviewType
    │   └── repository/           # Spring Data repos
    ├── service/
    │   ├── auth/                 # OAuth, JWT
    │   ├── task/                 # Task CRUD
    │   ├── notebook/             # Notebook/Notecard
    │   ├── organization/         # Org management
    │   └── file/                 # File management
    │       ├── FileService.kt        # Upload, delete, metadata
    │       ├── MinioStorageService.kt # MinIO operations
    │       └── PreviewService.kt     # Generate previews
    ├── web/
    │   ├── rest/                 # Controllers
    │   │   └── FileController.kt
    │   ├── dto/                  # Request/Response
    │   └── websocket/            # WS handlers
    ├── multitenancy/
    │   ├── TenantContext.kt
    │   └── TenantFilter.kt
    └── exception/
        └── GlobalExceptionHandler.kt
```

### Docker Services

```yaml
# docker-compose.yml
services:
  app:          # Spring Boot backend
  postgres:     # PostgreSQL 16
  redis:        # Redis 7 (caching, pub/sub)
  minio:        # MinIO (S3-compatible file storage)
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"   # S3 API
      - "9001:9001"   # Web console
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=taskflow
      - MINIO_ROOT_PASSWORD=taskflow_minio_secret
```

---

## Security Flow

```
1. User clicks "Login with Google"
2. Redirect to /api/v1/auth/login/google
3. Spring redirects to Google OAuth
4. User authenticates, Google redirects back
5. Backend exchanges code for tokens
6. Create/update user, generate JWT
7. Return JWT in HttpOnly cookie
8. Frontend includes JWT in requests
9. TenantFilter extracts tenant_id from JWT
10. All queries scoped to tenant
```

**JWT Claims:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "orgs": [{"id": "org-uuid", "role": "owner"}],
  "activeOrg": "org-uuid"
}
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Initialize Spring Boot Kotlin project
- [ ] Configure PostgreSQL + Flyway migrations
- [ ] Create entity classes and repositories
- [ ] Implement multi-tenancy (TenantContext, TenantFilter)

### Phase 2: Auth
- [ ] Configure Spring Security OAuth2
- [ ] Implement JWT generation/validation
- [ ] Add Google, GitHub, Microsoft providers
- [ ] Organization + membership management

### Phase 3: Core API
- [ ] Task CRUD + reordering
- [ ] Subtask management
- [ ] Notebook + Notecard CRUD
- [ ] Check item management
- [ ] Task-Notecard attachment (max 2)

### Phase 4: File Storage
- [ ] Configure MinIO in Docker
- [ ] Implement MinioStorageService (upload, download, delete)
- [ ] Create File entity and repository
- [ ] Build FileController (upload, download URLs)
- [ ] Implement PreviewService:
  - [ ] Image thumbnails (using ImageIO)
  - [ ] CSV/Excel preview (Apache POI)
  - [ ] PDF first page (PDFBox)
  - [ ] Text/code preview (first 50 lines)
- [ ] Async preview generation with events
- [ ] File size validation and quotas

### Phase 5: Real-time
- [ ] Configure WebSocket + STOMP
- [ ] Event publishing on data changes
- [ ] File upload/preview events
- [ ] Redis pub/sub for multi-instance

### Phase 6: User Features
- [ ] User preferences API
- [ ] Scratchpad persistence
- [ ] Query filters and pagination

### Phase 7: Deployment
- [ ] Docker multi-stage build
- [ ] docker-compose for dev/prod (with MinIO)
- [ ] Health checks and monitoring
- [ ] MinIO backup strategy

---

## Key Files to Reference

| File | Purpose |
|------|---------|
| `src/types/index.ts` | Data models to map to entities |
| `src/hooks/useStore.ts` | All CRUD operations needed |
| `src/data/seed.ts` | Sample data for testing |

---

## Verification

1. **Run locally:** `docker-compose up` (starts app, postgres, redis, minio)
2. **Test auth:** Login with Google → verify JWT
3. **Test CRUD:** Create task via API → verify in DB
4. **Test real-time:** Open 2 tabs → create task → verify sync
5. **Test isolation:** Create 2 orgs → verify data separation
6. **Test files:**
   - Upload image → verify thumbnail generated
   - Upload CSV → verify preview data extracted
   - Check MinIO console (localhost:9001) → verify file stored
   - Verify file metadata in PostgreSQL, actual file in MinIO
7. **Test file limits:** Upload >25MB file → verify rejection
