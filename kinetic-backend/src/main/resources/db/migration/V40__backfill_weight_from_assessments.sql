-- Avaliações feitas antes da sincronização (PhysicalAssessmentService.syncBodyMetrics):
-- o peso avaliado vira o ponto do dia no histórico do aluno e o peso/altura atuais.

UPDATE weight_history w
SET weight = l.weight_kg
FROM (
    SELECT DISTINCT ON (student_id, assessed_on) student_id, assessed_on, weight_kg
    FROM physical_assessments
    WHERE weight_kg IS NOT NULL
    ORDER BY student_id, assessed_on, created_at DESC
) l
WHERE w.user_id = l.student_id AND w.logged_at = l.assessed_on;

INSERT INTO weight_history (user_id, weight, logged_at)
SELECT l.student_id, l.weight_kg, l.assessed_on
FROM (
    SELECT DISTINCT ON (student_id, assessed_on) student_id, assessed_on, weight_kg
    FROM physical_assessments
    WHERE weight_kg IS NOT NULL
    ORDER BY student_id, assessed_on, created_at DESC
) l
WHERE NOT EXISTS (
    SELECT 1 FROM weight_history w WHERE w.user_id = l.student_id AND w.logged_at = l.assessed_on
);

UPDATE users u
SET weight = (SELECT w.weight FROM weight_history w WHERE w.user_id = u.id ORDER BY w.logged_at DESC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM physical_assessments a WHERE a.student_id = u.id AND a.weight_kg IS NOT NULL);

UPDATE users u
SET height = (
    SELECT a.height_cm FROM physical_assessments a
    WHERE a.student_id = u.id AND a.height_cm IS NOT NULL
    ORDER BY a.assessed_on DESC, a.created_at DESC LIMIT 1
)
WHERE EXISTS (SELECT 1 FROM physical_assessments a WHERE a.student_id = u.id AND a.height_cm IS NOT NULL);
