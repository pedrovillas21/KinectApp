-- Estado que antes ficava na memória de cada cópia do backend. Com 2+ cópias, cada
-- uma via só a sua parte; aqui todas leem e escrevem no mesmo lugar.
-- UNLOGGED: não grava WAL a cada requisição. Se o Postgres reiniciar sem desligar
-- direito, as tabelas voltam vazias, o que para contadores e avisos é aceitável.

-- Rate limit da API e tentativas de IA do aluno (PostgresRateLimiter).
CREATE UNLOGGED TABLE IF NOT EXISTS rate_limit_counters (
    key        TEXT    NOT NULL,
    window_end BIGINT  NOT NULL,  -- epoch em ms
    count      INTEGER NOT NULL,
    PRIMARY KEY (key, window_end)
);

ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- Avisos do painel do personal (TrainerEventService): quem grava é a cópia que
-- atendeu o aluno; cada cópia lê os novos e entrega aos painéis conectados nela.
-- clock_timestamp(): hora do INSERT, não do início da transação.
CREATE UNLOGGED TABLE IF NOT EXISTS trainer_events (
    id         BIGSERIAL   PRIMARY KEY,
    trainer_id UUID        NOT NULL,
    type       VARCHAR(32) NOT NULL,
    student_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE trainer_events ENABLE ROW LEVEL SECURITY;
