package com.kinetic.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthRateLimitFilterTest {

    private static final String ROUTE = "/api/auth/register";

    private final AtomicLong now = new AtomicLong(1_000_000);
    private final AuthRateLimitFilter filter = new AuthRateLimitFilter(new InMemoryRateLimiter(now::get));

    @Test
    void bloqueiaDepoisDoLimiteEPorIpERota() {
        for (int i = 0; i < 10; i++) {
            assertTrue(filter.tryAcquire("1.1.1.1", ROUTE));
        }
        assertFalse(filter.tryAcquire("1.1.1.1", ROUTE));
        // Outro IP e outra rota têm contadores próprios.
        assertTrue(filter.tryAcquire("2.2.2.2", ROUTE));
        assertTrue(filter.tryAcquire("1.1.1.1", "/api/auth/forgot-password"));
    }

    @Test
    void liberaNaJanelaSeguinte() {
        for (int i = 0; i < 11; i++) {
            filter.tryAcquire("1.1.1.1", ROUTE);
        }
        assertFalse(filter.tryAcquire("1.1.1.1", ROUTE));

        now.addAndGet(AuthRateLimitFilter.WINDOW_MS);

        assertTrue(filter.tryAcquire("1.1.1.1", ROUTE));
    }

    @Test
    void responde429NaRotaSensivelEIgnoraAsDemais() throws Exception {
        for (int i = 0; i < 10; i++) {
            filter.doFilter(request(ROUTE), new MockHttpServletResponse(), new MockFilterChain());
        }
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        MockFilterChain blockedChain = new MockFilterChain();
        filter.doFilter(request(ROUTE), blocked, blockedChain);
        assertEquals(429, blocked.getStatus());
        assertNull(blockedChain.getRequest());

        MockFilterChain otherChain = new MockFilterChain();
        for (int i = 0; i < 20; i++) {
            otherChain = new MockFilterChain();
            filter.doFilter(request("/api/auth/logout"), new MockHttpServletResponse(), otherChain);
        }
        assertNotNull(otherChain.getRequest());
    }

    private static MockHttpServletRequest request(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setServletPath(path);
        request.setRemoteAddr("1.1.1.1");
        return request;
    }
}
