package com.kinetic.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Aprovação de uma prévia gerada por IA. {@code plans} são as fichas exatamente como o
 * personal as revisou (com as edições dele), na ordem de exibição.
 */
public record TrainerAiPlanApproveRequestDTO(
        @NotNull(message = "Informe se as fichas atuais devem ser substituídas")
        Boolean replaceCurrent,

        @NotNull(message = "Confirme a declaração de revisão para aprovar")
        @AssertTrue(message = "Confirme a declaração de revisão para aprovar")
        Boolean declarationAccepted,

        @NotEmpty(message = "Aprove pelo menos uma ficha")
        @Size(max = 6, message = "Máximo de 6 fichas por aprovação")
        List<@Valid TrainerWorkoutPlanRequestDTO> plans
) {}
