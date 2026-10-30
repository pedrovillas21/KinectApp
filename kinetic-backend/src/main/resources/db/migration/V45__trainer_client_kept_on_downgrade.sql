-- Alunos que o personal escolheu manter ativos quando a carteira passa do limite
-- do plano Grátis; os demais ficam congelados (só leitura para o personal).
ALTER TABLE trainer_clients ADD COLUMN kept_on_downgrade BOOLEAN NOT NULL DEFAULT FALSE;

-- Última troca de alunos ativos já com a carteira congelada (limita a troca a cada 30 dias).
ALTER TABLE trainer_subscriptions ADD COLUMN active_chosen_at TIMESTAMP WITH TIME ZONE;
