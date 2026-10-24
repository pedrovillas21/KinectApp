-- Planos reestruturados: Grátis (sem assinatura) / Base / Pro ilimitado, mais
-- pacotes avulsos de gerações de IA que não expiram.
ALTER TABLE trainer_subscriptions DROP CONSTRAINT IF EXISTS chk_trainer_subscriptions_plan;
UPDATE trainer_subscriptions SET plan = 'BASE' WHERE plan = 'START';
UPDATE trainer_subscriptions SET plan = 'PRO' WHERE plan IN ('PLUS', 'MAX');
ALTER TABLE trainer_subscriptions
    ADD CONSTRAINT chk_trainer_subscriptions_plan
        CHECK (plan IS NULL OR plan IN ('BASE', 'PRO', 'BUSINESS'));

-- Saldo de gerações extras (usado só depois da cota do plano) e o pacote aguardando pagamento.
ALTER TABLE trainer_subscriptions
    ADD COLUMN ai_extra_credits     INT NOT NULL DEFAULT 0 CHECK (ai_extra_credits >= 0),
    ADD COLUMN ai_pack_payment_id   VARCHAR(64) UNIQUE,
    ADD COLUMN ai_pack_checkout_url VARCHAR(512);
