-- Controle financeiro do personal: mensalidade de cada aluno e as cobranças
-- mensais geradas a partir dela. O dinheiro não passa pelo Kinetic (o aluno
-- paga o personal por Pix, dinheiro etc.); aqui o personal só registra e acompanha.

-- Chave Pix do personal, usada na mensagem de lembrete de cobrança.
ALTER TABLE users ADD COLUMN IF NOT EXISTS pix_key VARCHAR(140);

-- Uma mensalidade por par personal↔aluno; desativar não apaga o histórico.
CREATE TABLE IF NOT EXISTS student_billing_plans (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0 AND amount_cents <= 10000000),
    due_day       SMALLINT NOT NULL CHECK (due_day BETWEEN 1 AND 28),
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    starts_on     DATE NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_billing_plans_pair UNIQUE (trainer_id, student_id)
);

-- Uma cobrança por mensalidade por mês (reference_month = dia 1 do mês).
-- "Atrasada" não é guardado: é PENDENTE com due_date no passado.
CREATE TABLE IF NOT EXISTS student_charges (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id          UUID NOT NULL REFERENCES student_billing_plans(id) ON DELETE CASCADE,
    trainer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reference_month  DATE NOT NULL,
    due_date         DATE NOT NULL,
    amount_cents     INTEGER NOT NULL CHECK (amount_cents > 0),
    status           VARCHAR(16) NOT NULL DEFAULT 'PENDENTE',
    paid_at          DATE,
    payment_method   VARCHAR(16),
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_charges_plan_month UNIQUE (plan_id, reference_month),
    CONSTRAINT chk_student_charges_status CHECK (status IN ('PENDENTE', 'PAGO', 'CANCELADO')),
    CONSTRAINT chk_student_charges_method CHECK (payment_method IS NULL
        OR payment_method IN ('PIX', 'DINHEIRO', 'CARTAO', 'TRANSFERENCIA', 'OUTRO')),
    CONSTRAINT chk_student_charges_month_first_day CHECK (EXTRACT(DAY FROM reference_month) = 1)
);

CREATE INDEX IF NOT EXISTS idx_student_charges_trainer_due ON student_charges (trainer_id, due_date);
CREATE INDEX IF NOT EXISTS idx_student_charges_trainer_month ON student_charges (trainer_id, reference_month);

-- Mesma blindagem da V21: sem policies, ninguém acessa pela API do Supabase.
ALTER TABLE student_billing_plans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON student_billing_plans FROM anon, authenticated;
ALTER TABLE student_charges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON student_charges FROM anon, authenticated;
