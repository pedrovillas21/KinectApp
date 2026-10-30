-- Trilha de auditoria (painel ROOT → Auditoria) e pedidos de titulares (LGPD art. 18 e 19).
-- Só o que não tem registro próprio: login com sucesso e refresh ficam em access_logs, a
-- exclusão pelo titular em deleted_accounts e a aprovação de ficha por IA em
-- ai_plan_generations. Prazos e bases legais: RETENCAO-DE-DADOS.md.

-- ----------------------------------------------------------------------------
-- 1. Eventos: só inserção
-- ----------------------------------------------------------------------------
-- Sem FK para users nem companies: a exclusão de conta roda DELETE FROM users e a trilha
-- precisa sobreviver a ela. Não guarda nome nem e-mail; os nomes saem de um JOIN na leitura,
-- e o actor_id de uma conta excluída continua ligado a deleted_accounts.user_id (5 anos).
CREATE TABLE IF NOT EXISTS audit_events (
    id           BIGSERIAL    PRIMARY KEY,
    occurred_at  TIMESTAMPTZ  NOT NULL DEFAULT clock_timestamp(),
    category     VARCHAR(16)  NOT NULL CHECK (category IN ('ADMIN', 'SECURITY', 'HEALTH', 'BILLING', 'LGPD')),
    action       VARCHAR(40)  NOT NULL,
    -- Nulos quando o autor é o sistema, o webhook do gateway ou alguém sem login.
    actor_id     UUID,
    actor_role   VARCHAR(16),
    target_type  VARCHAR(24),
    target_id    UUID,
    company_id   UUID,
    ip           VARCHAR(45),
    reason       VARCHAR(500),
    details      JSONB,
    -- Segurança: 6 meses (Marco Civil art. 15); demais: 5 anos (CDC art. 27).
    retain_until DATE         NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events (category, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events (actor_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_target ON audit_events (target_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_retain ON audit_events (retain_until);
-- Leitura de dado de saúde: 1 registro por hora por personal + aluno + tipo de dado.
CREATE INDEX IF NOT EXISTS idx_audit_events_health_hourly
    ON audit_events (actor_id, target_id, action, (details ->> 'kind'), occurred_at)
    WHERE category = 'HEALTH';

-- Imutável: nenhum UPDATE, e DELETE só depois do prazo (o expurgo diário do backend).
CREATE OR REPLACE FUNCTION fn_protect_audit_events()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Evento de auditoria (id=%) é imutável.', OLD.id;
    END IF;
    IF OLD.retain_until >= CURRENT_DATE THEN
        RAISE EXCEPTION 'Evento de auditoria (id=%) ainda está no prazo de guarda (até %).', OLD.id, OLD.retain_until;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_audit_events ON audit_events;
CREATE TRIGGER trg_protect_audit_events
    BEFORE UPDATE OR DELETE ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION fn_protect_audit_events();

-- ----------------------------------------------------------------------------
-- 2. Pedidos de titulares (LGPD art. 18), com o prazo de 15 dias do art. 19, II
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    kind         VARCHAR(16)  NOT NULL CHECK (kind IN ('ACESSO', 'CORRECAO', 'ELIMINACAO', 'REVOGACAO', 'INFORMACAO')),
    received_at  DATE         NOT NULL,
    due_at       DATE         NOT NULL,
    status       VARCHAR(16)  NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'CONCLUIDO')),
    completed_at DATE,
    -- SET NULL: o pedido de eliminação continua como prova depois que a conta sai.
    user_id      UUID         REFERENCES users (id) ON DELETE SET NULL,
    note         VARCHAR(500),
    created_by   UUID,
    retain_until DATE         NOT NULL,
    CONSTRAINT chk_dsr_due CHECK (due_at >= received_at),
    CONSTRAINT chk_dsr_completed CHECK ((status = 'CONCLUIDO') = (completed_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_dsr_status_due ON data_subject_requests (status, due_at);
CREATE INDEX IF NOT EXISTS idx_dsr_user ON data_subject_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_dsr_retain ON data_subject_requests (retain_until);

-- ----------------------------------------------------------------------------
-- 3. Fechamento: acesso só pelo backend
-- ----------------------------------------------------------------------------
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON audit_events, data_subject_requests FROM anon, authenticated;
REVOKE ALL ON SEQUENCE audit_events_id_seq FROM anon, authenticated;
-- Só o trigger chama a função.
REVOKE ALL ON FUNCTION fn_protect_audit_events() FROM PUBLIC, anon, authenticated;
