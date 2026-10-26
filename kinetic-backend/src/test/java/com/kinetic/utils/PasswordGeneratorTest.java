package com.kinetic.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordGeneratorTest {

    /** Mesma regra de senha dos DTOs (RegisterDTO, ChangePasswordDTO). */
    private static final String RULE = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,20}$";

    @Test
    void alwaysMeetsThePasswordRule() {
        for (int i = 0; i < 500; i++) {
            String password = PasswordGenerator.generate();
            assertTrue(password.matches(RULE), password);
        }
    }
}
