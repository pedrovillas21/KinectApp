package com.kinetic.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PseudonymizerTest {

    private static final String KEY = "chave-de-teste-com-mais-de-32-caracteres!!";
    private final Pseudonymizer pseudonymizer = new Pseudonymizer(KEY);

    @Test
    void mesmoEmailComMaiusculasEEspacosDaOMesmoPseudonimo() {
        assertEquals(pseudonymizer.email("aluno@x.com"), pseudonymizer.email("  Aluno@X.com "));
        assertEquals(64, pseudonymizer.email("aluno@x.com").length());
    }

    @Test
    void cpfComOuSemMascaraDaOMesmoPseudonimo() {
        assertEquals(pseudonymizer.cpf("123.456.789-01"), pseudonymizer.cpf("12345678901"));
        assertNull(pseudonymizer.cpf(null));
        assertNull(pseudonymizer.email(" "));
    }

    @Test
    void outraChaveDaOutroPseudonimo() {
        // Sem a chave do servidor não dá para refazer o hash a partir de um e-mail adivinhado.
        Pseudonymizer other = new Pseudonymizer(KEY + "x");
        assertNotEquals(pseudonymizer.email("aluno@x.com"), other.email("aluno@x.com"));
    }

    @Test
    void chaveAusenteOuCurtaImpedeSubir() {
        assertThrows(IllegalStateException.class, () -> new Pseudonymizer(null));
        assertThrows(IllegalStateException.class, () -> new Pseudonymizer("curta"));
    }
}
