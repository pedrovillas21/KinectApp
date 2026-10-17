-- Blindagem do schema public contra acesso direto pela API PostgREST do Supabase.
--
-- Contexto: o Supabase publica todas as tabelas de `public` em /rest/v1/ e concede
-- privilegios default aos roles `anon` e `authenticated`. Como a autorizacao do
-- Kinetic vive inteiramente na aplicacao (JWT + roles ALUNO/PERSONAL/EMPRESA/ROOT),
-- ninguem deve alcancar as tabelas por fora do backend.
--
-- Estrategia: RLS habilitado SEM nenhuma policy = deny-all para todo role comum.
-- O backend conecta como `postgres`, que e dono das tabelas e tem BYPASSRLS, entao
-- continua enxergando tudo normalmente. Por isso NAO usamos FORCE ROW LEVEL
-- SECURITY: forcar RLS no dono nao traria ganho e so criaria risco de quebra.
--
-- Se um dia algum cliente for falar direto com o PostgREST, crie policies
-- explicitas para as tabelas envolvidas em uma migration nova.

DO $$
DECLARE
    tbl record;
    has_api_roles boolean;
BEGIN
    -- `anon` / `authenticated` so existem em bancos Supabase; um Postgres local
    -- (dev/CI) nao tem esses roles e os REVOKE falhariam.
    SELECT count(*) = 2 INTO has_api_roles
      FROM pg_roles WHERE rolname IN ('anon', 'authenticated');

    FOR tbl IN
        SELECT c.relname AS name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relkind IN ('r', 'p')
           -- o Flyway mantem um lock nesta tabela durante a migration;
           -- um ALTER TABLE aqui travaria a propria execucao.
           AND c.relname <> 'flyway_schema_history'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.name);

        IF has_api_roles THEN
            EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', tbl.name);
        END IF;
    END LOOP;

    -- Tabelas criadas por migrations futuras ja nascem sem grants para a API.
    -- Vale apenas para objetos criados pelo role corrente (o mesmo do Flyway).
    IF has_api_roles THEN
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public '
             || 'REVOKE ALL ON TABLES FROM anon, authenticated';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public '
             || 'REVOKE ALL ON SEQUENCES FROM anon, authenticated';
    END IF;
END $$;
