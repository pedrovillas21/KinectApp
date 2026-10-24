package com.kinetic.config;

import com.kinetic.services.TrainerEventService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * Toda escrita bem-sucedida de um ALUNO (treino concluído, peso, protocolo,
 * vínculo...) avisa o personal dele em tempo real. Roda depois da resposta,
 * quando a transação do service já foi confirmada.
 */
public class StudentChangeInterceptor implements HandlerInterceptor {

    private static final Set<String> WRITES = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final TrainerEventService trainerEventService;

    public StudentChangeInterceptor(TrainerEventService trainerEventService) {
        this.trainerEventService = trainerEventService;
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                @NonNull Object handler, @Nullable Exception ex) {
        if (ex != null || !WRITES.contains(request.getMethod()) || response.getStatus() >= 400) return;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> "ROLE_ALUNO".equals(a.getAuthority()))) return;
        try {
            trainerEventService.studentChanged(auth.getName());
        } catch (RuntimeException e) {
            // Aviso em tempo real é conveniência: nunca derruba a requisição do aluno.
        }
    }
}
