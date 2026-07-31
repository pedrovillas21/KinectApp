package com.kinetic.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatMessageDTO(
        UUID id,
        UUID senderId,
        UUID recipientId,
        String content,
        LocalDateTime sentAt,
        LocalDateTime readAt
) {}
