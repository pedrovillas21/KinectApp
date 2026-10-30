package com.kinetic.services;

import com.kinetic.exceptions.InvalidCodeException;
import com.kinetic.exceptions.TooManyAttemptsException;
import com.kinetic.models.OneTimeCode;
import com.kinetic.models.User;
import com.kinetic.repositories.OneTimeCodeRepository;
import com.kinetic.security.RateLimiter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Fluxo comum dos códigos de 6 dígitos por e-mail (confirmação de e-mail e recuperação de
 * senha): um código por conta, guardado como hash BCrypt, com intervalo mínimo entre envios,
 * no máximo {@link #MAX_ATTEMPTS} tentativas por código e um limite por conta que sobrevive
 * ao reenvio.
 */
final class OneTimeCodes {

    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    static final int MAX_ATTEMPTS = 5;
    /** Palpites por conta somando todos os códigos da janela (o reenvio não zera). */
    static final int MAX_GUESSES_PER_HOUR = 10;
    static final long GUESS_WINDOW_MS = Duration.ofHours(1).toMillis();

    static final String INVALID_CODE = "Código inválido ou expirado. Solicite um novo código.";
    static final String TOO_MANY_GUESSES = "Muitas tentativas com código errado. Aguarde uma hora e tente de novo.";

    private static final SecureRandom RANDOM = new SecureRandom();

    private OneTimeCodes() {
    }

    /**
     * Gera e grava um código novo para {@code user}, no lugar do anterior. Devolve o código em
     * claro, ou null quando o último saiu há menos de {@link #RESEND_COOLDOWN} ou outro pedido
     * simultâneo já gerou um.
     */
    static <T extends OneTimeCode> String issue(OneTimeCodeRepository<T> repository, PasswordEncoder encoder,
                                                User user, Supplier<T> newCode, Duration ttl) {
        Optional<T> existing = repository.findByUser(user);
        if (existing.isPresent()
                && existing.get().getCreatedAt().isAfter(Instant.now().minus(RESEND_COOLDOWN))) {
            return null;
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        try {
            repository.deleteByUser(user);
            T entity = newCode.get();
            entity.setUser(user);
            entity.setCodeHash(encoder.encode(code));
            entity.setCreatedAt(Instant.now());
            entity.setExpiresAt(Instant.now().plus(ttl));
            entity.setAttempts(0);
            repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            // Dois pedidos simultâneos para a mesma conta: o outro já gerou o código.
            return null;
        }
        return code;
    }

    /**
     * Confere e consome o código de {@code user}. Código ausente, vencido, esgotado ou errado →
     * {@link InvalidCodeException}; palpites demais na janela da conta → {@link TooManyAttemptsException}.
     * Quem chama precisa de noRollbackFor = InvalidCodeException, para a tentativa errada ficar gravada.
     */
    static <T extends OneTimeCode> void consume(OneTimeCodeRepository<T> repository, PasswordEncoder encoder,
                                                RateLimiter rateLimiter, String guessKeyPrefix,
                                                User user, String code) {
        T stored = repository.findByUser(user)
                .orElseThrow(() -> new InvalidCodeException(INVALID_CODE));

        // Limite por conta que sobrevive ao reenvio: cada código novo zera as 5 tentativas
        // dele, mas não este contador (senão daria para adivinhar pedindo códigos sem fim).
        if (rateLimiter.acquire(guessKeyPrefix + user.getId(), MAX_GUESSES_PER_HOUR, GUESS_WINDOW_MS) > 0) {
            throw new TooManyAttemptsException(TOO_MANY_GUESSES);
        }

        // A tentativa é contada antes do bcrypt: em rajada paralela, cada requisição
        // espera a anterior e o limite de MAX_ATTEMPTS vale de verdade.
        if (repository.reserveAttempt(stored.getId(), MAX_ATTEMPTS, Instant.now()) == 0) {
            repository.deleteByUser(user);
            throw new InvalidCodeException(INVALID_CODE);
        }

        if (!encoder.matches(code, stored.getCodeHash())) {
            if (stored.getAttempts() + 1 >= MAX_ATTEMPTS) {
                repository.deleteByUser(user);
            }
            throw new InvalidCodeException(INVALID_CODE);
        }

        repository.deleteByUser(user);
    }
}
