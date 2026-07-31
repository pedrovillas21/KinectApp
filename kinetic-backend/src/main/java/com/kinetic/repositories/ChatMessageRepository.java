package com.kinetic.repositories;

import com.kinetic.models.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    /** Conversa entre o par (nas duas direções), da mais recente para a mais antiga. */
    @Query("""
            SELECT m FROM ChatMessage m
            WHERE (m.sender.id = :a AND m.recipient.id = :b)
               OR (m.sender.id = :b AND m.recipient.id = :a)
            ORDER BY m.sentAt DESC
            """)
    Page<ChatMessage> findConversation(@Param("a") UUID a, @Param("b") UUID b, Pageable pageable);

    /** Marca como lidas todas as mensagens do peer para mim; retorna quantas afetou. */
    @Modifying
    @Query("""
            UPDATE ChatMessage m SET m.readAt = :now
            WHERE m.recipient.id = :me AND m.sender.id = :peer AND m.readAt IS NULL
            """)
    int markConversationRead(@Param("me") UUID me, @Param("peer") UUID peer, @Param("now") LocalDateTime now);

    long countByRecipientIdAndReadAtIsNull(UUID recipientId);
}
