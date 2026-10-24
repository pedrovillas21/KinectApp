-- Duração de treino entre 1 s e 6 h, como o @Max do LogSessionRequestDTO: uma sessão de
-- 2 bilhões de segundos colocava o usuário em 1º no ranking dos amigos.
-- NOT VALID: vale para toda gravação nova sem reprovar linhas antigas fora da faixa
-- (confira com SELECT ... WHERE duration_in_seconds NOT BETWEEN 1 AND 21600 e rode
-- VALIDATE CONSTRAINT depois de corrigi-las).
-- A data não entra no CHECK: a janela de 7 dias depende de "hoje" e fica no serviço.
ALTER TABLE workout_sessions
    ADD CONSTRAINT chk_workout_sessions_duration
        CHECK (duration_in_seconds BETWEEN 1 AND 21600) NOT VALID;
