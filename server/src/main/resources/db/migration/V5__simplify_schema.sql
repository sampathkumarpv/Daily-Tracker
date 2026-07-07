-- V5: Simplify schema for single-user application
-- Changes:
-- 1. Remove organization/user multi-tenancy tables
-- 2. Change UUID PKs to BIGSERIAL (12-digit formatted IDs)
-- 3. Rename tables to PascalCase
-- 4. Rename columns to camelCase
-- 5. All timestamps as BIGINT milliseconds

-- Drop all existing tables (reverse dependency order)
DROP TABLE IF EXISTS push_subscription CASCADE;
DROP TABLE IF EXISTS reminder CASCADE;
DROP TABLE IF EXISTS scratchpads CASCADE;
DROP TABLE IF EXISTS task_notecards CASCADE;
DROP TABLE IF EXISTS subtasks CASCADE;
DROP TABLE IF EXISTS check_items CASCADE;
DROP TABLE IF EXISTS notecards CASCADE;
DROP TABLE IF EXISTS notebooks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Notebook: Collection of notecards
CREATE TABLE "Notebook" (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    color           VARCHAR(50) DEFAULT '#f0eee9',
    description     TEXT,
    position        INT DEFAULT 0,
    "createdAt"     BIGINT NOT NULL,
    "updatedAt"     BIGINT NOT NULL
);

-- Notecard: Notes within notebooks
CREATE TABLE "Notecard" (
    id              BIGSERIAL PRIMARY KEY,
    "notebookId"    BIGINT NOT NULL REFERENCES "Notebook"(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL DEFAULT '',
    content         TEXT DEFAULT '',
    body            TEXT,
    "codeBlock"     TEXT,
    reminder        VARCHAR(255),
    tint            VARCHAR(50) DEFAULT '#fdf2c7',
    position        INT DEFAULT 0,
    "createdAt"     BIGINT NOT NULL,
    "updatedAt"     BIGINT NOT NULL
);

-- CheckItem: Checklist items within notecards
CREATE TABLE "CheckItem" (
    id              BIGSERIAL PRIMARY KEY,
    "notecardId"    BIGINT NOT NULL REFERENCES "Notecard"(id) ON DELETE CASCADE,
    text            VARCHAR(500) NOT NULL,
    done            BOOLEAN DEFAULT FALSE,
    position        INT DEFAULT 0
);

-- Task: Kanban board tasks
CREATE TABLE "Task" (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(500) NOT NULL,
    tag             VARCHAR(100),
    status          VARCHAR(50) NOT NULL DEFAULT 'yts',
    priority        VARCHAR(50),
    "dueDate"       VARCHAR(100),
    description     TEXT,
    area            VARCHAR(100),
    position        INT DEFAULT 0,
    "parentTaskId"  BIGINT REFERENCES "Task"(id) ON DELETE SET NULL,
    "createdAt"     BIGINT NOT NULL,
    "updatedAt"     BIGINT NOT NULL
);

-- Subtask: Checklist items within tasks
CREATE TABLE "Subtask" (
    id              BIGSERIAL PRIMARY KEY,
    "taskId"        BIGINT NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
    text            VARCHAR(500) NOT NULL,
    done            BOOLEAN DEFAULT FALSE,
    position        INT DEFAULT 0
);

-- TaskNotecard: Many-to-many link between tasks and notecards (max 2 per task)
CREATE TABLE "TaskNotecard" (
    "taskId"        BIGINT NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
    "notecardId"    BIGINT NOT NULL REFERENCES "Notecard"(id) ON DELETE CASCADE,
    position        INT DEFAULT 0,
    PRIMARY KEY ("taskId", "notecardId")
);

-- Scratchpad: Single user scratchpad
CREATE TABLE "Scratchpad" (
    id              BIGSERIAL PRIMARY KEY,
    content         TEXT NOT NULL DEFAULT '',
    "updatedAt"     BIGINT NOT NULL
);

-- Seed empty scratchpad
INSERT INTO "Scratchpad" (id, content, "updatedAt") VALUES (1, '', EXTRACT(EPOCH FROM NOW()) * 1000);

-- Reminder: Polymorphic reminders for any entity
CREATE TABLE "Reminder" (
    id              BIGSERIAL PRIMARY KEY,
    "entityType"    VARCHAR(50) NOT NULL,
    "entityId"      BIGINT NOT NULL,
    label           VARCHAR(500) NOT NULL,
    "dueAt"         BIGINT NOT NULL,
    fired           BOOLEAN DEFAULT FALSE,
    "firedAt"       BIGINT,
    "repeatRule"    VARCHAR(255),
    "createdAt"     BIGINT NOT NULL,
    "updatedAt"     BIGINT NOT NULL
);

-- PushSubscription: Web push endpoints
CREATE TABLE "PushSubscription" (
    id              BIGSERIAL PRIMARY KEY,
    endpoint        TEXT NOT NULL UNIQUE,
    "p256dhKey"     TEXT NOT NULL,
    "authKey"       TEXT NOT NULL,
    "userAgent"     VARCHAR(500),
    "createdAt"     BIGINT NOT NULL
);

-- Indexes for performance
CREATE INDEX "idx_Notecard_notebookId" ON "Notecard"("notebookId");
CREATE INDEX "idx_CheckItem_notecardId" ON "CheckItem"("notecardId");
CREATE INDEX "idx_Task_status" ON "Task"(status);
CREATE INDEX "idx_Task_parentTaskId" ON "Task"("parentTaskId");
CREATE INDEX "idx_Subtask_taskId" ON "Subtask"("taskId");
CREATE INDEX "idx_Reminder_entity" ON "Reminder"("entityType", "entityId");
CREATE INDEX "idx_Reminder_due" ON "Reminder"(fired, "dueAt");
