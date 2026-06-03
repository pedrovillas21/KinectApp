-- Controle de ciclo de vida dos planos: 'active' (vigente) ou 'archived' (regenerado).
-- Planos antigos sao arquivados (nao deletados) ao regenerar, preservando historico/metricas.
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE workout_plans ADD CONSTRAINT chk_workout_plan_status CHECK (status IN ('active', 'archived'));

-- Indice parcial para acelerar a busca do conjunto ativo do usuario.
CREATE INDEX IF NOT EXISTS idx_active_plan ON workout_plans (user_id, status) WHERE status = 'active';
