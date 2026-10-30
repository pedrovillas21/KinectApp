-- Exclusão de aluno com ficha de IA aprovada falhava (500): a V49 tira o nome do aluno
-- da declaração retida ("[aluno excluído]"), mas o trigger da V25 trava qualquer
-- mudança em declaration_text depois da aprovação.
--
-- O trigger passa a aceitar essa única mudança, e só no mesmo UPDATE em que o
-- pseudônimo do aluno é gravado (AccountDeletionService.retainApprovedAiGenerations).
-- O pseudônimo, uma vez gravado, não muda mais: a exceção vale uma vez por registro.
-- Todo o resto continua imutável.

CREATE OR REPLACE FUNCTION fn_protect_approved_ai_generation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'APPROVED' AND (
           NEW.status <> 'APPROVED'
        OR NEW.prompt           IS DISTINCT FROM OLD.prompt
        OR NEW.options          IS DISTINCT FROM OLD.options
        OR NEW.ai_output        IS DISTINCT FROM OLD.ai_output
        OR NEW.model            IS DISTINCT FROM OLD.model
        OR NEW.created_at       IS DISTINCT FROM OLD.created_at
        OR NEW.approved_at      IS DISTINCT FROM OLD.approved_at
        OR NEW.approved_plans   IS DISTINCT FROM OLD.approved_plans
        OR NEW.replaced_current IS DISTINCT FROM OLD.replaced_current
        OR (NEW.trainer_id IS NOT NULL AND NEW.trainer_id IS DISTINCT FROM OLD.trainer_id)
        OR (NEW.student_id IS NOT NULL AND NEW.student_id IS DISTINCT FROM OLD.student_id)
        OR (OLD.student_ref_hash IS NOT NULL AND NEW.student_ref_hash IS DISTINCT FROM OLD.student_ref_hash)
        OR (NEW.declaration_text IS DISTINCT FROM OLD.declaration_text AND NOT (
               OLD.student_ref_hash IS NULL
               AND NEW.student_ref_hash IS NOT NULL
               AND position('[aluno excluído]' IN NEW.declaration_text) > 0
           ))
    ) THEN
        RAISE EXCEPTION 'Geração de IA aprovada (id=%) é imutável: é o registro da aprovação.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Só o trigger chama a função; ninguém precisa de EXECUTE direto.
REVOKE ALL ON FUNCTION fn_protect_approved_ai_generation() FROM PUBLIC;
