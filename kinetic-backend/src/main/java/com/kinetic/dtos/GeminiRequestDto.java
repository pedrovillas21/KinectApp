package com.kinetic.dtos;

import java.util.List;

public record GeminiRequestDto(List<Content> contents, GenerationConfig generationConfig) {
    
    public record Content(List<Part> parts) {
        public static Content of(String text) {
            return new Content(List.of(new Part(text)));
        }
    }
    
    public record Part(String text) {}
    
    public record GenerationConfig(String responseMimeType) {
        public static GenerationConfig json() {
            return new GenerationConfig("application/json");
        }
    }
}
