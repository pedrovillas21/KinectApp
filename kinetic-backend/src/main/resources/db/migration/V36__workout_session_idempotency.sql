-- Idempotência do registro de treino: o app gera um id por sessão e o reenvia em
-- toda tentativa de POST /api/sessions/log. Toque duplo, retry da rede ou nova
-- tentativa após timeout caem no mesmo id e não criam um segundo treino.
-- Nulo nas sessões antigas (e em clientes que não mandam o id): o índice parcial
-- só vale quando o id existe.
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS client_session_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_workout_sessions_user_client_session
    ON workout_sessions (user_id, client_session_id)
    WHERE client_session_id IS NOT NULL;
