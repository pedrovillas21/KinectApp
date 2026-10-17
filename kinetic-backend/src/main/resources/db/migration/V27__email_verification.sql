-- Confirmação de e-mail no cadastro.
--
-- Contas que já existem ficam como confirmadas (DEFAULT TRUE na hora de criar a
-- coluna); daqui em diante toda conta nasce sem confirmação (DEFAULT FALSE) e só
-- consegue fazer login depois de digitar o código enviado ao e-mail.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT FALSE;

-- Código de confirmação: mesmo formato de password_reset_codes (hash BCrypt,
-- um código ativo por usuário, validade curta e limite de tentativas).
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    code_hash   VARCHAR(100) NOT NULL,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts    INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at
    ON email_verification_codes (expires_at);

-- Mesma blindagem da V21: sem policies, ninguém acessa pela API do Supabase.
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON email_verification_codes FROM anon, authenticated;
