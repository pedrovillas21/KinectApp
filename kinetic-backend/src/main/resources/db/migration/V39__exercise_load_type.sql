-- Tipo de carga do exercício: EXTERNAL (peso digitado), BODYWEIGHT (peso do aluno
-- + carga extra) ou NONE (sem carga). Nulo = deduzido do rótulo de carga em tempo
-- de leitura (LoadType.infer); o backfill abaixo usa as mesmas regras.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS load_type VARCHAR(16);

UPDATE exercises SET load_type = CASE
    WHEN weight ILIKE '%corporal%' OR weight ILIKE '%peso do corpo%' OR weight ILIKE '%colete%' THEN 'BODYWEIGHT'
    WHEN weight ILIKE '%sem carga%' OR weight ILIKE '%sem peso%' THEN 'NONE'
    ELSE 'EXTERNAL'
END
WHERE load_type IS NULL;

ALTER TABLE exercises DROP CONSTRAINT IF EXISTS ck_exercises_load_type;
ALTER TABLE exercises ADD CONSTRAINT ck_exercises_load_type
    CHECK (load_type IS NULL OR load_type IN ('EXTERNAL', 'BODYWEIGHT', 'NONE'));
