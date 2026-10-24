package com.kinetic.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Post do feed. Os campos a partir de {@code title} vêm do treino ligado ao post
 * (workout_session_id); post sem treino traz {@code title}/{@code durationSeconds}/
 * {@code volumeKg} nulos, {@code recordsCount}=0, {@code exercises} vazio e {@code moreExercises}=0.
 */
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
        LocalDateTime createdAt,
        String title,
        Integer durationSeconds,
        Double volumeKg,
        int recordsCount,
        List<WorkoutExerciseSummaryDTO> exercises,
        int moreExercises
) {}
