package com.kinetic.services;

import com.kinetic.dtos.AuthResponseDTO;
import com.kinetic.dtos.TotpDTOs;
import com.kinetic.enums.AuditAction;
import com.kinetic.enums.Role;
import com.kinetic.exceptions.InvalidCodeException;
import com.kinetic.exceptions.TooManyAttemptsException;
import com.kinetic.models.TotpRecoveryCode;
import com.kinetic.models.User;
import com.kinetic.repositories.TotpRecoveryCodeRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.security.JwtUtil;
import com.kinetic.security.RateLimiter;
import com.kinetic.security.TotpCipher;
import com.kinetic.security.Totp;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Segundo fator por app autenticador (TOTP) das contas de gestão: DONO, EMPRESA e ROOT.
 *
 * <p>O login com senha certa devolve um token de desafio (5 min). Com ele, o cliente
 * cadastra o app (primeiro acesso) ou manda o código de 6 dígitos, e só então recebe a
 * sessão. O código nasce no celular e nunca trafega por e-mail. Os códigos de recuperação
 * (uso único, só o hash fica no banco) cobrem a perda do aparelho.
 */
@Service
@RequiredArgsConstructor
public class TotpService {

    static final Set<Role> ROLES_WITH_SECOND_FACTOR = Set.of(Role.DONO, Role.EMPRESA, Role.ROOT);
    static final String ISSUER = "Kinetic";
    static final int RECOVERY_CODES = 8;
    /** Erros por conta somando código e recuperação; o reenvio do login não zera. */
    static final int MAX_GUESSES_PER_HOUR = 10;
    static final long GUESS_WINDOW_MS = Duration.ofHours(1).toMillis();

    private static final String INVALID = "Código inválido. Confira o horário do celular e tente o código atual.";
    private static final String EXPIRED = "A etapa de login expirou. Entre com a senha de novo.";
    private static final String RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final UserRepository userRepository;
    private final TotpRecoveryCodeRepository recoveryRepository;
    private final TotpCipher cipher;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final RateLimiter rateLimiter;
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;

    private final SecureRandom random = new SecureRandom();

    public static boolean requiresSecondFactor(User user) {
        return ROLES_WITH_SECOND_FACTOR.contains(user.getRole());
    }

    /**
     * Primeiro acesso: gera o segredo (cifrado no banco) e devolve o endereço do QR code.
     * Chamar de novo antes de confirmar troca o segredo (QR anterior deixa de valer).
     */
    @Transactional
    public TotpDTOs.SetupResponse setup(String challengeToken) {
        User user = challengeUser(challengeToken);
        if (user.getTotpEnabledAt() != null) {
            throw new IllegalArgumentException("O app autenticador já está cadastrado. Digite o código dele.");
        }
        String secret = Totp.newSecret();
        user.setTotpSecret(cipher.encrypt(secret));
        user.setTotpLastStep(null);
        userRepository.save(user);
        String account = user.getUsername() != null ? user.getUsername() : user.getEmail();
        return new TotpDTOs.SetupResponse(Totp.otpauthUri(ISSUER, account, secret), secret);
    }

    /**
     * Confere o código do app e abre a sessão. No primeiro acesso, ativa o segundo fator e
     * devolve os códigos de recuperação (único momento em que aparecem em texto).
     * noRollbackFor: o contador de erros (mesma conexão, via JdbcTemplate) precisa ficar
     * gravado mesmo quando a requisição termina em código errado.
     */
    @Transactional(noRollbackFor = InvalidCodeException.class)
    public TotpDTOs.LoginResponse verify(String challengeToken, String code, String ip) {
        User user = challengeUser(challengeToken);
        if (user.getTotpSecret() == null) {
            throw new IllegalArgumentException("Cadastre o app autenticador antes de digitar o código.");
        }
        countGuess(user);
        long step = Totp.matchingStep(cipher.decrypt(user.getTotpSecret()), code, Totp.currentStep(System.currentTimeMillis()));
        // Mesmo código (ou um mais antigo) não entra de novo: quem o viu de passagem não reaproveita.
        if (step < 0 || (user.getTotpLastStep() != null && step <= user.getTotpLastStep())) {
            recordFailure(user, "CODE");
            throw new InvalidCodeException(INVALID);
        }
        user.setTotpLastStep(step);

        List<String> recoveryCodes = List.of();
        if (user.getTotpEnabledAt() == null) {
            user.setTotpEnabledAt(Instant.now());
            recoveryCodes = newRecoveryCodes(user);
            auditService.record(AuditAction.TOTP_ENABLED, user.getId(), user.getCompanyId(), null, null);
        }
        userRepository.save(user);
        AuthResponseDTO session = authService.issueSession(user, ip);
        return new TotpDTOs.LoginResponse(session, recoveryCodes);
    }

