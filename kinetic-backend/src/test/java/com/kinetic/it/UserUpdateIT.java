package com.kinetic.it;

import com.kinetic.enums.Role;
import com.kinetic.enums.UserStatus;
import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import com.kinetic.services.PresenceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/** Duas requisições mexendo no mesmo usuário: uma não desfaz o que a outra gravou. */
class UserUpdateIT extends IntegrationTestBase {

    @Autowired
    private UserRepository users;
    @Autowired
    private PresenceService presenceService;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private PlatformTransactionManager txManager;

    @Test
    void saveFromEarlierReadDoesNotUndoSuspension() {
        User user = data.user(Role.ALUNO);
        TransactionTemplate other = new TransactionTemplate(txManager);
        other.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        new TransactionTemplate(txManager).executeWithoutResult(tx -> {
            User loaded = users.findById(user.getId()).orElseThrow();
            // O ROOT suspende a conta e confirma enquanto esta transação ainda está aberta.
            other.executeWithoutResult(t -> jdbc.update("UPDATE users SET status = 'SUSPENSO' WHERE id = ?", user.getId()));
            loaded.setNome("Nome novo");
        });

        User saved = users.findById(user.getId()).orElseThrow();
        assertEquals(UserStatus.SUSPENSO, saved.getStatus());
        assertEquals("Nome novo", saved.getNome());
    }

    @Test
    void touchRecordsActivityAtMostOncePerMinute() {
        User user = data.user(Role.ALUNO);
        assertEquals(user.getId(), presenceService.touch(user.getEmail()));
        assertNull(presenceService.touch(user.getEmail()));
    }
}
