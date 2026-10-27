package com.kinetic.security;

import io.jsonwebtoken.Claims;
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
    private static final String TERMS_REQUIRED_BODY =
            "{\"code\":\"TERMS_REQUIRED\",\"message\":\"Aceite os Termos de Uso e a Política de Privacidade para continuar.\"}";

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Uma leitura só: assinatura e validade conferidas aqui valem para as checagens abaixo.
            Claims claims = jwtUtil.parse(authHeader.substring(7));
            // Token de desafio (senha certa, falta o código do app autenticador) não dá acesso.
            if (claims.get(JwtUtil.PURPOSE_CLAIM) != null) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Unauthorized: falta o código do app autenticador.");
                return;
            }
            String userEmail = claims.getSubject();

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

                // Senha trocada/redefinida depois da emissão: o token pode estar com quem
                // motivou a troca. Mesmo 401 de token inválido, para o cliente renovar ou sair.
                if (userDetails instanceof KineticUserDetails details
                        && details.isIssuedBeforeCredentialsChange(JwtUtil.issuedAt(claims))) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("Unauthorized: sessão encerrada após a troca de senha.");
                    return;
                }

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Conta antiga sem celular: só passa o necessário para cadastrá-lo.
                if (userDetails instanceof KineticUserDetails details
                        && details.isPhoneRequired()
                        && !allowedWhilePending(request)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write(PHONE_REQUIRED_BODY);
                    return;
                }

                // Sem o aceite da versão vigente, nenhum dado é tratado além do necessário para aceitar
                // (ou para o titular exercer os direitos dele: exportar e excluir a conta).
                if (userDetails instanceof KineticUserDetails details
                        && details.isTermsRequired()
                        && !allowedWhilePending(request)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write(TERMS_REQUIRED_BODY);
                    return;
                }

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (io.jsonwebtoken.JwtException | org.springframework.security.core.userdetails.UsernameNotFoundException e) {
            // Mensagem fixa: o detalhe da exceção diria por que o token falhou.
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Unauthorized: token inválido.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * O que uma conta com cadastro pendente (celular ou aceite dos termos) ainda pode chamar:
     * sessão (refresh/logout), leitura do perfil (os clientes checam as pendências por ele),
     * resolver cada pendência e os direitos do titular (exportar e excluir a conta, LGPD art. 18).
     */
    private static boolean allowedWhilePending(HttpServletRequest request) {
        String path = path(request);
        String method = request.getMethod();
        return path.startsWith("/api/auth/")
                || ("GET".equals(method) && "/api/users/profile".equals(path))
                || ("POST".equals(method) && "/api/users/me/terms-acceptance".equals(path))
                || ("GET".equals(method) && "/api/users/me/export".equals(path))
                || ("DELETE".equals(method) && "/api/users/me".equals(path))
                || ("PUT".equals(method) && "/api/users/phone".equals(path));
    }

    private static String path(HttpServletRequest request) {
        return request.getRequestURI().substring(request.getContextPath().length());
    }
}
