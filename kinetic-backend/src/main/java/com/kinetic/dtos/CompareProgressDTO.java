package com.kinetic.dtos;

import java.time.LocalDate;
import java.util.List;

/** "Comparar progresso" entre amigos: 12 semanas (domingo como início, mais antiga primeiro). */
public record CompareProgressDTO(
        List<LocalDate> weekStarts,
        CompareSideDTO me,
        CompareSideDTO friend,
        List<SharedPrDTO> sharedPrs
) {}
