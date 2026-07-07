package com.kinetic.security;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Autentica a sessão STOMP no frame CONNECT. Navegadores não conseguem enviar
 * header HTTP Authorization no handshake nativo do WebSocket, então o token
 * vem no header STOMP de CONNECT (connectHeaders.Authorization) — com query
 * param ?token= como fallback, capturado no handshake e disponível nos
 * atributos de sessão. Sem token válido, a conexão é rejeitada aqui.
 */
@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String token = resolveToken(accessor);
        if (token == null) {
            throw new MessagingException("Conexão WebSocket sem token JWT.");
        }

        try {
            String email = jwtUtil.extractUsername(token);
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
            if (!jwtUtil.validateToken(token, userDetails.getUsername())) {
                throw new MessagingException("Token JWT inválido ou expirado.");
            }
            accessor.setUser(new UsernamePasswordAuthenticationToken(
                    userDetails.getUsername(), null, userDetails.getAuthorities()));
        } catch (io.jsonwebtoken.JwtException e) {
            throw new MessagingException("Token JWT inválido: " + e.getMessage());
        }

        return message;
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        Map<String, Object> attrs = accessor.getSessionAttributes();
        if (attrs != null && attrs.get("token") instanceof String queryToken && !queryToken.isBlank()) {
            return queryToken;
        }
        return null;
    }
}
