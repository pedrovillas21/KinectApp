-- Link de convite do personal para aluno que ainda não tem conta.
--
-- O personal gera um código de uso único e manda o link pelo WhatsApp; o aluno
-- cria a conta no app e resgata o código, o que já cria o vínculo ATIVO (digitar
-- o código é o aceite). O código nunca é guardado em claro: só o SHA-256 dele.
-- Um código vale 7 dias e é consumido no primeiro resgate.
CREATE TABLE IF NOT EXISTS trainer_invite_codes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash    VARCHAR(64) NOT NULL UNIQUE,
    label        VARCHAR(80),
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    redeemed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    redeemed_at  TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_invite_code_label_length CHECK (label IS NULL OR char_length(label) <= 80)
);

CREATE INDEX IF NOT EXISTS idx_trainer_invite_codes_trainer
    ON trainer_invite_codes (trainer_id, redeemed_at);
CREATE INDEX IF NOT EXISTS idx_trainer_invite_codes_expires_at
    ON trainer_invite_codes (expires_at);

-- Vínculo nascido do resgate de um código: nova origem permitida.
ALTER TABLE trainer_clients DROP CONSTRAINT IF EXISTS chk_trainer_clients_source;
ALTER TABLE trainer_clients
    ADD CONSTRAINT chk_trainer_clients_source CHECK (source IN ('INVITE', 'COMPANY', 'INVITE_CODE'));

-- Mesma blindagem da V21: sem policies, ninguém acessa pela API do Supabase.
ALTER TABLE trainer_invite_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON trainer_invite_codes FROM anon, authenticated;
