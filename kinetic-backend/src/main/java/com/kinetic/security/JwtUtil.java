package com.kinetic.security;

import com.kinetic.enums.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    static final String ISSUED_AT_MS_CLAIM = "iat_ms";

    private final SecretKey signingKey;
    private final long expiration;

    public JwtUtil(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration}") long expiration) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expiration = expiration;
    }

    /** Claims de um token com assinatura e validade conferidas; lança JwtException se não forem. */
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Momento da emissão em ms. O iat padrão do JWT só guarda segundos, o que deixaria
     * valendo um token emitido no mesmo segundo da troca de senha; tokens antigos, sem o
     * claim, caem no iat.
     */
    public static Instant issuedAt(Claims claims) {
        Long ms = claims.get(ISSUED_AT_MS_CLAIM, Long.class);
        if (ms != null) {
            return Instant.ofEpochMilli(ms);
        }
        return claims.getIssuedAt() != null ? claims.getIssuedAt().toInstant() : null;
    }

    public String generateToken(String username, Role role) {
        Map<String, Object> claims = new HashMap<>();
        if (role != null) {
            claims.put("role", role.name());
        }
        long now = System.currentTimeMillis();
        claims.put(ISSUED_AT_MS_CLAIM, now);
        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expiration))
                .signWith(signingKey)
                .compact();
    }

    /** Claim que marca um token de etapa intermediária (não serve como access token). */
    public static final String PURPOSE_CLAIM = "purpose";
    public static final String PURPOSE_TOTP = "totp";
    static final long CHALLENGE_TTL_MS = 5 * 60_000L;

    /**
     * Prova de que a senha conferiu, válida por 5 minutos, para a etapa do código do app
     * autenticador. O filtro JWT recusa qualquer token com {@link #PURPOSE_CLAIM}.
     */
    public String generateChallengeToken(String username) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .claims(Map.of(PURPOSE_CLAIM, PURPOSE_TOTP, ISSUED_AT_MS_CLAIM, now))
                .subject(username)
                .issuedAt(new Date(now))
                .expiration(new Date(now + CHALLENGE_TTL_MS))
                .signWith(signingKey)
                .compact();
    }

    /** Dono do desafio TOTP; lança JwtException se o token for inválido, vencido ou de outro tipo. */
    public String extractChallengeSubject(String token) {
        Claims claims = parse(token);
        if (!PURPOSE_TOTP.equals(claims.get(PURPOSE_CLAIM, String.class))) {
            throw new io.jsonwebtoken.JwtException("Token não é de desafio TOTP.");
        }
        return claims.getSubject();
    }
}
