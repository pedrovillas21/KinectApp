package com.kinetic.services;

import com.kinetic.exceptions.InvalidCodeException;
import com.kinetic.exceptions.TooManyAttemptsException;
import com.kinetic.models.PasswordResetCode;
import com.kinetic.models.User;
import com.kinetic.repositories.PasswordResetCodeRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.security.InMemoryRateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PasswordResetServiceTest {

    private static final String EMAIL = "me@test.local";

    private final UserRepository users = mock(UserRepository.class);
    private final PasswordResetCodeRepository codes = mock(PasswordResetCodeRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final RefreshTokenService refreshTokens = mock(RefreshTokenService.class);
    private final PasswordResetService service = new PasswordResetService(users, codes, encoder, refreshTokens,
            mock(EmailService.class), new InMemoryRateLimiter(System::currentTimeMillis));

    private final User user = new User();
    private final PasswordResetCode code = new PasswordResetCode();

    @BeforeEach
    void setUp() {
        code.setId(UUID.randomUUID());
        code.setCodeHash("hash");
        code.setExpiresAt(Instant.now().plusSeconds(600));
        when(users.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(codes.findByUser(user)).thenReturn(Optional.of(code));
    }

    @Test
    void rejectsWithoutComparingWhenNoAttemptIsLeft() {
        // Outra requisição paralela já consumiu a última tentativa.
        when(codes.reserveAttempt(eq(code.getId()), eq(OneTimeCodes.MAX_ATTEMPTS), any())).thenReturn(0);

        assertThrows(InvalidCodeException.class, () -> service.resetPassword(EMAIL, "123456", "nova-senha"));

        verify(encoder, never()).matches(anyString(), anyString());
        verify(codes).deleteByUser(user);
    }

    @Test
    void wrongCodeBeforeTheLimitKeepsTheCode() {
        when(codes.reserveAttempt(any(), eq(OneTimeCodes.MAX_ATTEMPTS), any())).thenReturn(1);
        when(encoder.matches("000000", "hash")).thenReturn(false);

        assertThrows(InvalidCodeException.class, () -> service.resetPassword(EMAIL, "000000", "nova-senha"));

        verify(codes, never()).deleteByUser(any());
    }

    @Test
    void wrongCodeOnTheLastAttemptDeletesTheCode() {
        code.setAttempts(OneTimeCodes.MAX_ATTEMPTS - 1);
        when(codes.reserveAttempt(any(), eq(OneTimeCodes.MAX_ATTEMPTS), any())).thenReturn(1);
        when(encoder.matches("000000", "hash")).thenReturn(false);

        assertThrows(InvalidCodeException.class, () -> service.resetPassword(EMAIL, "000000", "nova-senha"));

        verify(codes).deleteByUser(user);
    }

    @Test
    void rightCodeChangesPasswordAndConsumesTheCode() {
        when(codes.reserveAttempt(any(), eq(OneTimeCodes.MAX_ATTEMPTS), any())).thenReturn(1);
        when(encoder.matches("123456", "hash")).thenReturn(true);
        when(encoder.encode("nova-senha")).thenReturn("nova-hash");

        service.resetPassword(EMAIL, "123456", "nova-senha");

        verify(codes).deleteByUser(user);
        verify(refreshTokens).revokeAllForUser(user);
        verify(users).save(user);
        // Access tokens emitidos antes da troca deixam de valer (filtro JWT).
        assertNotNull(user.getCredentialsChangedAt());
    }

    @Test
    void newCodesDoNotResetTheAccountGuessLimit() {
        // Cada código novo chega com as 5 tentativas dele, mas o limite da conta segue contando.
        when(codes.reserveAttempt(any(), eq(OneTimeCodes.MAX_ATTEMPTS), any())).thenReturn(1);
        when(encoder.matches(anyString(), eq("hash"))).thenReturn(false);
        for (int i = 0; i < OneTimeCodes.MAX_GUESSES_PER_HOUR; i++) {
            assertThrows(InvalidCodeException.class, () -> service.resetPassword(EMAIL, "000000", "nova-senha"));
        }

        assertThrows(TooManyAttemptsException.class, () -> service.resetPassword(EMAIL, "123456", "nova-senha"));
    }
}
