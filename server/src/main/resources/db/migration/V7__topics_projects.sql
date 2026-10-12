-- Create Topic table (modules/domains user owns)
CREATE TABLE "Topic" (
    "id" BIGSERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20) DEFAULT '#6b7280',
    "description" VARCHAR(500),
    "position" INTEGER DEFAULT 0,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
);

-- Create Project table (features/initiatives within a topic)
CREATE TABLE "Project" (
    "id" BIGSERIAL PRIMARY KEY,
    "name" VARCHAR(200) NOT NULL,
    "topicId" BIGINT NOT NULL REFERENCES "Topic"("id") ON DELETE CASCADE,
    "status" VARCHAR(20) DEFAULT 'active',
    "description" VARCHAR(1000),
    "position" INTEGER DEFAULT 0,
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL
);

-- Add topicId and projectId to Task, remove area
ALTER TABLE "Task" ADD COLUMN "topicId" BIGINT REFERENCES "Topic"("id") ON DELETE SET NULL;
ALTER TABLE "Task" ADD COLUMN "projectId" BIGINT REFERENCES "Project"("id") ON DELETE SET NULL;
ALTER TABLE "Task" DROP COLUMN IF EXISTS "area";

-- Create indexes for efficient queries
CREATE INDEX "idx_project_topic" ON "Project"("topicId");
CREATE INDEX "idx_task_topic" ON "Task"("topicId");
CREATE INDEX "idx_task_project" ON "Task"("projectId");
