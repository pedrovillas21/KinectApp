package com.kinetic.dtos;

/** Exercício que os dois amigos já fizeram, com o recorde de cada um. */
public record SharedPrDTO(
        String exercise,
        BestSetDTO me,
        BestSetDTO friend
) {}
