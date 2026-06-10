-- Índice parcial para a consulta de stories ativas (kind = 'STORY' e não expiradas).
-- As colunas kind/expires_at já existem em social_posts (V10); aqui só otimizamos a leitura.
CREATE INDEX IF NOT EXISTS idx_social_posts_active_stories
    ON social_posts (author_id, expires_at, created_at)
    WHERE kind = 'STORY';
