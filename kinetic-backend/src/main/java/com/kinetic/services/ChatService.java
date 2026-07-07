package com.kinetic.services;

import com.kinetic.dtos.ChatMessageDTO;
import com.kinetic.models.ChatMessage;
import com.kinetic.models.User;
import com.kinetic.repositories.ChatMessageRepository;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Chat personal↔aluno. Toda operação passa pelo guard de posse: só conversa
 * quem tem vínculo ATIVO no TrainerClient (em qualquer direção do par).
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ChatMessageRepository chatMessageRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageDTO sendMessage(String senderEmail, UUID recipientId, String content) {
        User sender = userRepository.getByEmailOrThrow(senderEmail);
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new EntityNotFoundException("Destinatário não encontrado."));

        requireActiveLink(sender.getId(), recipient.getId());

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setContent(content);
        ChatMessageDTO dto = toDto(chatMessageRepository.save(message));

        // Push em tempo real para as filas pessoais dos dois lados: o
        // destinatário recebe a mensagem e o remetente a confirmação.
        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/chat", dto);
        messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/chat", dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getConversation(String meEmail, UUID peerId, int page, int size) {
        User me = userRepository.getByEmailOrThrow(meEmail);
        requireActiveLink(me.getId(), peerId);
        int pageSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return chatMessageRepository
                .findConversation(me.getId(), peerId, PageRequest.of(Math.max(page, 0), pageSize))
                .map(this::toDto)
                .getContent();
    }

    @Transactional
    public int markConversationRead(String meEmail, UUID peerId) {
        User me = userRepository.getByEmailOrThrow(meEmail);
        requireActiveLink(me.getId(), peerId);
        return chatMessageRepository.markConversationRead(me.getId(), peerId, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public long unreadCount(String meEmail) {
        User me = userRepository.getByEmailOrThrow(meEmail);
        return chatMessageRepository.countByRecipientIdAndReadAtIsNull(me.getId());
    }

    private void requireActiveLink(UUID a, UUID b) {
        if (!trainerClientRepository.existsActiveLinkBetween(a, b)) {
            throw new AccessDeniedException("Chat disponível apenas entre personal e aluno com vínculo ativo.");
        }
    }

    private ChatMessageDTO toDto(ChatMessage m) {
        return new ChatMessageDTO(
                m.getId(),
                m.getSender().getId(),
                m.getRecipient().getId(),
                m.getContent(),
                m.getSentAt(),
                m.getReadAt()
        );
    }
}
