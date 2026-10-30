package com.kinetic.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** Protocolo do aluno (objetivo, nível, frequência) e anamnese, com quem mudou por último. */
public final class StudentProtocolDTOs {

    private StudentProtocolDTOs() {}

    /** Edição pelo personal. goal/level usam os valores canônicos do app. */
    public record UpdateRequest(
            @NotBlank(message = "Informe o objetivo") String goal,
            @NotBlank(message = "Informe o nível") String level,
            @NotNull(message = "Informe a frequência")
            @Min(value = 1, message = "Frequência entre 1 e 7 dias") @Max(value = 7, message = "Frequência entre 1 e 7 dias")
            Integer frequency,
            @Size(max = 2000, message = "Anamnese com no máximo 2000 caracteres") String medicalConditions
    ) {}

    /**
     * {@code managedByName}: nome do personal com vínculo ativo (null = o aluno edita o próprio protocolo).
     * Os campos *ByName são null quando ninguém registrou ainda ou a conta foi excluída.
     */
    public record Response(
            String goal,
            String level,
            Integer frequency,
            String medicalConditions,
            String managedByName,
            LocalDateTime protocolUpdatedAt,
            String protocolUpdatedByName,
            boolean protocolUpdatedByStudent,
            LocalDateTime anamnesisUpdatedAt,
            String anamnesisUpdatedByName,
            boolean anamnesisUpdatedByStudent,
            LocalDateTime anamnesisConfirmedAt
    ) {}
}
