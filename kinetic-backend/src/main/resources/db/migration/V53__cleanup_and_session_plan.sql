-- Limpeza do schema a partir da revisão das migrations (resume/refatoracao-limpeza-2026-10-28.md).

-- ----------------------------------------------------------------------------
-- 1. Índices e constraint sem uso
-- ----------------------------------------------------------------------------

-- Nenhuma query filtra ou ordena por last_active (o UPDATE de presença acha a linha pelo
-- e-mail). Com o índice, esse UPDATE (até 1x/min por usuário ativo) não podia ser HOT.
DROP INDEX IF EXISTS idx_users_last_active;

-- Nenhuma query filtra personal + aluno: as do personal usam (trainer_id, created_at) da V33,
-- as do aluno usam idx_ai_plan_generations_student_id da V25.
DROP INDEX IF EXISTS idx_ai_plan_generations_trainer_student;

-- Coberto por uq_companies_unit_slug (parent_id, slug): todo parent_id = ? usa o índice parcial.
DROP INDEX IF EXISTS idx_companies_parent;

-- Repetia o limite do próprio VARCHAR(80).
ALTER TABLE trainer_invite_codes DROP CONSTRAINT IF EXISTS chk_invite_code_label_length;

-- ----------------------------------------------------------------------------
-- 2. Índices nas FKs das tabelas anteriores ao Flyway
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions (user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_exercise_set_logs_session  ON exercise_set_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_set_logs_exercise ON exercise_set_logs (exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_plan     ON exercises (workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_user_date   ON weight_history (user_id, logged_at);

-- ----------------------------------------------------------------------------
-- 3. Ficha e hora na própria sessão (substitui workout_execution_logs)
-- ----------------------------------------------------------------------------
-- O log de execução só guardava a ficha do treino; data e duração repetiam a sessão.
-- A ficha sai das séries: cada exercício pertence a uma ficha. Sessão que mistura
-- fichas fica sem ficha.

ALTER TABLE workout_sessions
    ADD COLUMN workout_plan_id UUID REFERENCES workout_plans (id) ON DELETE SET NULL,
    ADD COLUMN created_at      TIMESTAMPTZ;

-- logged_at é LocalDateTime.now() do servidor, que roda em UTC.
UPDATE workout_sessions ws
SET workout_plan_id = s.plan_id,
    created_at      = s.saved_at AT TIME ZONE 'UTC'
FROM (
    SELECT sl.session_id,
           CASE WHEN COUNT(DISTINCT e.workout_plan_id) = 1
                THEN MIN(e.workout_plan_id::text)::uuid END AS plan_id,
           MIN(sl.logged_at) AS saved_at
    FROM exercise_set_logs sl
    JOIN exercises e ON e.id = sl.exercise_id
    GROUP BY sl.session_id
) s
WHERE ws.id = s.session_id;

-- Sessão sem série (o DTO exige ao menos uma): meia-noite do dia, no horário do Brasil.
UPDATE workout_sessions
SET created_at = session_date::timestamp AT TIME ZONE 'America/Sao_Paulo'
WHERE created_at IS NULL;

ALTER TABLE workout_sessions
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_sessions_plan
    ON workout_sessions (workout_plan_id) WHERE workout_plan_id IS NOT NULL;

DROP TABLE workout_execution_logs;

-- ----------------------------------------------------------------------------
-- 4. API do Supabase: tabelas da V38, V48 e V49 que só tinham RLS
-- ----------------------------------------------------------------------------

REVOKE ALL ON shedlock, rate_limit_counters, trainer_events, deleted_accounts, access_logs
    FROM anon, authenticated;
REVOKE ALL ON SEQUENCE trainer_events_id_seq, access_logs_id_seq FROM anon, authenticated;
