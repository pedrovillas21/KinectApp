package com.kinetic.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

// Texto livre vai para o prompt da IA: o tamanho limita o custo por chamada.
public record GenerateWorkoutRequestDto(
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate birthDate,
        Double weight,
        Double height,
        @Size(max = 60, message = "Objetivo com no máximo 60 caracteres") String goal,
        Integer frequency,
        @Size(max = 30, message = "Nível com no máximo 30 caracteres") String level,
        // Mesmo limite da anamnese no protocolo (StudentProtocolDTOs).
        @Size(max = 2000, message = "Anamnese com no máximo 2000 caracteres") String medicalConditions
) {}
