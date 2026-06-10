ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url       VARCHAR(512),
    ADD COLUMN IF NOT EXISTS last_active      TIMESTAMP,
    ADD COLUMN IF NOT EXISTS active_session_id UUID;

CREATE INDEX IF NOT EXISTS idx_users_last_active ON users (last_active);
