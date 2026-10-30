package com.kinetic.services;

import com.kinetic.security.Pseudonymizer;
import com.kinetic.dtos.LoginDTO;
import com.kinetic.exceptions.TooManyAttemptsException;
import com.kinetic.repositories.UserRepository;
import com.kinetic.security.InMemoryRateLimiter;
import com.kinetic.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Login limitado por IP + e-mail: outra conta no mesmo IP (Wi-Fi da academia) não é afetada. */
class AuthServiceLoginLimitTest {

    private final AtomicLong now = new AtomicLong(1_000_000);
    private final AuthenticationManager authManager = mock(AuthenticationManager.class);
    private final AuthService service = new AuthService(mock(UserRepository.class), mock(PasswordEncoder.class),
            mock(JwtUtil.class), authManager, mock(RefreshTokenService.class), mock(UserService.class),
            mock(EmailVerificationService.class), mock(TermsService.class), mock(LegalRetentionService.class),
            new InMemoryRateLimiter(now::get), mock(AuditService.class), mock(Pseudonymizer.class));

    @BeforeEach
    void setUp() {
        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("senha errada"));
    }

    @Test
    void bloqueiaAContaNoIpSemAfetarOutrasContasOuIps() {
        for (int i = 0; i < AuthService.LOGIN_ATTEMPTS_PER_MINUTE; i++) {
            assertThrows(BadCredentialsException.class, () -> service.login(login("aluno@x.com"), "1.1.1.1"));
        }
        // Maiúsculas/espaços contam como o mesmo e-mail; o bcrypt nem roda.
        assertThrows(TooManyAttemptsException.class, () -> service.login(login(" Aluno@X.com"), "1.1.1.1"));
        verify(authManager, times(AuthService.LOGIN_ATTEMPTS_PER_MINUTE)).authenticate(any());

        assertThrows(BadCredentialsException.class, () -> service.login(login("outro@x.com"), "1.1.1.1"));
        assertThrows(BadCredentialsException.class, () -> service.login(login("aluno@x.com"), "2.2.2.2"));

        now.addAndGet(AuthService.LOGIN_WINDOW_MS);
        assertThrows(BadCredentialsException.class, () -> service.login(login("aluno@x.com"), "1.1.1.1"));
    }

    private static LoginDTO login(String email) {
        LoginDTO dto = new LoginDTO();
        dto.setEmail(email);
        dto.setSenha("errada");
        return dto;
    }
}
