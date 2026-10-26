-- Correções da rodada 2 da auditoria de segurança (AUDITORIA-SEGURANCA.md).

-- Item 8: access token emitido antes da troca/redefinição de senha deixa de valer.
-- O filtro JWT recusa tokens com iat anterior a este instante.
ALTER TABLE users ADD COLUMN IF NOT EXISTS credentials_changed_at TIMESTAMPTZ;

-- Item 4: a empresa convida; o personal só entra na empresa quando aceitar.
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_company_id UUID
    REFERENCES companies (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_pending_company ON users (pending_company_id)
    WHERE pending_company_id IS NOT NULL;
