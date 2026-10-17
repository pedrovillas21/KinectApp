-- Quando um vínculo personal↔aluno foi encerrado (pelo personal ou pela
-- empresa). Base para histórico e, mais adiante, métricas de churn da carteira.
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
