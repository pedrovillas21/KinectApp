package com.kinetic.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApiRateLimitFilterTest {

    private final AtomicLong now = new AtomicLong(1_000_000);
    private final ApiRateLimitFilter filter = new ApiRateLimitFilter(now::get);

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void limiteGeralContaPorUsuarioENaoPorIp() {
        String path = "/api/trainer/students";
        for (int i = 0; i < ApiRateLimitFilter.GENERAL_LIMIT; i++) {
            assertEquals(0, filter.acquire("user:a@x.com", "GET", path));
        }
        assertTrue(filter.acquire("user:a@x.com", "GET", path) > 0);
        // Outro aluno no mesmo Wi-Fi tem contador próprio.
        assertEquals(0, filter.acquire("user:b@x.com", "GET", path));

        now.addAndGet(ApiRateLimitFilter.GENERAL_WINDOW_MS);
        assertEquals(0, filter.acquire("user:a@x.com", "GET", path));
    }

    @Test
    void rotaSensivelTemLimiteProprioEJanelaPropria() {
        String path = "/api/users/change-password";
        for (int i = 0; i < 5; i++) {
            assertEquals(0, filter.acquire("user:a@x.com", "POST", path));
        }
        long wait = filter.acquire("user:a@x.com", "POST", path);
        assertTrue(wait > 0 && wait <= Duration.ofMinutes(15).toMillis());
        // O limite apertado não afeta as outras rotas do mesmo usuário.
        assertEquals(0, filter.acquire("user:a@x.com", "GET", "/api/users/profile"));

        now.addAndGet(Duration.ofMinutes(15).toMillis());
        assertEquals(0, filter.acquire("user:a@x.com", "POST", path));
    }

    @Test
    void regrasCasamPorMetodoECaminho() {
        assertEquals("comentario", ruleFor("POST", "/api/social/posts/abc/comments"));
        assertEquals("curtida", ruleFor("DELETE", "/api/social/posts/abc/like"));
        assertEquals("busca", ruleFor("GET", "/api/social/users/search"));
        assertEquals("perfil", ruleFor("GET", "/api/social/users/abc/posts"));
        assertEquals("codigo-convite", ruleFor("POST", "/api/trainer/invite-codes"));
        assertEquals("codigo-convite", ruleFor("POST", "/api/trainer/invite-codes/abc/regenerate"));
        assertEquals("convite-publico", ruleFor("GET", "/api/public/invite-codes/ABCDE23456"));
        // Leitura do feed não tem regra própria (só o limite geral).
        assertNull(ruleFor("GET", "/api/social/posts/abc/comments"));
        assertNull(ruleFor("GET", "/api/social/feed"));
    }

    @Test
    void responde429ComRetryAfterUsandoOUsuarioLogado() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("a@x.com", null, List.of()));
        for (int i = 0; i < 5; i++) {
            filter.doFilter(request("DELETE", "/api/users/me", "1.1.1.1"), new MockHttpServletResponse(),
                    new MockFilterChain());
        }
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        MockFilterChain blockedChain = new MockFilterChain();
        filter.doFilter(request("DELETE", "/api/users/me", "2.2.2.2"), blocked, blockedChain);

        assertEquals(429, blocked.getStatus());
        assertEquals(String.valueOf(Duration.ofMinutes(15).toSeconds()), blocked.getHeader("Retry-After"));
        assertTrue(blocked.getContentAsString().contains("15 minutos"));
        assertNull(blockedChain.getRequest());
    }

    @Test
    void semLoginContaPorIpEIgnoraAuthEWebhooks() throws Exception {
        for (int i = 0; i < 30; i++) {
            filter.doFilter(request("GET", "/api/public/invite-codes/X", "1.1.1.1"), new MockHttpServletResponse(),
                    new MockFilterChain());
        }
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(request("GET", "/api/public/invite-codes/X", "1.1.1.1"), blocked, new MockFilterChain());
        assertEquals(429, blocked.getStatus());

        MockFilterChain otherIp = new MockFilterChain();
        filter.doFilter(request("GET", "/api/public/invite-codes/X", "2.2.2.2"), new MockHttpServletResponse(), otherIp);
        assertNotNull(otherIp.getRequest());

        for (String path : List.of("/api/auth/logout", "/api/webhooks/asaas")) {
            MockFilterChain chain = new MockFilterChain();
            for (int i = 0; i < ApiRateLimitFilter.GENERAL_LIMIT + 5; i++) {
                chain = new MockFilterChain();
                filter.doFilter(request("POST", path, "1.1.1.1"), new MockHttpServletResponse(), chain);
            }
            assertNotNull(chain.getRequest(), path);
        }
    }

    private static String ruleFor(String method, String path) {
        var matcher = new org.springframework.util.AntPathMatcher();
        return ApiRateLimitFilter.RULES.stream()
                .filter(r -> (r.method() == null || r.method().equals(method)) && matcher.match(r.pattern(), path))
                .map(ApiRateLimitFilter.Rule::name)
                .findFirst()
                .orElse(null);
    }

    private static MockHttpServletRequest request(String method, String path, String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setServletPath(path);
        request.setRemoteAddr(ip);
        return request;
    }
}
