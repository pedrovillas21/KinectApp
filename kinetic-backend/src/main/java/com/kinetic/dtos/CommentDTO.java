package com.kinetic.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentDTO(
        UUID id,
        UUID authorId,
        String authorName,
        String authorAvatarUrl,
        String body,
        LocalDateTime createdAt
) {}
