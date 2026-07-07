package com.kinetic.controllers;

import com.kinetic.dtos.SendChatMessageDTO;
import com.kinetic.services.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * Entrada STOMP do chat. O cliente publica em /app/chat.send e o ChatService
 * entrega nas filas pessoais (/user/queue/chat) dos dois participantes.
 * O Principal vem do JwtChannelInterceptor (frame CONNECT autenticado).
 */
@Controller
@RequiredArgsConstructor
public class ChatWsController {

    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void send(Principal principal, @Valid @Payload SendChatMessageDTO dto) {
        chatService.sendMessage(principal.getName(), dto.getRecipientId(), dto.getContent());
    }
}
