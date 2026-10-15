package com.kinetic.services;

import com.kinetic.enums.UserStatus;
import com.kinetic.exceptions.InvalidCodeException;
import com.kinetic.models.EmailVerificationCode;
import com.kinetic.models.User;
import com.kinetic.repositories.EmailVerificationCodeRepository;
import com.kinetic.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
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

    private static final String INVALID_CODE = "Código inválido ou expirado. Solicite um novo código.";

    private final UserRepository userRepository;
    private final EmailVerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

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

        if (verificationCode.getExpiresAt().isBefore(Instant.now())
                || verificationCode.getAttempts() >= MAX_ATTEMPTS) {
            codeRepository.delete(verificationCode);
            throw new InvalidCodeException(INVALID_CODE);
        }

        if (!passwordEncoder.matches(code, verificationCode.getCodeHash())) {
            verificationCode.setAttempts(verificationCode.getAttempts() + 1);
            if (verificationCode.getAttempts() >= MAX_ATTEMPTS) {
                codeRepository.delete(verificationCode);
            } else {
                codeRepository.save(verificationCode);
            }
            throw new InvalidCodeException(INVALID_CODE);
        }

        codeRepository.delete(verificationCode);
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    /** Remove diariamente às 04:45 os códigos vencidos. */
    @Scheduled(cron = "0 45 4 * * *")
    @Transactional
    public void purgeExpiredCodes() {
        int deleted = codeRepository.deleteAllExpired(Instant.now());
        if (deleted > 0) {
            log.info("EmailVerificationService: {} código(s) de confirmação expirado(s) removido(s).", deleted);
        }
    }

    private String buildText(String nome, String code) {
        return "Olá" + greetingName(nome) + ",\n\n"
                + "Seu código para confirmar o e-mail da sua conta Kinetic é: " + code + "\n\n"
                + "Ele vale por " + CODE_TTL.toMinutes() + " minutos. "
                + "Se você não criou uma conta no Kinetic, ignore este e-mail.";
    }

    private String buildHtml(String nome, String code) {
        return "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:auto\">"
                + "<p>Olá" + escapeHtml(greetingName(nome)) + ",</p>"
                + "<p>Seu código para confirmar o e-mail da sua conta <strong>Kinetic</strong> é:</p>"
                + "<p style=\"font-size:32px;font-weight:bold;letter-spacing:6px\">" + code + "</p>"
                + "<p>Ele vale por " + CODE_TTL.toMinutes() + " minutos.</p>"
                + "<p style=\"color:#666;font-size:13px\">Se você não criou uma conta no Kinetic, ignore este e-mail.</p>"
                + "</div>";
    }

    private String greetingName(String nome) {
        return (nome == null || nome.isBlank()) ? "" : " " + nome.trim();
    }

    private String escapeHtml(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
