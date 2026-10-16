-- Celular único entre todas as contas (aluno, personal, etc.): é o canal de
-- WhatsApp entre personal e aluno, então dois usuários com o mesmo número
-- mandariam a conversa para a pessoa errada.
--
-- Duplicatas já existentes: a conta mais antiga fica com o número e as demais
-- perdem o celular. Como aluno e personal sem celular são barrados até
-- cadastrar um (PhoneGate / PhoneRequiredScreen), eles informam um número
-- próprio no próximo acesso.
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at NULLS LAST, id) AS rn
    FROM users
    WHERE phone IS NOT NULL
)
UPDATE users u
SET phone = NULL
FROM ranked r
WHERE u.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone ON users (phone) WHERE phone IS NOT NULL;
