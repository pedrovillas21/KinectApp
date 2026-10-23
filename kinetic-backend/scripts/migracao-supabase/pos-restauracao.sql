-- Rodar no SQL Editor do projeto NOVO, depois do pg_restore e da cópia do Storage.
-- Troque <ref-antigo> e <ref-novo> pelos IDs dos projetos (o trecho antes de .supabase.co).

-- 1) Fotos de perfil: users.avatar_url guarda a URL pública completa (StorageService.uploadAvatar).
--    As imagens do feed guardam só a key (V22) e não precisam de ajuste.
UPDATE public.users
   SET avatar_url = replace(avatar_url, 'https://<ref-antigo>.supabase.co', 'https://<ref-novo>.supabase.co')
 WHERE avatar_url LIKE 'https://<ref-antigo>.supabase.co/%';

-- 2) Reaplica o bloqueio da Data API (V21/V25): o projeto novo nasce dando acesso
--    aos roles anon/authenticated nas tabelas do schema public.
DO $$
DECLARE t record;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
        EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t.tablename);
    END LOOP;
END $$;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- 3) Conferência: deve voltar zero linhas.
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;
