-- Initial schema for Legacy Modernization Gateway

CREATE TABLE IF NOT EXISTS transformation_logs (
    id          SERIAL PRIMARY KEY,
    adapter     VARCHAR(50)  NOT NULL,
    endpoint    VARCHAR(255) NOT NULL,
    record_count INT         NOT NULL DEFAULT 0,
    success     BOOLEAN      NOT NULL DEFAULT TRUE,
    latency_ms  INTEGER,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(100),
    action      VARCHAR(255) NOT NULL,
    metadata    JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transformation_logs_adapter   ON transformation_logs (adapter);
CREATE INDEX IF NOT EXISTS idx_transformation_logs_created   ON transformation_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created            ON audit_logs (created_at DESC);
