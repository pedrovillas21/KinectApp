package com.kinetic.utils;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Senha forte gerada pelo sistema para contas de gestão criadas por outra pessoa (dono,
 * filial). Cumpre a regra de senha dos DTOs: minúscula, maiúscula, especial, 8 a 20 caracteres.
 */
public final class PasswordGenerator {

    static final int LENGTH = 16;
    // Sem caracteres parecidos (0/O, 1/l/I) para quem digitar a partir do e-mail.
    private static final String LOWER = "abcdefghjkmnpqrstuvwxyz";
    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String DIGITS = "23456789";
    private static final String SPECIAL = "!@#$%*_=+-";
    private static final String ALL = LOWER + UPPER + DIGITS + SPECIAL;

    private static final SecureRandom RANDOM = new SecureRandom();

    private PasswordGenerator() {}

    public static String generate() {
        List<Character> chars = new ArrayList<>();
        chars.add(pick(LOWER));
        chars.add(pick(UPPER));
        chars.add(pick(DIGITS));
        chars.add(pick(SPECIAL));
        while (chars.size() < LENGTH) {
            chars.add(pick(ALL));
        }
        Collections.shuffle(chars, RANDOM);
        StringBuilder out = new StringBuilder();
        chars.forEach(out::append);
        return out.toString();
    }

    private static char pick(String alphabet) {
        return alphabet.charAt(RANDOM.nextInt(alphabet.length()));
    }
}
