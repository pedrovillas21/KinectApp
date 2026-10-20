-- Protocolo (objetivo, nível, frequência) e anamnese passam a ser do personal enquanto
-- houver vínculo ativo: registra quem mudou por último e quando o aluno conferiu a anamnese.
ALTER TABLE users
    ADD COLUMN protocol_updated_at TIMESTAMP,
    ADD COLUMN protocol_updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN anamnesis_updated_at TIMESTAMP,
    ADD COLUMN anamnesis_updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN anamnesis_confirmed_at TIMESTAMP;
