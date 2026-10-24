package com.kinetic.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.function.LongSupplier;

/**
 * Limite de frequência para o resto da API (o /api/auth tem o {@link AuthRateLimitFilter}).
 * Roda depois do JWT: conta por usuário logado e, sem login, por IP — alunos da mesma
 * academia dividem o IP do Wi-Fi, mas cada um tem o próprio contador.
 *
 * Todo pedido conta no limite geral; as rotas caras ou abusáveis (upload, posts,
 * busca, senha, cobrança...) têm também um limite próprio, mais apertado.
 */
public class ApiRateLimitFilter extends OncePerRequestFilter {

    /** Pedidos por minuto, por usuário (ou IP), somando todas as rotas. */
    static final int GENERAL_LIMIT = 120;
    static final long GENERAL_WINDOW_MS = Duration.ofMinutes(1).toMillis();

    /** method nulo = qualquer método. A primeira regra que casar vale. */
    record Rule(String name, String method, String pattern, int limit, Duration window) {}

    static final List<Rule> RULES = List.of(
            // Upload: cada arquivo (até 10 MB) ocupa o Storage e gasta banda.
            new Rule("upload-midia", "POST", "/api/social/media", 30, Duration.ofHours(1)),
            new Rule("upload-avatar", "PUT", "/api/users/me/avatar", 10, Duration.ofHours(1)),
            // Social: spam de conteúdo e de pedidos de amizade.
            new Rule("post", "POST", "/api/social/posts", 20, Duration.ofHours(1)),
            new Rule("story", "POST", "/api/social/stories", 20, Duration.ofHours(1)),
            new Rule("comentario", "POST", "/api/social/posts/*/comments", 20, Duration.ofMinutes(1)),
            new Rule("curtida", null, "/api/social/posts/*/like", 60, Duration.ofMinutes(1)),
            new Rule("conexao", "POST", "/api/social/connections", 30, Duration.ofHours(1)),
            // Varredura da base de usuários (a busca do app já espera o usuário parar de digitar).
            new Rule("busca", "GET", "/api/social/users/search", 30, Duration.ofMinutes(1)),
            new Rule("perfil", "GET", "/api/social/users/*/*", 60, Duration.ofMinutes(1)),
            // Rotas que conferem a senha atual: força bruta com um token roubado.
            new Rule("troca-senha", "POST", "/api/users/change-password", 5, Duration.ofMinutes(15)),
            new Rule("excluir-conta", "DELETE", "/api/users/me", 5, Duration.ofMinutes(15)),
            // Exportação LGPD: consulta pesada (todos os dados da conta).
            new Rule("exportacao", "GET", "/api/users/me/export", 5, Duration.ofHours(1)),
            // Convites: tentativa de adivinhar códigos e de descobrir e-mails de alunos.
            new Rule("convite-publico", "GET", "/api/public/**", 30, Duration.ofMinutes(1)),
            new Rule("resgate-convite", "POST", "/api/me/invite-codes/redeem", 10, Duration.ofMinutes(15)),
            new Rule("convite-email", "POST", "/api/trainer/invites", 30, Duration.ofHours(1)),
            new Rule("codigo-convite", "POST", "/api/trainer/invite-codes/**", 20, Duration.ofHours(1)),
            // Cobrança: cada pedido cria uma cobrança no gateway de pagamento.
            new Rule("cobranca", "POST", "/api/trainer/billing/subscribe", 10, Duration.ofHours(1)),
            new Rule("pacote-ia", "POST", "/api/trainer/billing/ai-pack", 10, Duration.ofHours(1))
    );

    private static final AntPathMatcher MATCHER = new AntPathMatcher();

    private final FixedWindowRateLimiter limiter;

    public ApiRateLimitFilter() {
        this(System::currentTimeMillis);
    }

    ApiRateLimitFilter(LongSupplier clock) {
        this.limiter = new FixedWindowRateLimiter(clock);
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        // /api/auth tem filtro próprio; webhooks do gateway não podem perder evento por limite.
        return !path.startsWith("/api/")
                || path.startsWith("/api/auth/")
                || path.startsWith("/api/webhooks/")
                || "OPTIONS".equals(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        long waitMs = acquire(subject(request), request.getMethod(), request.getServletPath());
        if (waitMs > 0) {
            long waitSeconds = (waitMs + 999) / 1000;
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(waitSeconds));
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("Muitas requisições em pouco tempo. Tente de novo em " + humanize(waitSeconds) + ".");
            return;
        }
        filterChain.doFilter(request, response);
    }

    /** @return 0 se liberado; senão, ms até poder tentar de novo */
    long acquire(String subject, String method, String path) {
        long waitMs = limiter.acquire(subject + " *", GENERAL_LIMIT, GENERAL_WINDOW_MS);
        for (Rule rule : RULES) {
            if ((rule.method() == null || rule.method().equals(method)) && MATCHER.match(rule.pattern(), path)) {
                waitMs = Math.max(waitMs, limiter.acquire(subject + " " + rule.name(), rule.limit(),
                        rule.window().toMillis()));
                break;
            }
        }
        return waitMs;
    }

    // O IP vem de getRemoteAddr: atrás do Caddy/Cloudflare, depende de
    // server.forward-headers-strategy=native (ver AuthRateLimitFilter).
    private static String subject(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            return "user:" + auth.getName();
        }
        return "ip:" + request.getRemoteAddr();
    }

    private static String humanize(long seconds) {
        if (seconds < 60) {
            return seconds + (seconds == 1 ? " segundo" : " segundos");
        }
        long minutes = (seconds + 59) / 60;
        return minutes + (minutes == 1 ? " minuto" : " minutos");
    }

    int trackedKeys() {
        return limiter.trackedKeys();
    }
}
