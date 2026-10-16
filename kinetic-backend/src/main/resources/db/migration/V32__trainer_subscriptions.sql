-- Assinatura do personal no Kinetic (B2B2C: o personal paga, o app do aluno é
-- grátis). Um registro por personal, criado no primeiro acesso já em TRIAL.
-- O gateway (Asaas, ou DEMO enquanto não há conta) guarda cliente/assinatura;
-- aqui fica só o necessário para liberar ou travar a carteira.
CREATE TABLE IF NOT EXISTS trainer_subscriptions (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan                     VARCHAR(16),
    status                   VARCHAR(16) NOT NULL,
    trial_ends_at            TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end       TIMESTAMP WITH TIME ZONE,
    canceled_at              TIMESTAMP WITH TIME ZONE,
    gateway                  VARCHAR(16),
    gateway_customer_id      VARCHAR(64),
    gateway_subscription_id  VARCHAR(64) UNIQUE,
    checkout_url             VARCHAR(512),
    created_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_trainer_subscriptions_status
        CHECK (status IN ('TRIAL', 'PENDENTE', 'ATIVA', 'ATRASADA', 'CANCELADA')),
    CONSTRAINT chk_trainer_subscriptions_plan
        CHECK (plan IS NULL OR plan IN ('START', 'PRO', 'PLUS', 'BUSINESS'))
);

-- Idempotência dos webhooks: o gateway reenvia o mesmo evento até receber 200.
CREATE TABLE IF NOT EXISTS billing_webhook_events (
    event_id     VARCHAR(100) PRIMARY KEY,
    received_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Mesma blindagem da V21: sem policies, ninguém acessa pela API do Supabase.
ALTER TABLE trainer_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON trainer_subscriptions FROM anon, authenticated;
ALTER TABLE billing_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing_webhook_events FROM anon, authenticated;
