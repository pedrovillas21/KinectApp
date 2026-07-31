-- Fase 2 — Chat personal↔aluno
CREATE TABLE IF NOT EXISTS chat_messages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content       TEXT NOT NULL,
    sent_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at       TIMESTAMP,
    CONSTRAINT chk_no_self_message CHECK (sender_id <> recipient_id)
);

-- Histórico da conversa (par em qualquer direção, ordenado por data).
CREATE INDEX IF NOT EXISTS idx_chat_messages_pair
    ON chat_messages (LEAST(sender_id::text, recipient_id::text),
                      GREATEST(sender_id::text, recipient_id::text),
                      sent_at DESC);

-- Contador de não-lidas: índice parcial só nas mensagens ainda não lidas.
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
    ON chat_messages (recipient_id)
    WHERE read_at IS NULL;