    /** Entra com um código de recuperação (celular perdido) e consome esse código. */
    @Transactional(noRollbackFor = InvalidCodeException.class)
    public TotpDTOs.LoginResponse recover(String challengeToken, String recoveryCode, String ip) {
        User user = challengeUser(challengeToken);
        if (user.getTotpEnabledAt() == null) {
            throw new IllegalArgumentException("Esta conta ainda não cadastrou o app autenticador.");
        }
        countGuess(user);
        String normalized = recoveryCode == null ? "" : recoveryCode.replaceAll("[\\s-]", "").toUpperCase();
        TotpRecoveryCode match = recoveryRepository.findByUserIdAndUsedAtIsNull(user.getId()).stream()
                .filter(c -> passwordEncoder.matches(normalized, c.getCodeHash()))
                .findFirst()
                .orElse(null);
        if (match == null) {
            recordFailure(user, "RECOVERY_CODE");
            throw new InvalidCodeException("Código de recuperação inválido ou já usado.");
        }
        match.setUsedAt(Instant.now());
        recoveryRepository.save(match);
        auditService.record(AuditAction.RECOVERY_CODE_USED, user.getId(), user.getCompanyId(), null, null);
        return new TotpDTOs.LoginResponse(authService.issueSession(user, ip), List.of());
    }

    /**
     * Apaga o segundo fator (celular perdido, troca de responsável): o próximo login volta
     * ao cadastro do app. Encerra as sessões abertas, inclusive os access tokens. Serve o
     * ROOT (motivo obrigatório) e o dono da rede (sem motivo).
     */
    @Transactional
    public void reset(User user, String reason) {
        user.setTotpSecret(null);
        user.setTotpEnabledAt(null);
        user.setTotpLastStep(null);
        user.setCredentialsChangedAt(Instant.now());
        userRepository.save(user);
        recoveryRepository.deleteByUserId(user.getId());
        refreshTokenService.revokeAllForUser(user);
        auditService.record(AuditAction.SECOND_FACTOR_RESET, user.getId(), user.getCompanyId(), reason, null);
    }

    private User challengeUser(String challengeToken) {
        String email;
        try {
            email = jwtUtil.extractChallengeSubject(challengeToken);
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidCodeException(EXPIRED);
        }
        User user = userRepository.findByEmail(email).orElseThrow(() -> new InvalidCodeException(EXPIRED));
        if (!requiresSecondFactor(user)) {
            throw new InvalidCodeException(EXPIRED);
        }
        return user;
    }

    private void countGuess(User user) {
        if (rateLimiter.acquire("totp-guess:" + user.getId(), MAX_GUESSES_PER_HOUR, GUESS_WINDOW_MS) > 0) {
            recordFailure(user, "TOO_MANY_ATTEMPTS");
            throw new TooManyAttemptsException("Muitas tentativas com código errado. Aguarde uma hora e tente de novo.");
        }
    }

    private void recordFailure(User user, String cause) {
        auditService.record(AuditAction.TOTP_FAILED, user.getId(), user.getCompanyId(), null, Map.of("cause", cause));
    }

    private List<String> newRecoveryCodes(User user) {
        recoveryRepository.deleteByUserId(user.getId());
        List<String> plain = new ArrayList<>();
        for (int i = 0; i < RECOVERY_CODES; i++) {
            StringBuilder code = new StringBuilder();
            for (int c = 0; c < 10; c++) {
                code.append(RECOVERY_ALPHABET.charAt(random.nextInt(RECOVERY_ALPHABET.length())));
            }
            TotpRecoveryCode entity = new TotpRecoveryCode();
            entity.setUser(user);
            entity.setCodeHash(passwordEncoder.encode(code.toString()));
            recoveryRepository.save(entity);
            plain.add(code.substring(0, 5) + "-" + code.substring(5));
        }
        return plain;
    }
}
