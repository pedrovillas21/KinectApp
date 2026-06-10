package com.kinetic.dtos;

public record CreatePostRequest(
        String category,
        String intensity,
        Integer durationMinutes,
        Integer calories,
        String caption,
        String imageUrl,
        String badge
) {}
