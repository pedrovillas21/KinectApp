-- Bucket de mídia social passou de público para privado: o app deixa de receber
-- URL permanente e passa a receber URL assinada de curta duração, gerada a cada
-- leitura do feed/stories (depois de a regra de amizade já ter filtrado os posts).
--
-- Para isso, social_posts.image_url deixa de guardar a URL pública completa e
-- passa a guardar apenas a storage key (ex.: "posts/<uuid>.jpg"). Este backfill
-- converte as linhas existentes.
--
-- O nome do bucket vem de env (SUPABASE_STORAGE_BUCKET), entao o padrao casa
-- qualquer bucket em vez de fixar "social-media".
UPDATE social_posts
   SET image_url = regexp_replace(image_url, '^https?://.*/storage/v1/object/public/[^/]+/', '')
 WHERE image_url LIKE 'http%/storage/v1/object/public/%';

-- Nenhuma tabela nova aqui, mas mantendo o contrato do projeto: toda tabela em
-- public fica com RLS habilitado (deny-all) — ver V21__enable_rls_deny_all.sql.
