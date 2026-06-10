package com.kinetic.config;

import com.kinetic.services.PresenceService;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final PresenceService presenceService;

    public WebMvcConfig(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(new LastActiveInterceptor(presenceService))
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/**");
    }
}
