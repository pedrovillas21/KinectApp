-- Celular do usuário (DDD + número, só dígitos) para o atalho de WhatsApp
-- entre personal e aluno. Nulo para contas antigas e para quem não nasce por
-- auto-cadastro (EMPRESA, ROOT, personal criado pela empresa).
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(11);

ALTER TABLE users
    ADD CONSTRAINT chk_users_phone_format CHECK (phone IS NULL OR phone ~ '^[1-9]{2}9[0-9]{8}$');

-- O chat interno foi substituído pelo atalho de WhatsApp.
DROP TABLE IF EXISTS chat_messages;
