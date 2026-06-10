package com.kinetic.config;

import com.kinetic.services.PresenceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;

public class LastActiveInterceptor implements HandlerInterceptor {

    private final PresenceService presenceService;

    public LastActiveInterceptor(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            presenceService.touch(auth.getName());
        }
        return true;
    }
}
