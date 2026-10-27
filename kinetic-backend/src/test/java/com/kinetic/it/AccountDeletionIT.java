package com.kinetic.it;

import com.kinetic.enums.Role;
import com.kinetic.models.User;
import com.kinetic.services.AccountDeletionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** V52: a ficha de IA aprovada é imutável, mas não pode impedir o aluno de excluir a conta. */
class AccountDeletionIT extends IntegrationTestBase {

    @Autowired
    private AccountDeletionService deletionService;
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void studentWithApprovedAiPlanCanDeleteAccount() {
        User trainer = data.user(Role.PERSONAL);
        User student = data.user(Role.ALUNO);
        UUID generationId = jdbc.queryForObject("""
                INSERT INTO ai_plan_generations
                    (trainer_id, student_id, prompt, ai_output, status, approved_at, approved_plans, declaration_text)
                VALUES (?, ?, 'treino', '{}', 'APPROVED', now(), '[]', ?)
                RETURNING id""", UUID.class,
                trainer.getId(), student.getId(), "Treino adequado para " + student.getNome() + ".");

        deletionService.deleteAccountByAdmin(student.getId());

        assertEquals("Treino adequado para [aluno excluído].", jdbc.queryForObject(
                "SELECT declaration_text FROM ai_plan_generations WHERE id = ?", String.class, generationId));
        // O resto do registro aprovado continua travado pelo trigger.
        assertThrows(DataAccessException.class, () -> jdbc.update(
                "UPDATE ai_plan_generations SET prompt = 'outro' WHERE id = ?", generationId));
    }
}
