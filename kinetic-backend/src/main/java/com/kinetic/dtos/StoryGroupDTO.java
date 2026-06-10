package com.kinetic.dtos;

import java.util.List;
import java.util.UUID;

/** Stories de um mesmo autor, agrupadas para o anel/visualizador estilo Instagram. */
public record StoryGroupDTO(
        UUID userId,
        String nome,
        String avatarUrl,
        List<StoryDTO> stories
) {}
