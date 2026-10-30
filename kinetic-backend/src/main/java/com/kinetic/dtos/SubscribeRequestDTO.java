package com.kinetic.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubscribeRequestDTO {
    /** Código do plano (START, PRO, PLUS). */
    @NotBlank(message = "Escolha um plano")
    private String plan;
}
