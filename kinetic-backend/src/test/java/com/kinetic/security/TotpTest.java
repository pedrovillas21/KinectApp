package com.kinetic.security;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** TOTP compatível com os apps autenticadores: vetores do RFC 6238 (SHA1), cortados para 6 dígitos. */
class TotpTest {

    private static final byte[] RFC_KEY = "12345678901234567890".getBytes(StandardCharsets.US_ASCII);

    @Test
    void matchesTheRfc6238Vectors() {
        // RFC: T=59 → 94287082; T=1111111109 → 07081804; T=1234567890 → 89005924 (8 dígitos).
        assertEquals("287082", Totp.code(RFC_KEY, 59 / 30));
        assertEquals("081804", Totp.code(RFC_KEY, 1111111109L / 30));
        assertEquals("005924", Totp.code(RFC_KEY, 1234567890L / 30));
    }

    @Test
    void base32RoundTrip() {
        String encoded = Totp.base32Encode(RFC_KEY);
        assertEquals("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", encoded);
        assertEquals(new String(RFC_KEY, StandardCharsets.US_ASCII),
                new String(Totp.base32Decode(encoded), StandardCharsets.US_ASCII));
    }

    @Test
    void acceptsOneStepOfClockDriftAndNothingBeyond() {
        String secret = Totp.newSecret();
        byte[] key = Totp.base32Decode(secret);
        long now = 1_000_000;

        assertEquals(now - 1, Totp.matchingStep(secret, Totp.code(key, now - 1), now));
        assertEquals(now + 1, Totp.matchingStep(secret, Totp.code(key, now + 1), now));
        assertEquals(-1, Totp.matchingStep(secret, Totp.code(key, now - 3), now));
        assertEquals(-1, Totp.matchingStep(secret, "12ab56", now));
    }

    @Test
    void otpauthUriCarriesIssuerAndSecret() {
        String uri = Totp.otpauthUri("Kinetic", "rede.centro", "ABCDEF");
        assertTrue(uri.startsWith("otpauth://totp/Kinetic:rede.centro?secret=ABCDEF&issuer=Kinetic"));
    }

    @Test
    void cipherRoundTripAndRandomIv() {
        TotpCipher cipher = new TotpCipher("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
        String a = cipher.encrypt("SEGREDO");
        String b = cipher.encrypt("SEGREDO");
        assertEquals("SEGREDO", cipher.decrypt(a));
        assertTrue(!a.equals(b), "cada cifra usa um IV novo");
    }
}
