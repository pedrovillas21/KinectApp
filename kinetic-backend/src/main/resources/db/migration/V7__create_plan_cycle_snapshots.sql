-- Snapshots de ciclos de treino: capturados ao regenerar um plano, permitem comparar
-- o ciclo encerrado (archived) contra o ciclo atual (active).
CREATE TABLE IF NOT EXISTS plan_cycle_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    cycle_start_date    DATE NOT NULL,
    cycle_end_date      DATE NOT NULL,
    goal                VARCHAR(255) NOT NULL,
    end_weight          DOUBLE PRECISION,
    total_volume        DOUBLE PRECISION,
    completed_sessions  INT,
    target_sessions     INT,
    adherence_percentage INT,
    volume_by_muscle    TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plan_cycle_snapshots_user_cycle
    ON plan_cycle_snapshots (user_id, cycle_end_date DESC);
