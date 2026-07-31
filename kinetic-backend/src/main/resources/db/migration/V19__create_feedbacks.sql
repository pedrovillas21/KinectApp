-- Painel EMPRESA — Feedbacks aluno→empresa sobre um personal.
-- A elegibilidade (vínculo source=COMPANY da empresa) é aplicada na aplicação;
-- aqui garantimos apenas integridade referencial e leitura eficiente por empresa.
CREATE TABLE IF NOT EXISTS feedbacks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    personal_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,
    anonymous    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_company ON feedbacks (company_id, created_at DESC);
