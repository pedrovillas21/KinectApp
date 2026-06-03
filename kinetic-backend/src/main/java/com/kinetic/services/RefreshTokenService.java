package com.kinetic.services;

import com.kinetic.models.RefreshToken;
import com.kinetic.models.User;
import com.kinetic.repositories.RefreshTokenRepository;
import com.kinetic.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public String createForUser(User user) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setTokenHash(sha256Hex(rawToken));
        entity.setExpiryDate(Instant.now().plusMillis(refreshExpiration));
        refreshTokenRepository.save(entity);

        return rawToken;
    }

    public record RotationResult(String accessToken, String refreshToken) {}

    @Transactional
    public RotationResult rotate(String rawToken) {
        String hash = sha256Hex(rawToken);
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new RuntimeException("Refresh token inválido."));

        // Tokens expirados são rejeitados aqui e varridos pelo purgeExpiredTokens()
        // diário — não apagamos na hora porque o rollback da exceção desfaria o delete.
        if (existing.getExpiryDate().isBefore(Instant.now())) {
            throw new RuntimeException("Refresh token expirado.");
        }

        User user = existing.getUser();
        refreshTokenRepository.delete(existing);

        String newAccessToken = jwtUtil.generateToken(user.getEmail());
        String newRawRefresh = createForUser(user);

        return new RotationResult(newAccessToken, newRawRefresh);
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.deleteByTokenHash(sha256Hex(rawToken));
    }

    @Transactional
    public void revokeAllForUser(User user) {
        refreshTokenRepository.deleteByUser(user);
    }

    /**
     * Remove diariamente às 04:00 (horário do servidor) os refresh tokens já
     * expirados, evitando acúmulo de linhas mortas na tabela. Roda 1h após o
     * job de estatísticas (03:00) para não competir pela thread do scheduler.
     */
    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void purgeExpiredTokens() {
        int deleted = refreshTokenRepository.deleteAllExpired(Instant.now());
        if (deleted > 0) {
            log.info("RefreshTokenService: {} refresh token(s) expirado(s) removido(s).", deleted);
        }
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
