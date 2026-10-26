package com.kinetic.config;

import com.kinetic.services.LegalRetentionService;
import com.kinetic.services.PresenceService;
import com.kinetic.services.TrainerEventService;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final PresenceService presenceService;
    private final TrainerEventService trainerEventService;
    private final LegalRetentionService retentionService;

    public WebMvcConfig(PresenceService presenceService, TrainerEventService trainerEventService,
                        LegalRetentionService retentionService) {
        this.presenceService = presenceService;
        this.trainerEventService = trainerEventService;
        this.retentionService = retentionService;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(new LastActiveInterceptor(presenceService, retentionService))
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/**");
        // Comunidade (posts, curtidas) não aparece no painel do personal.
        registry.addInterceptor(new StudentChangeInterceptor(trainerEventService))
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/**", "/api/social/**");
    }
}
