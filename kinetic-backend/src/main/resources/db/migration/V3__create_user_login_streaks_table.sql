-- Registra acessos diários para cálculo de streak consecutivo de login.
-- A constraint UNIQUE impede duplicidade no mesmo dia civil por usuário.
-- NOTA: users.id é UUID — FK deve ser UUID, não BIGINT.
CREATE TABLE user_login_streaks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_date  DATE NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_login_date UNIQUE (user_id, login_date)
);
