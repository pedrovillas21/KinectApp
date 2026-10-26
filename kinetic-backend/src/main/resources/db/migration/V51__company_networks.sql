-- Redes de empresas com filiais, login de filial por usuário e segundo fator (TOTP).
-- Ver AUDITORIA-SEGURANCA.md (item 2) e o plano de redes/filiais.

-- Papel do dono da rede.
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users ADD CONSTRAINT chk_users_role
    CHECK (role IN ('ALUNO', 'PERSONAL', 'EMPRESA', 'DONO', 'ROOT'));

-- Rede (parent_id nulo) e filiais (parent_id = rede). Toda empresa tem CNPJ próprio.
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS parent_id        UUID REFERENCES companies (id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS slug             VARCHAR(40),
    ADD COLUMN IF NOT EXISTS responsible_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_email    VARCHAR(254),
    ADD COLUMN IF NOT EXISTS address          VARCHAR(500),
    ADD COLUMN IF NOT EXISTS phone            VARCHAR(20),
    ADD COLUMN IF NOT EXISTS active           BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE companies ADD CONSTRAINT chk_companies_slug
    CHECK (slug IS NULL OR slug ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$');
-- Slug da rede é único entre as redes; o da filial, dentro da rede.
CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_network_slug ON companies (slug) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_unit_slug ON companies (parent_id, slug) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_parent ON companies (parent_id);

-- Login da filial por usuário (rede.filial). O e-mail da conta da filial é interno.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(81);
ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username);
ALTER TABLE users ADD CONSTRAINT chk_users_username
    CHECK (username IS NULL OR username ~ '^[a-z0-9-]+\.[a-z0-9-]+$');

-- Segundo fator por app autenticador (DONO, EMPRESA e ROOT).
-- totp_secret é cifrado pela aplicação (AES-GCM, chave TOTP_ENCRYPTION_KEY).
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS totp_secret     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS totp_enabled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS totp_last_step  BIGINT;

CREATE TABLE IF NOT EXISTS totp_recovery_codes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code_hash  VARCHAR(100) NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_totp_recovery_user ON totp_recovery_codes (user_id);

-- Mesma blindagem da V21: sem policies, ninguém acessa pela API do Supabase.
-- O DO deixa a migration rodar também num Postgres sem os papéis do Supabase (banco de teste).
ALTER TABLE totp_recovery_codes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON totp_recovery_codes FROM anon, authenticated;
    END IF;
END $$;
