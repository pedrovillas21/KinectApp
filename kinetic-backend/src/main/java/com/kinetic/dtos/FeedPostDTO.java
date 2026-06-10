package com.kinetic.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

public record FeedPostDTO(
        UUID id,
        FeedAuthorDTO author,
        String timestamp,
        String category,
        String imageUrl,
        String duration,
        String calories,
        String badge,
        long likesCount,
        long commentsCount,
        String caption,
        @JsonProperty("isLikedByMe") boolean isLikedByMe,
        LocalDateTime createdAt
) {}
