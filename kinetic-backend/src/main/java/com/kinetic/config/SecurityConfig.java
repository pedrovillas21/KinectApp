package com.kinetic.config;

import com.kinetic.security.ApiRateLimitFilter;
import com.kinetic.security.AuthRateLimitFilter;
import com.kinetic.security.CustomUserDetailsService;
import com.kinetic.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService customUserDetailsService;

    // Fora do contexto (sem @Component) para não ser registrado de novo como filtro do servlet.
    private final AuthRateLimitFilter authRateLimitFilter = new AuthRateLimitFilter();
    private final ApiRateLimitFilter apiRateLimitFilter = new ApiRateLimitFilter();

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${docs.enabled}")
    private boolean docsEnabled;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Redespacho ASYNC do SSE (/api/trainer/events) ao encerrar: a requisição já foi
                // autorizada no REQUEST; sem isto o stateless perde o contexto e responde 403.
                .dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()
                // Redespacho para /error: sem isto um 404/500 vira 403 e esconde o erro real.
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                // Página pública do link de convite: só leitura (nome/foto do personal).
                .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                // Webhooks de provedores: autenticados por token próprio no controller.
                .requestMatchers(HttpMethod.POST, "/api/webhooks/**").permitAll()
                // Documentação da API (Scalar UI + spec OpenAPI): só com docs.enabled=true.
                .requestMatchers("/docs.html", "/v3/api-docs/**")
                    .access((authentication, context) -> new AuthorizationDecision(docsEnabled))
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider())
            // Depois do CORS: o 429 sai com os cabeçalhos CORS e o painel web consegue ler a mensagem.
            .addFilterAfter(authRateLimitFilter, CorsFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            // Depois do JWT: o limite geral conta por usuário logado (sem login, por IP).
            .addFilterAfter(apiRateLimitFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(s -> s.trim())
                .filter(s -> !s.isEmpty())
                .toList();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        // Necessário para o cookie HttpOnly do refresh token (kinetic-desktop chama
        // /api/auth/* com withCredentials); exige origens explícitas acima — nunca
        // "*" — porque allowCredentials(true) proíbe wildcard.
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
