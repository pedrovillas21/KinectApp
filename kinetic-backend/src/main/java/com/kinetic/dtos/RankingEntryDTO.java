package com.kinetic.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RankingEntryDTO(
        String id,
        int position,
        String name,
        int minutes,
        int delta,
        boolean online,
        @JsonProperty("isCurrentUser") boolean isCurrentUser
) {}
