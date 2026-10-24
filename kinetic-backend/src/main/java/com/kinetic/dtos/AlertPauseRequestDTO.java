package com.kinetic.dtos;

import com.kinetic.enums.AlertPauseReason;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AlertPauseRequestDTO {
    @NotNull(message = "Escolha o motivo")
    private AlertPauseReason reason;

    /** Por quantos dias esconder os alertas, contando hoje. */
    @Min(value = 1, message = "Pause por pelo menos 1 dia")
    @Max(value = 90, message = "Pause por no máximo 90 dias")
    private int days;

    @Size(max = 500, message = "A nota pode ter até 500 caracteres")
    private String note;
}
