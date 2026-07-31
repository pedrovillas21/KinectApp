-- Fase 1 — Vínculo personal↔aluno (convite / atribuição por empresa)
CREATE TABLE IF NOT EXISTS trainer_clients (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        VARCHAR(16) NOT NULL DEFAULT 'PENDENTE',
    source        VARCHAR(16) NOT NULL DEFAULT 'INVITE',
    company_id    UUID REFERENCES companies(id),
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at  TIMESTAMP,
    CONSTRAINT chk_no_self_link CHECK (trainer_id <> student_id)
);

-- Blindagem de concorrência: o banco é a última linha de defesa da regra
-- "1 personal ATIVO por aluno" — dois aceites/atribuições simultâneos não
-- passam ambos, mesmo que a validação da aplicação tenha lido antes do commit.
CREATE UNIQUE INDEX IF NOT EXISTS uq_trainer_clients_one_active_per_student
    ON trainer_clients (student_id)
    WHERE status = 'ATIVO';

-- Evita convites PENDENTES duplicados do mesmo personal para o mesmo aluno.
CREATE UNIQUE INDEX IF NOT EXISTS uq_trainer_clients_pending_pair
    ON trainer_clients (trainer_id, student_id)
    WHERE status = 'PENDENTE';

CREATE INDEX IF NOT EXISTS idx_trainer_clients_trainer ON trainer_clients (trainer_id, status);
CREATE INDEX IF NOT EXISTS idx_trainer_clients_student ON trainer_clients (student_id, status);
