package com.kinetic.dtos;

import java.util.List;

public record GeminiResponseDto(List<Candidate> candidates) {
    public record Candidate(Content content) {}
    public record Content(List<Part> parts) {}
    public record Part(String text) {}

    public String getText() {
        if (candidates == null || candidates.isEmpty()) return null;
        var parts = candidates.get(0).content().parts();
        if (parts == null || parts.isEmpty()) return null;
        return parts.get(0).text();
    }
}
