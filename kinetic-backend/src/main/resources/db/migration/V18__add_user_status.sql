-- Painel ROOT — Compliance: estado da conta (bloquear/suspender/reativar).
-- Backfill automático: toda conta existente vira ATIVO via DEFAULT.
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'ATIVO';

-- Consultas de compliance (listar suspensos/bloqueados) via Index Scan.
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
