package com.kinetic.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** Mesmo formato do EMAIL_NOT_VERIFIED: código fixo para os clientes reconhecerem o caso. */
    private static final String PHONE_REQUIRED_BODY =
            "{\"code\":\"PHONE_REQUIRED\",\"message\":\"Cadastre seu celular (WhatsApp) para continuar.\"}";

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            jwt = authHeader.substring(7);
            userEmail = jwtUtil.extractUsername(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.customUserDetailsService.loadUserByUsername(userEmail);

                // Compliance: um access token ainda válido de uma conta suspensa/
                // bloqueada é barrado aqui (o token de curta duração não sobrevive
                // ao status). 403 explícito em vez de deixar seguir sem auth.
                if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("Conta suspensa ou bloqueada.");
                    return;
                }

                if (jwtUtil.validateToken(jwt, userDetails.getUsername())) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // Conta antiga sem celular: só passa o necessário para cadastrá-lo.
                    if (userDetails instanceof KineticUserDetails details
                            && details.isPhoneRequired()
                            && !allowedWithoutPhone(request)) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        response.getWriter().write(PHONE_REQUIRED_BODY);
                        return;
                    }

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (io.jsonwebtoken.JwtException | org.springframework.security.core.userdetails.UsernameNotFoundException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Unauthorized: " + e.getMessage());
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * O que uma conta sem celular ainda pode chamar: sessão (refresh/logout), leitura do
     * perfil (os clientes checam o celular por ele) e o próprio cadastro do celular.
     */
    private static boolean allowedWithoutPhone(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        String method = request.getMethod();
        return path.startsWith("/api/auth/")
                || ("GET".equals(method) && "/api/users/profile".equals(path))
                || ("PUT".equals(method) && "/api/users/phone".equals(path));
    }
}
