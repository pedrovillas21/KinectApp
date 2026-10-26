package com.kinetic.services;

import com.kinetic.enums.UserStatus;
import com.kinetic.exceptions.InvalidCodeException;
import com.kinetic.exceptions.TooManyAttemptsException;
import com.kinetic.models.EmailVerificationCode;
import com.kinetic.models.User;
import com.kinetic.repositories.EmailVerificationCodeRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.security.RateLimiter;
import com.kinetic.utils.EmailTemplates;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Confirmação de e-mail no cadastro: prova que quem criou a conta é dono da caixa.
 *
 * <p>O código vai por e-mail logo após o cadastro e de novo quando uma conta não
 * confirmada tenta logar com a senha certa. Vale 30 minutos, aceita no máximo 5
 * tentativas erradas e um novo envio para a mesma conta só sai depois de 60 segundos.
 */
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    static final Duration CODE_TTL = Duration.ofMinutes(30);
    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    static final int MAX_ATTEMPTS = 5;

    /** Palpites por conta somando todos os códigos da janela (o reenvio não zera). */
    static final int MAX_GUESSES_PER_HOUR = 10;
    static final long GUESS_WINDOW_MS = Duration.ofHours(1).toMillis();

    private static final String INVALID_CODE = "Código inválido ou expirado. Solicite um novo código.";
    private static final String TOO_MANY_GUESSES = "Muitas tentativas com código errado. Aguarde uma hora e tente de novo.";

    private final UserRepository userRepository;
    private final EmailVerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RateLimiter rateLimiter;

    private final SecureRandom secureRandom = new SecureRandom();

    /** Reenvio pedido pelo cliente: responde igual exista a conta ou não. */
    public void requestCode(String email) {
        userRepository.findByEmail(email.trim()).ifPresent(this::sendCode);
    }

    /**
     * Gera e envia um código se a conta ainda não confirmou o e-mail. Sem
     * @Transactional de propósito: o envio é uma chamada HTTP externa e não deve
     * segurar uma conexão do pool.
     */
    public void sendCode(User user) {
        if (user.isEmailVerified() || user.getStatus() != UserStatus.ATIVO) {
            return;
        }

        Optional<EmailVerificationCode> existing = codeRepository.findByUser(user);
        if (existing.isPresent()
                && existing.get().getCreatedAt().isAfter(Instant.now().minus(RESEND_COOLDOWN))) {
            return;
        }

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        try {
            codeRepository.deleteByUser(user);
            EmailVerificationCode entity = new EmailVerificationCode();
            entity.setUser(user);
            entity.setCodeHash(passwordEncoder.encode(code));
            entity.setCreatedAt(Instant.now());
            entity.setExpiresAt(Instant.now().plus(CODE_TTL));
            entity.setAttempts(0);
            codeRepository.save(entity);
        } catch (DataIntegrityViolationException e) {
            // Dois pedidos simultâneos para a mesma conta: o outro já gerou o código.
            return;
        }

        try {
            emailService.send(user.getEmail(), "Confirme seu e-mail no Kinetic",
                    buildHtml(user.getNome(), code), buildText(user.getNome(), code));
        } catch (EmailService.EmailDeliveryException e) {
            log.error("Não foi possível enviar o código de confirmação de e-mail: {}", e.getMessage());
        }
    }

    /**
     * Marca o e-mail como confirmado se o código conferir. Idempotente para contas
     * já confirmadas. noRollbackFor: a contagem de tentativas erradas precisa ser
     * gravada mesmo quando a requisição termina em erro.
     */
    @Transactional(noRollbackFor = InvalidCodeException.class)
    public void confirm(String email, String code) {
        User user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new InvalidCodeException(INVALID_CODE));
        if (user.isEmailVerified()) {
            return;
        }

        EmailVerificationCode verificationCode = codeRepository.findByUser(user)
                .orElseThrow(() -> new InvalidCodeException(INVALID_CODE));

        // Limite por conta que sobrevive ao reenvio (ver PasswordResetService).
        if (rateLimiter.acquire("confirm-guess:" + user.getId(), MAX_GUESSES_PER_HOUR, GUESS_WINDOW_MS) > 0) {
            throw new TooManyAttemptsException(TOO_MANY_GUESSES);
        }

        // A tentativa é contada antes do bcrypt: em rajada paralela, cada requisição
        // espera a anterior e o limite de MAX_ATTEMPTS vale de verdade.
        if (codeRepository.reserveAttempt(verificationCode.getId(), MAX_ATTEMPTS, Instant.now()) == 0) {
            codeRepository.deleteByUser(user);
            throw new InvalidCodeException(INVALID_CODE);
        }

        if (!passwordEncoder.matches(code, verificationCode.getCodeHash())) {
            if (verificationCode.getAttempts() + 1 >= MAX_ATTEMPTS) {
                codeRepository.deleteByUser(user);
            }
            throw new InvalidCodeException(INVALID_CODE);
        }

        codeRepository.deleteByUser(user);
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    /** Remove diariamente às 04:45 os códigos vencidos. */
    @Scheduled(cron = "0 45 4 * * *")
    @SchedulerLock(name = "purgeExpiredEmailVerificationCodes")
    @Transactional
    public void purgeExpiredCodes() {
        int deleted = codeRepository.deleteAllExpired(Instant.now());
        if (deleted > 0) {
            log.info("EmailVerificationService: {} código(s) de confirmação expirado(s) removido(s).", deleted);
        }
    }

    /** Cadastro não confirmado depois disso é apagado e libera e-mail, celular e CPF. */
    static final Duration UNVERIFIED_ACCOUNT_TTL = Duration.ofDays(3);

    /** Remove diariamente às 05:15 os cadastros que nunca confirmaram o e-mail. */
    @Scheduled(cron = "0 15 5 * * *")
    @SchedulerLock(name = "purgeUnverifiedAccounts")
    @Transactional
    public void purgeUnverifiedAccounts() {
        int deleted = userRepository.deleteStaleUnverified(LocalDateTime.now().minus(UNVERIFIED_ACCOUNT_TTL));
        if (deleted > 0) {
            log.info("EmailVerificationService: {} cadastro(s) não confirmado(s) removido(s).", deleted);
        }
    }

    private static final String EMAIL_INTRO = "Falta pouco para ativar sua conta Kinetic. Use o código abaixo para confirmar seu e-mail:";
    private static final String EMAIL_FOOTNOTE = "Se você não criou uma conta no Kinetic, ignore este e-mail.";

    private String buildText(String nome, String code) {
        return EmailTemplates.codeText(nome, EMAIL_INTRO, code, CODE_TTL.toMinutes(), EMAIL_FOOTNOTE);
    }

    private String buildHtml(String nome, String code) {
        return EmailTemplates.codeEmail(nome, "Seu código para confirmar o e-mail no Kinetic.", "Confirme seu e-mail", EMAIL_INTRO,
                code, CODE_TTL.toMinutes(), EMAIL_FOOTNOTE);
    }
}
