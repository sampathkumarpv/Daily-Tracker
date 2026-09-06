# Code Rules

## General Coding Principles

- **Loosely coupled code**: Write reusable, modular code. Components should have minimal dependencies on each other.
- **No hardcoding**: Avoid hardcoding values unless absolutely necessary. Use constants, configuration, or props instead.
- **Proper naming**: Use clear, descriptive names for variables, functions, and files that convey intent.
- **Comments**: Add comments where logic isn't self-evident. Document the "why", not the "what".

---

# Server Code Rules

## API Organization

**Centralize all API endpoints in a common place, organized by modules.**

- Group controllers by module (e.g., `TaskController`, `NotebookController`, `ReminderController`)
- Organize endpoints by HTTP method within each controller
- Use separate files for different modules
- Base path pattern: `/api/v1/{module}`

```
web/rest/
├── TaskController.java        # /api/v1/tasks
├── NotebookController.java    # /api/v1/notebooks
├── NotecardController.java    # /api/v1/notecards
├── ReminderController.java    # /api/v1/reminders
└── ScratchpadController.java  # /api/v1/scratchpad
```

---

## Data Deletion Policy

**NEVER delete data directly from tables. Data deletion is done only by the app server.**

- Use soft deletes where applicable (add `deletedAt` column)
- Mark records as inactive instead of removing them
- Only the application server process handles actual data removal

---

## Database Schema Conventions

### Table Names - PascalCase

**All table names must be PascalCase with first letter capital. Use quoted identifiers in PostgreSQL.**

```sql
✅ "Task", "Notebook", "Notecard", "Reminder"
❌ "task", "TASK", "task_items"
```

### Column Names - camelCase with First Letter Capital for Types

**Column names use camelCase. First letter capital for type references.**

```sql
✅ "id", "title", "dueDate", "createdAt", "notebookId"
❌ "due_date", "created_at", "notebook_id"
```

### Primary Keys and Foreign Keys - Always Long (BIGINT)

**All PK and FK values must be Long (BIGINT/BIGSERIAL), never UUID or Integer.**

```sql
CREATE TABLE "Task" (
    "id" BIGSERIAL PRIMARY KEY,
    "notebookId" BIGINT REFERENCES "Notebook"("id"),
    "parentTaskId" BIGINT REFERENCES "Task"("id")
);
```

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;  // Always Long, never UUID

private Long notebookId;  // FK as Long
```

### Date Storage - Time in Milliseconds (Long)

**Always store dates as time in milliseconds (Unix timestamp) as Long type.**

```java
private Long createdAt;   // System.currentTimeMillis()
private Long updatedAt;   // Time in milliseconds
private Long deletedAt;   // Soft delete timestamp
```

- Use `System.currentTimeMillis()` in Java for current time
- Name timestamp fields with `At` suffix: `createdAt`, `updatedAt`, `timestamp`
- Send/receive milliseconds to/from clients

---

## Query Organization

**Define all queries in one place. Use repository interfaces with named queries.**

```java
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Define queries here, not scattered in services
    List<Task> findByStatus(String status);

    @Query("SELECT t FROM Task t WHERE t.dueDate = :date AND t.status != 'done'")
    List<Task> findPendingByDueDate(@Param("date") String date);

    @Query("SELECT t FROM Task t WHERE t.notebookId = :notebookId ORDER BY t.position")
    List<Task> findByNotebookIdOrdered(@Param("notebookId") Long notebookId);
}
```

- All queries go in Repository interfaces
- Use `@Query` for complex queries
- Services call repository methods, never write raw queries in services

---

## JPA Entity Configuration

**Required annotations for case-sensitive table/column names:**

```java
@Entity
@Table(name = "\"Task\"")  // Quoted PascalCase table name
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "\"notebookId\"")
    private Long notebookId;

    @Column(name = "\"createdAt\"", nullable = false)
    private Long createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private Long updatedAt;

    @PrePersist
    public void prePersist() {
        long now = System.currentTimeMillis();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = System.currentTimeMillis();
    }
}
```

---

## Hibernate Naming Strategy

**application.yml must include this to prevent Hibernate from converting to snake_case:**

```yaml
spring:
  jpa:
    hibernate:
      naming:
        physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
```

---

## Single-User Architecture

**This is a single-user app with database-per-tenant model:**

- NO organization/tenant tables or columns
- NO `organizationId` or `tenantId` fields
- Each user gets their own database instance
- No multi-tenancy filters in queries
