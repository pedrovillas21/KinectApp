package com.kinetic.dtos;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/** Avaliação física: pedido do personal e resposta (com IMC e massas calculados). */
public final class PhysicalAssessmentDTOs {

    private PhysicalAssessmentDTOs() {}

    /** Todos os campos de medida são opcionais, mas a avaliação precisa ter ao menos um. */
    public record Request(
            @NotNull(message = "Informe a data da avaliação")
            @PastOrPresent(message = "A data da avaliação não pode ser no futuro")
            LocalDate assessedOn,
            @DecimalMin(value = "20", message = "Peso entre 20 e 400 kg") @DecimalMax(value = "400", message = "Peso entre 20 e 400 kg")
            Double weightKg,
            @DecimalMin(value = "80", message = "Altura entre 80 e 250 cm") @DecimalMax(value = "250", message = "Altura entre 80 e 250 cm")
            Double heightCm,
            @DecimalMin(value = "2", message = "% de gordura entre 2 e 75") @DecimalMax(value = "75", message = "% de gordura entre 2 e 75")
            Double bodyFatPct,
            @DecimalMin(value = "5", message = "Massa muscular entre 5 e 200 kg") @DecimalMax(value = "200", message = "Massa muscular entre 5 e 200 kg")
            Double muscleMassKg,
            @Min(value = 25, message = "FC de repouso entre 25 e 220 bpm") @Max(value = 220, message = "FC de repouso entre 25 e 220 bpm")
            Integer restingHr,
            @DecimalMin("20") @DecimalMax("300") Double chestCm,
            @DecimalMin("20") @DecimalMax("300") Double waistCm,
            @DecimalMin("20") @DecimalMax("300") Double abdomenCm,
            @DecimalMin("20") @DecimalMax("300") Double hipCm,
            @DecimalMin("5") @DecimalMax("150") Double armRightCm,
            @DecimalMin("5") @DecimalMax("150") Double armLeftCm,
            @DecimalMin("10") @DecimalMax("200") Double thighRightCm,
            @DecimalMin("10") @DecimalMax("200") Double thighLeftCm,
            @DecimalMin("5") @DecimalMax("120") Double calfRightCm,
            @DecimalMin("5") @DecimalMax("120") Double calfLeftCm,
            @Size(max = 2000, message = "Observações com no máximo 2000 caracteres") String notes
    ) {
        public boolean hasAnyMeasure() {
            return weightKg != null || heightCm != null || bodyFatPct != null || muscleMassKg != null
                    || restingHr != null || chestCm != null || waistCm != null || abdomenCm != null || hipCm != null
                    || armRightCm != null || armLeftCm != null || thighRightCm != null || thighLeftCm != null
                    || calfRightCm != null || calfLeftCm != null;
        }
    }

    /**
     * @param bmi         IMC (peso / altura²), quando há peso e altura
     * @param fatMassKg   massa gorda (peso × %gordura), quando há os dois
     * @param leanMassKg  massa magra (peso − massa gorda)
     * @param trainerName quem avaliou
     */
    public record Response(
            UUID id,
            LocalDate assessedOn,
            Double weightKg,
            Double heightCm,
            Double bodyFatPct,
            Double muscleMassKg,
            Integer restingHr,
            Double chestCm,
            Double waistCm,
            Double abdomenCm,
            Double hipCm,
            Double armRightCm,
            Double armLeftCm,
            Double thighRightCm,
            Double thighLeftCm,
            Double calfRightCm,
            Double calfLeftCm,
            String notes,
            Double bmi,
            Double fatMassKg,
            Double leanMassKg,
            String trainerName
    ) {}
}
