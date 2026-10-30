package com.kinetic.config;

import com.kinetic.services.LegalRetentionService;
import com.kinetic.services.PresenceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

public class LastActiveInterceptor implements HandlerInterceptor {

    private final PresenceService presenceService;
    private final LegalRetentionService retentionService;

    public LastActiveInterceptor(PresenceService presenceService, LegalRetentionService retentionService) {
        this.presenceService = presenceService;
        this.retentionService = retentionService;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            UUID userId = presenceService.touch(auth.getName());
            // Fora da transação do touch: uma falha no INSERT não derruba a requisição.
            if (userId != null) {
                retentionService.recordAccessHourly(userId, request.getRemoteAddr());
            }
        }
        return true;
    }
}
