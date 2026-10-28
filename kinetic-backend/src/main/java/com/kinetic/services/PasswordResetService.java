package com.kinetic.services;

import com.kinetic.enums.UserStatus;
import com.kinetic.exceptions.InvalidCodeException;
import com.kinetic.models.PasswordResetCode;
import com.kinetic.models.User;
import com.kinetic.repositories.PasswordResetCodeRepository;
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
import java.util.Optional;

/**
 * Recuperação de senha por código enviado ao e-mail da conta.
 *
 * <p>O pedido responde sempre igual, exista o e-mail ou não, para não revelar quem
 * tem conta. O código vale 15 minutos, aceita no máximo 5 tentativas erradas e um
 * novo pedido para a mesma conta só é atendido depois de 60 segundos (regras comuns
 * em {@link OneTimeCodes}).
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    static final Duration CODE_TTL = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final RateLimiter rateLimiter;

    /**
     * Gera e envia um código para o e-mail, se ele pertencer a uma conta ativa.
     * Sem @Transactional de propósito: o envio do e-mail é uma chamada HTTP externa
     * e não deve segurar uma conexão do pool.
     */
    public void requestReset(String email) {
        Optional<User> found = userRepository.findByEmail(email.trim());
        // Filial não recupera a senha sozinha: o dono da rede gera outra (e o e-mail dela é interno).
        if (found.isEmpty() || found.get().getStatus() != UserStatus.ATIVO
                || found.get().getRole() == com.kinetic.enums.Role.EMPRESA) {
            return;
        }
        User user = found.get();

        String code = OneTimeCodes.issue(codeRepository, passwordEncoder, user, PasswordResetCode::new, CODE_TTL);
        if (code == null) {
            return;
        }

        try {
            emailService.send(user.getEmail(), "Seu código de recuperação de senha",
                    buildHtml(user.getNome(), code), buildText(user.getNome(), code));
        } catch (EmailService.EmailDeliveryException e) {
            // A resposta continua uniforme; a falha fica só no log do servidor.
            log.error("Não foi possível enviar o código de recuperação: {}", e.getMessage());
        }
    }

    /**
     * Troca a senha se o código conferir. noRollbackFor: a contagem de tentativas
     * erradas (e a remoção de um código esgotado) precisa ser gravada mesmo quando
     * a requisição termina em erro.
     */
    @Transactional(noRollbackFor = InvalidCodeException.class)
    public void resetPassword(String email, String code, String newPassword) {
        User user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new InvalidCodeException(OneTimeCodes.INVALID_CODE));

        OneTimeCodes.consume(codeRepository, passwordEncoder, rateLimiter, "reset-guess:", user, code);

        refreshTokenService.revokeAllForUser(user);
        user.setSenha(passwordEncoder.encode(newPassword));
        user.setCredentialsChangedAt(Instant.now());
        // Receber o código prova a posse da caixa: também confirma o e-mail. Assim o
        // dono real recupera uma conta que alguém cadastrou com o e-mail dele.
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    /** Remove diariamente às 04:30 os códigos vencidos (30 min após a limpeza de refresh tokens). */
    @Scheduled(cron = "0 30 4 * * *")
    @SchedulerLock(name = "purgeExpiredPasswordResetCodes")
    @Transactional
    public void purgeExpiredCodes() {
        int deleted = codeRepository.deleteAllExpired(Instant.now());
        if (deleted > 0) {
            log.info("PasswordResetService: {} código(s) de recuperação expirado(s) removido(s).", deleted);
        }
    }

    private static final String EMAIL_INTRO = "Recebemos um pedido para redefinir a senha da sua conta Kinetic. Use o código abaixo para criar uma nova senha:";
    private static final String EMAIL_FOOTNOTE = "Se você não pediu a troca de senha, ignore este e-mail: sua senha atual continua valendo.";

    private String buildText(String nome, String code) {
        return EmailTemplates.codeText(nome, EMAIL_INTRO, code, CODE_TTL.toMinutes(), EMAIL_FOOTNOTE);
    }

    private String buildHtml(String nome, String code) {
        return EmailTemplates.codeEmail(nome, "Seu código para redefinir a senha do Kinetic.", "Redefina sua senha", EMAIL_INTRO,
                code, CODE_TTL.toMinutes(), EMAIL_FOOTNOTE);
    }
}
