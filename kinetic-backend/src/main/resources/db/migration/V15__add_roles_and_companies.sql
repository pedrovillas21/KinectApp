-- Fase 0 — Identidade e Papéis
CREATE TABLE IF NOT EXISTS companies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Backfill automático: todo usuário existente vira ALUNO via DEFAULT.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'ALUNO';
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Consultas por papel (listar personais, agregados por role) via Index Scan.
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
