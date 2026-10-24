-- Avaliação física do aluno feita pelo personal: composição corporal e
-- circunferências. Base do gráfico de evolução e do relatório para o aluno.
CREATE TABLE IF NOT EXISTS physical_assessments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trainer_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    assessed_on     DATE NOT NULL,
    weight_kg       DOUBLE PRECISION CHECK (weight_kg IS NULL OR weight_kg BETWEEN 20 AND 400),
    height_cm       DOUBLE PRECISION CHECK (height_cm IS NULL OR height_cm BETWEEN 80 AND 250),
    body_fat_pct    DOUBLE PRECISION CHECK (body_fat_pct IS NULL OR body_fat_pct BETWEEN 2 AND 75),
    muscle_mass_kg  DOUBLE PRECISION CHECK (muscle_mass_kg IS NULL OR muscle_mass_kg BETWEEN 5 AND 200),
    resting_hr      INTEGER CHECK (resting_hr IS NULL OR resting_hr BETWEEN 25 AND 220),
    chest_cm        DOUBLE PRECISION CHECK (chest_cm IS NULL OR chest_cm BETWEEN 20 AND 300),
    waist_cm        DOUBLE PRECISION CHECK (waist_cm IS NULL OR waist_cm BETWEEN 20 AND 300),
    abdomen_cm      DOUBLE PRECISION CHECK (abdomen_cm IS NULL OR abdomen_cm BETWEEN 20 AND 300),
    hip_cm          DOUBLE PRECISION CHECK (hip_cm IS NULL OR hip_cm BETWEEN 20 AND 300),
    arm_right_cm    DOUBLE PRECISION CHECK (arm_right_cm IS NULL OR arm_right_cm BETWEEN 5 AND 150),
    arm_left_cm     DOUBLE PRECISION CHECK (arm_left_cm IS NULL OR arm_left_cm BETWEEN 5 AND 150),
    thigh_right_cm  DOUBLE PRECISION CHECK (thigh_right_cm IS NULL OR thigh_right_cm BETWEEN 10 AND 200),
    thigh_left_cm   DOUBLE PRECISION CHECK (thigh_left_cm IS NULL OR thigh_left_cm BETWEEN 10 AND 200),
    calf_right_cm   DOUBLE PRECISION CHECK (calf_right_cm IS NULL OR calf_right_cm BETWEEN 5 AND 120),
    calf_left_cm    DOUBLE PRECISION CHECK (calf_left_cm IS NULL OR calf_left_cm BETWEEN 5 AND 120),
    notes           VARCHAR(2000),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_physical_assessments_student_date
    ON physical_assessments (student_id, assessed_on);

-- Mesma blindagem da V21: sem policies, ninguém acessa pela API do Supabase.
ALTER TABLE physical_assessments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON physical_assessments FROM anon, authenticated;
