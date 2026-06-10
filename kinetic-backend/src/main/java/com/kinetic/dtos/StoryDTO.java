package com.kinetic.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record StoryDTO(
        UUID id,
        String imageUrl,
        String caption,
        LocalDateTime createdAt,
        LocalDateTime expiresAt
) {}
