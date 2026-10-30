-- Retenção legal depois da exclusão de conta (LGPD art. 16) e registros que a lei exige.
-- Regra geral: a exclusão continua apagando tudo; só fica o mínimo que uma obrigação
-- legal ou a defesa em processo exige, sem acesso pelo app e com data para sumir.
-- Prazos e bases legais: RETENCAO-DE-DADOS.md, na raiz do repositório.

-- 1. Cobranças pagas ficam no financeiro do personal quando o aluno exclui a conta:
--    são o registro de renda dele para o imposto (CTN art. 173: 5 anos contados do
--    exercício seguinte ao da declaração). Sem o vínculo com a conta: só o nome.
ALTER TABLE student_charges
    ALTER COLUMN student_id DROP NOT NULL,
    ALTER COLUMN plan_id DROP NOT NULL,
    ADD COLUMN student_name VARCHAR(255),
    ADD COLUMN retain_until DATE;

-- Troca o CASCADE por SET NULL. Remove pela coluna, não pelo nome: se sobrasse a FK
-- antiga, a exclusão do aluno continuaria apagando as cobranças em cascata.
DO $$
DECLARE
    fk record;
BEGIN
    FOR fk IN
        SELECT con.conname
          FROM pg_constraint con
          JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
         WHERE con.conrelid = 'public.student_charges'::regclass
           AND con.contype = 'f'
           AND att.attname IN ('student_id', 'plan_id')
    LOOP
        EXECUTE format('ALTER TABLE public.student_charges DROP CONSTRAINT %I', fk.conname);
    END LOOP;
END $$;

ALTER TABLE student_charges
    ADD CONSTRAINT student_charges_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT student_charges_plan_id_fkey
        FOREIGN KEY (plan_id) REFERENCES student_billing_plans(id) ON DELETE SET NULL;

-- Cobrança sem aluno só existe como registro retido (nome guardado e prazo definido).
ALTER TABLE student_charges ADD CONSTRAINT chk_student_charges_retained
    CHECK (student_id IS NOT NULL OR (student_name IS NOT NULL AND retain_until IS NOT NULL));

-- 2. Fichas aprovadas por IA: a declaração do personal ("revisei e assumo a prescrição")
--    e o que foi informado à IA são a prova de quem prescreveu o treino. Ficam 5 anos
--    (CDC art. 27) mesmo se uma das contas for excluída, com o aluno pseudonimizado.
ALTER TABLE ai_plan_generations
    ADD COLUMN trainer_name     VARCHAR(255),
    ADD COLUMN trainer_cref     VARCHAR(40),
    ADD COLUMN student_ref_hash VARCHAR(64),
    ADD COLUMN retain_until     DATE;

-- 3. Contas excluídas. Até identity_until (6 meses) ficam os dados cadastrais, para
--    acompanhar os registros de acesso numa ordem judicial (Marco Civil art. 15 e 22).
--    Depois, só os hashes (HMAC com chave do servidor), o aceite dos termos e o
--    bloqueio por abuso, até retain_until (5 anos).
CREATE TABLE IF NOT EXISTS deleted_accounts (
    user_id             UUID         PRIMARY KEY,
    role                VARCHAR(16)  NOT NULL,
    email               VARCHAR(255),
    nome                VARCHAR(255),
    cpf                 VARCHAR(20),
    phone               VARCHAR(20),
    email_hash          VARCHAR(64)  NOT NULL,
    cpf_hash            VARCHAR(64),
    terms_version       VARCHAR(32),
    terms_accepted_at   TIMESTAMPTZ,
    -- Cliente no gateway de pagamento: para conciliar cobranças e contestações (5 anos).
    gateway_customer_id VARCHAR(64),
    -- Conta bloqueada por abuso: o mesmo e-mail/CPF não cria conta nova enquanto a linha existir.
    blocked             BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_by          VARCHAR(16)  NOT NULL CHECK (deleted_by IN ('TITULAR', 'ADMIN')),
    deleted_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    identity_until      DATE         NOT NULL,
    retain_until        DATE         NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deleted_accounts_email_hash ON deleted_accounts (email_hash);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_cpf_hash ON deleted_accounts (cpf_hash);
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

-- 4. Registros de acesso (Marco Civil art. 15): IP e data/hora de uso, por 6 meses,
--    sob sigilo. Sem FK para users: sobrevivem à exclusão da conta.
CREATE TABLE IF NOT EXISTS access_logs (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     UUID        NOT NULL,
    ip          VARCHAR(45) NOT NULL,
    event       VARCHAR(16) NOT NULL CHECK (event IN ('LOGIN', 'REFRESH', 'ACCESS')),
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs (user_id, accessed_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs (accessed_at);
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- 5. Aceite dos Termos de Uso e da Política de Privacidade (LGPD art. 8 §2: o ônus
--    da prova do consentimento é de quem trata os dados).
ALTER TABLE users
    ADD COLUMN terms_version     VARCHAR(32),
    ADD COLUMN terms_accepted_at TIMESTAMPTZ;
