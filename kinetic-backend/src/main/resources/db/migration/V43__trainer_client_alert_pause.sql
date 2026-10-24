-- Pausa dos alertas de risco de um aluno, com o motivo registrado pelo personal
-- (lesão, viagem, já conversou...). Uma por vínculo: pausar de novo sobrescreve.
ALTER TABLE trainer_clients
    ADD COLUMN alerts_paused_until DATE,
    ADD COLUMN alert_pause_reason  VARCHAR(16)
        CHECK (alert_pause_reason IS NULL OR alert_pause_reason IN ('LESAO', 'VIAGEM', 'CONTATO', 'OUTRO')),
    ADD COLUMN alert_pause_note    VARCHAR(500),
    ADD COLUMN alert_paused_at     TIMESTAMP;
