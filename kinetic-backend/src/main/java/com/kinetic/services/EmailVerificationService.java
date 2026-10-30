package com.kinetic.services;

import com.kinetic.enums.AuditAction;
import com.kinetic.enums.UserStatus;
import com.kinetic.exceptions.InvalidCodeException;
import com.kinetic.models.EmailVerificationCode;
import com.kinetic.models.User;
import com.kinetic.repositories.EmailVerificationCodeRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.security.RateLimiter;
import com.kinetic.utils.EmailTemplates;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Confirmação de e-mail no cadastro: prova que quem criou a conta é dono da caixa.
 *
 * <p>O código vai por e-mail logo após o cadastro e de novo quando uma conta não
 * confirmada tenta logar com a senha certa. Vale 30 minutos, aceita no máximo 5
 * tentativas erradas e um novo envio para a mesma conta só sai depois de 60 segundos
 * (regras comuns em {@link OneTimeCodes}).
 */
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    static final Duration CODE_TTL = Duration.ofMinutes(30);

    private final UserRepository userRepository;
    private final EmailVerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RateLimiter rateLimiter;
    private final AuditService auditService;

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

        String code = OneTimeCodes.issue(codeRepository, passwordEncoder, user, EmailVerificationCode::new, CODE_TTL);
        if (code == null) {
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
                .orElseThrow(() -> new InvalidCodeException(OneTimeCodes.INVALID_CODE));
        if (user.isEmailVerified()) {
            return;
        }

        OneTimeCodes.consume(codeRepository, passwordEncoder, rateLimiter, "confirm-guess:", user, code);

        user.setEmailVerified(true);
        userRepository.save(user);
        auditService.record(AuditAction.EMAIL_CONFIRMED, user.getId(), user.getCompanyId(), null, null);
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
