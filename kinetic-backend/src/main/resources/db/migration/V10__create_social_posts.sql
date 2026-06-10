CREATE TABLE IF NOT EXISTS social_posts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_session_id  UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
    kind                VARCHAR(16) NOT NULL DEFAULT 'POST',
    category            VARCHAR(64),
    intensity           VARCHAR(16),
    duration_minutes    INT,
    calories            INT,
    caption             TEXT,
    image_url           VARCHAR(1024),
    badge               VARCHAR(64),
    expires_at          TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_posts_author_created
    ON social_posts (author_id, created_at DESC);
