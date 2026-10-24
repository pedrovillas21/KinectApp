-- Novo plano MAX (até 60 alunos) e apoio à cota mensal de gerações de IA.
ALTER TABLE trainer_subscriptions DROP CONSTRAINT IF EXISTS chk_trainer_subscriptions_plan;
ALTER TABLE trainer_subscriptions
    ADD CONSTRAINT chk_trainer_subscriptions_plan
        CHECK (plan IS NULL OR plan IN ('START', 'PRO', 'PLUS', 'MAX', 'BUSINESS'));

-- A cota do personal conta as prévias geradas no período (por personal, por data).
CREATE INDEX IF NOT EXISTS idx_ai_plan_generations_trainer_created
    ON ai_plan_generations (trainer_id, created_at);

-- A cota do aluno olha a última ficha montada pela IA dele (created_by_id nulo).
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_ai_created
    ON workout_plans (user_id, created_at)
    WHERE created_by_id IS NULL;
