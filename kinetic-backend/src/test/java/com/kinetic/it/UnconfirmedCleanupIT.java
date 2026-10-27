package com.kinetic.it;

import com.kinetic.enums.Role;
import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import com.kinetic.services.EmailVerificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Job que apaga contas: só some cadastro não confirmado, velho e sem nenhum treino. */
class UnconfirmedCleanupIT extends IntegrationTestBase {

    @Autowired
    private EmailVerificationService emailVerificationService;
    @Autowired
    private UserRepository users;
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void removesOnlyStaleUnconfirmedAccountsWithoutWorkouts() {
        User stale = account(false, 4);
        User recent = account(false, 1);
        User confirmed = account(true, 10);
        User withWorkout = account(false, 4);
        data.exerciseOf(withWorkout);

        emailVerificationService.purgeUnverifiedAccounts();

        assertFalse(users.existsById(stale.getId()));
        assertTrue(users.existsById(recent.getId()));
        assertTrue(users.existsById(confirmed.getId()));
        assertTrue(users.existsById(withWorkout.getId()));
    }

    private User account(boolean emailVerified, int daysOld) {
        User u = data.user(Role.ALUNO);
        jdbc.update("UPDATE users SET email_verified = ?, created_at = now() - make_interval(days => ?) WHERE id = ?",
                emailVerified, daysOld, u.getId());
        return u;
    }
}
