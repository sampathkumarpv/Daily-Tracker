# Server Code Rules

## Database Schema Conventions

### Table Names - PascalCase with Quoted Identifiers

**All table names must be PascalCase and quoted in SQL/JPA to preserve case sensitivity in PostgreSQL.**

- Tables: `"Task"`, `"Notebook"`, `"Notecard"`, `"Reminder"`, `"Subtask"`, `"CheckItem"`
- Junction tables: `"TaskNotecard"`
- Always use double quotes in SQL migrations: `CREATE TABLE "Task" (...)`

### Column Names - camelCase

**All column names must be camelCase (no snake_case).**

- Primary keys: `id`
- Foreign keys: `notebookId`, `taskId`, `notecardId`
- Timestamps: `createdAt`, `updatedAt`
- Regular fields: `title`, `dueDate`, `sortOrder`, `checkItems`

### Primary Keys - BIGSERIAL (Auto-increment Long)

**All primary keys use BIGSERIAL (auto-incrementing 64-bit integer), NOT UUID.**

```sql
CREATE TABLE "Task" (
    "id" BIGSERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "notebookId" BIGINT REFERENCES "Notebook"("id"),
    "createdAt" BIGINT NOT NULL
);
```

### JPA Entity Configuration

**Required annotations for case-sensitive table/column names:**

```java
@Entity
@Table(name = "\"Task\"")  // Quoted PascalCase table name
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"id\"")
    private Long id;  // Use Long, not UUID

    @Column(name = "\"notebookId\"")
    private Long notebookId;

    @Column(name = "\"createdAt\"")
    private Long createdAt;
}
```

### Hibernate Naming Strategy

**application.yml must include this to prevent Hibernate from converting to snake_case:**

```yaml
spring:
  jpa:
    hibernate:
      naming:
        physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
```

### Single-User Architecture

**This is a single-user app with database-per-tenant model:**

- NO organization/tenant tables or columns
- NO `organizationId` or `tenantId` fields
- Each user gets their own database instance
- No multi-tenancy filters in queries

---

## Date Storage

**Always store dates as time in milliseconds (Unix timestamp in milliseconds) in the backend.**

- Use `System.currentTimeMillis()` in Java/Kotlin for current time
- Store as `Long` type in database columns
- All date/time fields should be named with `At` suffix (e.g., `createdAt`, `updatedAt`, `timestamp`)
- When receiving dates from clients, expect milliseconds
- When sending dates to clients, return milliseconds

Example:
```java
@Entity
@Table(name = "\"Task\"")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"id\"")
    private Long id;

    @Column(name = "\"title\"")
    private String title;

    @Column(name = "\"createdAt\"")
    private Long createdAt;  // Time in milliseconds

    @Column(name = "\"updatedAt\"")
    private Long updatedAt;  // Time in milliseconds
}
```
