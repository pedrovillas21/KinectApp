package com.kinetic.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WeeklyActivityPointDTO(
        String day,
        int minutes,
        @JsonProperty("isToday") boolean isToday
) {}
