CREATE TABLE IF NOT EXISTS user_connections (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status               VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    requester_in_squad   BOOLEAN NOT NULL DEFAULT TRUE,
    addressee_in_squad   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at         TIMESTAMP,
    CONSTRAINT chk_no_self_connection CHECK (requester_id <> addressee_id),
    CONSTRAINT uq_connection_pair UNIQUE (
        LEAST(requester_id::text, addressee_id::text),
        GREATEST(requester_id::text, addressee_id::text)
    )
);

CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON user_connections (requester_id, status);
CREATE INDEX IF NOT EXISTS idx_user_connections_addressee ON user_connections (addressee_id, status);
