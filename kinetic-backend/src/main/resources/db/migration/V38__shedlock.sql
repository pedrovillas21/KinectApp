-- Lock dos jobs @Scheduled (ShedLock): com várias réplicas do backend, cada job
-- roda em uma só instância por disparo. Tabela no formato padrão do
-- JdbcTemplateLockProvider; só o backend (service role) acessa.
CREATE TABLE IF NOT EXISTS shedlock (
    name       VARCHAR(64)  NOT NULL PRIMARY KEY,
    lock_until TIMESTAMP    NOT NULL,
    locked_at  TIMESTAMP    NOT NULL,
    locked_by  VARCHAR(255) NOT NULL
);

ALTER TABLE shedlock ENABLE ROW LEVEL SECURITY;
