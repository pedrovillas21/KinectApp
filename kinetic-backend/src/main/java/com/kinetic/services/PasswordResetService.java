package com.kinetic.services;

import com.kinetic.enums.UserStatus;
import com.kinetic.exceptions.InvalidCodeException;
import com.kinetic.models.PasswordResetCode;
import com.kinetic.models.User;
import com.kinetic.repositories.PasswordResetCodeRepository;
import com.kinetic.repositories.UserRepository;
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
import java.util.Optional;

/**
 * Recuperação de senha por código enviado ao e-mail da conta.
 *
 * <p>O pedido responde sempre igual, exista o e-mail ou não, para não revelar quem
 * tem conta. O código vale 15 minutos, aceita no máximo 5 tentativas erradas e um
 * novo pedido para a mesma conta só é atendido depois de 60 segundos.
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    static final Duration CODE_TTL = Duration.ofMinutes(15);
    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    static final int MAX_ATTEMPTS = 5;

    private static final String INVALID_CODE = "Código inválido ou expirado. Solicite um novo código.";

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Gera e envia um código para o e-mail, se ele pertencer a uma conta ativa.
     * Sem @Transactional de propósito: o envio do e-mail é uma chamada HTTP externa
     * e não deve segurar uma conexão do pool.
     */
    public void requestReset(String email) {
        Optional<User> found = userRepository.findByEmail(email.trim());
        if (found.isEmpty() || found.get().getStatus() != UserStatus.ATIVO) {
            return;
        }
        User user = found.get();

        Optional<PasswordResetCode> existing = codeRepository.findByUser(user);
        if (existing.isPresent()
                && existing.get().getCreatedAt().isAfter(Instant.now().minus(RESEND_COOLDOWN))) {
            return;
        }

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        try {
            codeRepository.deleteByUser(user);
            PasswordResetCode entity = new PasswordResetCode();
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
                .orElseThrow(() -> new InvalidCodeException(INVALID_CODE));
        PasswordResetCode resetCode = codeRepository.findByUser(user)
                .orElseThrow(() -> new InvalidCodeException(INVALID_CODE));

        // A tentativa é contada antes do bcrypt: em rajada paralela, cada requisição
        // espera a anterior e o limite de MAX_ATTEMPTS vale de verdade.
        if (codeRepository.reserveAttempt(resetCode.getId(), MAX_ATTEMPTS, Instant.now()) == 0) {
            codeRepository.deleteByUser(user);
            throw new InvalidCodeException(INVALID_CODE);
        }

        if (!passwordEncoder.matches(code, resetCode.getCodeHash())) {
            if (resetCode.getAttempts() + 1 >= MAX_ATTEMPTS) {
                codeRepository.deleteByUser(user);
            }
            throw new InvalidCodeException(INVALID_CODE);
        }

        codeRepository.deleteByUser(user);
        refreshTokenService.revokeAllForUser(user);
        user.setSenha(passwordEncoder.encode(newPassword));
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

    private String buildText(String nome, String code) {
        return "Olá" + greetingName(nome) + ",\n\n"
                + "Seu código para redefinir a senha do Kinetic é: " + code + "\n\n"
                + "Ele vale por " + CODE_TTL.toMinutes() + " minutos. "
                + "Se você não pediu a troca de senha, ignore este e-mail; sua senha atual continua valendo.";
    }

    private String buildHtml(String nome, String code) {
        return "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:auto\">"
                + "<p>Olá" + escapeHtml(greetingName(nome)) + ",</p>"
                + "<p>Seu código para redefinir a senha do <strong>Kinetic</strong> é:</p>"
                + "<p style=\"font-size:32px;font-weight:bold;letter-spacing:6px\">" + code + "</p>"
                + "<p>Ele vale por " + CODE_TTL.toMinutes() + " minutos.</p>"
                + "<p style=\"color:#666;font-size:13px\">Se você não pediu a troca de senha, ignore este e-mail; "
                + "sua senha atual continua valendo.</p></div>";
    }

    private String greetingName(String nome) {
        return (nome == null || nome.isBlank()) ? "" : " " + nome.trim();
    }

    private String escapeHtml(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
