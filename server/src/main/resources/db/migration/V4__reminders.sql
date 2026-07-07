-- Reminder Framework: Standalone, reusable reminder system
-- Supports polymorphic association (can attach to any entity type)
-- Dates stored as milliseconds (Long) per project convention

CREATE TABLE reminder (
    id              BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL,

    -- Polymorphic association: attach to any entity
    entity_type     VARCHAR(50) NOT NULL,   -- 'task', 'notecard', 'notebook', etc.
    entity_id       VARCHAR(100) NOT NULL,  -- UUID or ID as string for flexibility

    label           VARCHAR(500) NOT NULL,
    due_at          BIGINT NOT NULL,        -- milliseconds since epoch
    fired           BOOLEAN DEFAULT FALSE,
    fired_at        BIGINT,                 -- milliseconds when fired

    -- Optional recurrence (RRULE format or simple: 'daily', 'weekly', 'monthly')
    repeat_rule     VARCHAR(255),

    created_at      BIGINT NOT NULL,        -- milliseconds
    updated_at      BIGINT NOT NULL         -- milliseconds
);

-- Index for querying reminders by entity
CREATE INDEX idx_reminder_entity ON reminder(entity_type, entity_id);

-- Index for scheduler: find due, unfired reminders efficiently
CREATE INDEX idx_reminder_due ON reminder(organization_id, fired, due_at);

-- Index for listing user's reminders
CREATE INDEX idx_reminder_org ON reminder(organization_id, created_at DESC);


-- Web Push Subscriptions: Store browser push endpoints
CREATE TABLE push_subscription (
    id              BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL,

    -- Push API subscription data
    endpoint        TEXT NOT NULL,
    p256dh_key      TEXT NOT NULL,
    auth_key        TEXT NOT NULL,

    -- Optional: user agent for debugging
    user_agent      VARCHAR(500),

    created_at      BIGINT NOT NULL,        -- milliseconds

    -- One endpoint per org (same browser = same endpoint)
    UNIQUE(organization_id, endpoint)
);

CREATE INDEX idx_push_sub_org ON push_subscription(organization_id);
