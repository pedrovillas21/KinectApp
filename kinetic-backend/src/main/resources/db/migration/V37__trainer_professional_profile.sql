-- Perfil profissional do personal: o que o aluno vê em "Seu personal" no app.
-- Uma linha por personal (PK = user_id); some junto com a conta.
CREATE TABLE IF NOT EXISTS trainer_profiles (
    user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    -- Formato 000000-G/UF (validado no backend). Verificação manual pelo Kinetic:
    -- o personal nunca altera cref_verified, e trocar o CREF zera a verificação.
    cref           VARCHAR(16),
    cref_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    bio            VARCHAR(1500),
    specialties    TEXT[] NOT NULL DEFAULT '{}',
    -- Cada item é "título\ndetalhe" (ex.: "Bacharelado em Educação Física\nUFMG · 2018").
    education      TEXT[] NOT NULL DEFAULT '{}',
    modality       VARCHAR(80),
    schedule       VARCHAR(80),
    location       VARCHAR(80),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Mesma blindagem da V21: RLS sem policies, ninguém acessa pela API do Supabase.
-- O REVOKE só roda onde os roles do Supabase existem (Postgres local não tem).
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF (SELECT count(*) = 2 FROM pg_roles WHERE rolname IN ('anon', 'authenticated')) THEN
        REVOKE ALL ON trainer_profiles FROM anon, authenticated;
    END IF;
END $$;
