package com.kinetic.controllers;

import com.kinetic.dtos.ChatMessageDTO;
import com.kinetic.dtos.SendChatMessageDTO;
import com.kinetic.services.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(
        name = "Chat",
        description = "Conversa entre aluno e personal. Aqui é a versão HTTP; o tempo real acontece via WebSocket "
                + "(STOMP), que não aparece nesta documentação."
)
public class ChatController extends BaseController {

    private final ChatService chatService;

    @Operation(
            summary = "Buscar o histórico de mensagens com alguém",
            description = "Busca no banco as mensagens trocadas entre o usuário logado e o usuário informado em "
                    + "\"peerId\", da mais recente para a mais antiga, em páginas."
    )
    @GetMapping("/{peerId}/messages")
    public ResponseEntity<List<ChatMessageDTO>> messages(
            @Parameter(description = "Id do outro usuário da conversa (aluno ou personal).") @PathVariable UUID peerId,
            @Parameter(description = "Número da página, começando em 0. Padrão: 0.") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Quantidade de mensagens por página. Padrão: 30.") @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(chatService.getConversation(currentUserEmail(), peerId, page, size));
    }

    @Operation(
            summary = "Enviar uma mensagem (via HTTP)",
            description = "Salva uma nova mensagem do usuário logado para o usuário informado em \"peerId\". É o "
                    + "mesmo efeito de mandar mensagem pelo WebSocket — use este endpoint quando o app não "
                    + "conseguir manter a conexão em tempo real aberta."
    )
    @PostMapping("/{peerId}/messages")
    public ResponseEntity<ChatMessageDTO> send(
            @Parameter(description = "Id do usuário que vai receber a mensagem.") @PathVariable @NonNull UUID peerId,
            @Valid @RequestBody SendChatMessageDTO dto) {
        // O peer da URL é a fonte de verdade do destinatário no fluxo REST.
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.sendMessage(currentUserEmail(), peerId, dto.getContent()));
    }

    @Operation(
            summary = "Marcar a conversa como lida",
            description = "Marca no banco todas as mensagens recebidas do usuário informado em \"peerId\" como "
                    + "lidas, e devolve quantas mensagens foram atualizadas."
    )
    @PostMapping("/{peerId}/read")
    public ResponseEntity<Map<String, Integer>> markRead(
            @Parameter(description = "Id do outro usuário da conversa.") @PathVariable UUID peerId) {
        int updated = chatService.markConversationRead(currentUserEmail(), peerId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @Operation(
            summary = "Contar mensagens não lidas",
            description = "Retorna quantas mensagens de todas as conversas o usuário logado ainda não leu — o "
                    + "número usado no \"badge\" do ícone de chat."
    )
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(Map.of("count", chatService.unreadCount(currentUserEmail())));
    }
}
