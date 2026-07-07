package com.kinetic.controllers;

import com.kinetic.dtos.ChatMessageDTO;
import com.kinetic.dtos.SendChatMessageDTO;
import com.kinetic.services.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST do chat: histórico, leitura e contador. O tempo real vai por STOMP
 * (/app/chat.send → /user/queue/chat); o POST aqui é o mesmo fluxo de envio
 * exposto via HTTP — útil como fallback quando o WebSocket não conecta.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ALUNO', 'PERSONAL')")
public class ChatController extends BaseController {

    private final ChatService chatService;

    @GetMapping("/{peerId}/messages")
    public ResponseEntity<List<ChatMessageDTO>> messages(@PathVariable UUID peerId,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(chatService.getConversation(currentUserEmail(), peerId, page, size));
    }

    @PostMapping("/{peerId}/messages")
    public ResponseEntity<ChatMessageDTO> send(@PathVariable @NonNull UUID peerId,
                                               @Valid @RequestBody SendChatMessageDTO dto) {
        // O peer da URL é a fonte de verdade do destinatário no fluxo REST.
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.sendMessage(currentUserEmail(), peerId, dto.getContent()));
    }

    @PostMapping("/{peerId}/read")
    public ResponseEntity<Map<String, Integer>> markRead(@PathVariable UUID peerId) {
        int updated = chatService.markConversationRead(currentUserEmail(), peerId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(Map.of("count", chatService.unreadCount(currentUserEmail())));
    }
}
