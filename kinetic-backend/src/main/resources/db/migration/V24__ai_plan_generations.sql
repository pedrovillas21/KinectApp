-- Fichas geradas por IA a pedido do personal (painel desktop).
--
-- Cada geração vira uma prévia que o personal revisa. Nada chega ao app do aluno
-- sem a aprovação dele. A linha guarda o pedido, a resposta da IA e, na aprovação,
-- a versão aprovada e o texto da declaração aceita: é o registro de que o treino
-- foi validado por um profissional.
CREATE TABLE IF NOT EXISTS ai_plan_generations (
    id                UUID PRIMARY KEY,
    -- ON DELETE SET NULL: excluir uma conta não pode apagar o registro de aprovação.
    trainer_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    student_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    prompt            TEXT NOT NULL,
    -- Parâmetros do pedido (quantidade de fichas, duração, nível) em JSON.
    options           TEXT,
    -- Resposta da IA já normalizada, em JSON: o que o personal viu na prévia.
    ai_output         TEXT NOT NULL,
    model             VARCHAR(80),
    -- PREVIEW (aguardando revisão) ou APPROVED.
    status            VARCHAR(20) NOT NULL DEFAULT 'PREVIEW',
    created_at        TIMESTAMP NOT NULL,
    approved_at       TIMESTAMP,
    -- Fichas exatamente como foram aprovadas (inclui edições do personal), em JSON.
    approved_plans    TEXT,
    declaration_text  TEXT,
    replaced_current  BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_ai_plan_generations_trainer_student
    ON ai_plan_generations (trainer_id, student_id, created_at);

-- Mesma blindagem da V21: sem policies, ninguém acessa pela API do Supabase.
ALTER TABLE ai_plan_generations ENABLE ROW LEVEL SECURITY;

-- Ficha aprovada a partir de uma geração por IA (procedência exibida no painel).
ALTER TABLE workout_plans
    ADD COLUMN IF NOT EXISTS ai_generation_id UUID REFERENCES ai_plan_generations(id) ON DELETE SET NULL;
