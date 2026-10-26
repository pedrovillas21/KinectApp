package com.kinetic.services;

import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class TermsServiceTest {

    private final TermsService terms = new TermsService(mock(UserRepository.class), "2026-10-25");

    @Test
    void contaSemAceiteOuComVersaoAntigaPrecisaAceitar() {
        User user = new User();
        assertFalse(terms.isAccepted(user));

        user.setTermsVersion("2026-01-01");
        assertFalse(terms.isAccepted(user));
    }

    @Test
    void aceiteGravaAVersaoVigenteEAData() {
        User user = new User();
        terms.markAccepted(user);

        assertTrue(terms.isAccepted(user));
        assertNotNull(user.getTermsAcceptedAt());
    }
}
