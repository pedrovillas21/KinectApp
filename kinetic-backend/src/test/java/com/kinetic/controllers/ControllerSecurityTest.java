package com.kinetic.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.ClassUtils;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Um controller novo (ou um @PreAuthorize apagado) não abre uma área para qualquer papel sem ninguém ver. */
class ControllerSecurityTest {

    /** Sem @PreAuthorize na classe de propósito. Entrar aqui exige motivo. */
    private static final Set<String> OPEN = Set.of(
            // Públicos no SecurityConfig: /api/auth/**, /api/public/**, /api/webhooks/**, /health.
            "AuthController", "PublicInviteController", "AsaasWebhookController", "HealthController",
            // Qualquer conta logada: perfil, app do aluno e comunidade.
            "UserController", "SocialController", "StatsController", "HomeController",
            "WorkoutController", "WorkoutSessionController");

    @Test
    void everyControllerIsGuardedByRoleOrListedAsOpen() {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));

        List<String> unguarded = scanner.findCandidateComponents("com.kinetic.controllers").stream()
                .map(bean -> ClassUtils.resolveClassName(bean.getBeanClassName(), null))
                .filter(type -> !type.isAnnotationPresent(PreAuthorize.class))
                .map(Class::getSimpleName)
                .filter(name -> !OPEN.contains(name))
                .sorted()
                .toList();

        assertEquals(List.of(), unguarded);
    }
}
