CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Organizations (tenants) - multi-tenancy ready
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users - multi-user ready
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization membership
CREATE TABLE organization_members (
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    PRIMARY KEY (organization_id, user_id)
);

-- Notebooks
CREATE TABLE notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) DEFAULT '#f0eee9',
    description TEXT,
    position INT DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notecards
CREATE TABLE notecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL DEFAULT '',
    content TEXT DEFAULT '',
    code_block TEXT,
    reminder VARCHAR(255),
    tint VARCHAR(50) DEFAULT '#fdf2c7',
    position INT DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check items (inside notecards)
CREATE TABLE check_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    notecard_id UUID NOT NULL REFERENCES notecards(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    position INT DEFAULT 0
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    tag VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'yts',
    priority VARCHAR(50),
    due_date VARCHAR(100),
    description TEXT,
    area VARCHAR(100),
    position INT DEFAULT 0,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtasks
CREATE TABLE subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    position INT DEFAULT 0
);

-- Task-Notecard link (max 2 per task)
CREATE TABLE task_notecards (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    notecard_id UUID REFERENCES notecards(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    position INT DEFAULT 0,
    PRIMARY KEY (task_id, notecard_id)
);

-- Seed default org and user (for single-user local mode)
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default', 'default');

INSERT INTO users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000002', 'local@taskflow.dev', 'Local User');

INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'owner');
