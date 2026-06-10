package com.kinetic.dtos;

public record CreateStoryRequest(
        String imageUrl,
        String caption
) {}
