-- Códigos de recuperação de senha ("esqueci minha senha").
--
-- O código de 6 dígitos vai por e-mail e nunca é guardado em claro: a coluna
-- guarda só o hash BCrypt. Um código ativo por usuário (pedir de novo substitui
-- o anterior), com validade curta e limite de tentativas erradas.
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    code_hash   VARCHAR(100) NOT NULL,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts    INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at
    ON password_reset_codes (expires_at);

-- Mesma blindagem da V21: sem policies, ninguém acessa pela API do Supabase.
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON password_reset_codes FROM anon, authenticated;
