package com.kinetic.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * Limite por IP e rota nas rotas públicas sensíveis de /api/auth (janela fixa de 1 minuto).
 * Complementa os limites por conta (60 s entre códigos, 5 tentativas) dos serviços.
 *
 * O IP vem de getRemoteAddr. Atrás de proxy/load balancer, ligue
 * server.forward-headers-strategy=native para o Tomcat preencher o IP real a partir do
 * X-Forwarded-For; sem isso todos os clientes dividiriam o IP do proxy.
 */
public class AuthRateLimitFilter extends OncePerRequestFilter {

    static final long WINDOW_MS = 60_000;

    // Pedidos por minuto, por IP. O refresh é mais folgado: o app chama sozinho a cada
    // expiração do access token, e alunos na mesma rede (academia) dividem o IP.
    // O login também: o freio fino é por IP + e-mail no AuthService; aqui só corta quem
    // testa muitas contas a partir de um IP.
    private static final Map<String, Integer> LIMITS = Map.of(
            "/api/auth/login", 60,
            "/api/auth/register", 10,
            "/api/auth/totp/setup", 10,
            "/api/auth/totp/verify", 10,
            "/api/auth/totp/recover", 10,
            "/api/auth/forgot-password", 10,
            "/api/auth/reset-password", 10,
            "/api/auth/confirm-email", 10,
            "/api/auth/resend-confirmation", 10,
            "/api/auth/refresh", 60
    );

    private final RateLimiter limiter;

    public AuthRateLimitFilter(RateLimiter limiter) {
        this.limiter = limiter;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        // getServletPath já vem decodificado e normalizado pelo Tomcat (evita driblar com %6Cogin).
        return !LIMITS.containsKey(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        if (!tryAcquire(request.getRemoteAddr(), request.getServletPath())) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(WINDOW_MS / 1000));
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("Muitas tentativas. Aguarde um minuto e tente novamente.");
            return;
        }
        filterChain.doFilter(request, response);
    }

    boolean tryAcquire(String ip, String route) {
        return limiter.acquire(ip + " " + route, LIMITS.getOrDefault(route, 0), WINDOW_MS) == 0;
    }
}
