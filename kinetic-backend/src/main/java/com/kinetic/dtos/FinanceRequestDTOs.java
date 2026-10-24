package com.kinetic.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Corpos das requisições do financeiro do personal. */
public final class FinanceRequestDTOs {

    private FinanceRequestDTOs() {}

    /** Mensalidade do aluno: valor em centavos e dia do vencimento (1–28). */
    public record StudentPlanRequest(
            @NotNull(message = "Informe o valor da mensalidade")
            @Min(value = 100, message = "A mensalidade deve ser de pelo menos R$ 1,00")
            @Max(value = 10_000_000, message = "Valor de mensalidade muito alto")
            Integer amountCents,
            @NotNull(message = "Informe o dia do vencimento")
            @Min(value = 1, message = "O dia do vencimento vai de 1 a 28")
            @Max(value = 28, message = "O dia do vencimento vai de 1 a 28")
            Integer dueDay) {}

    /** Baixa de pagamento: forma (PIX, DINHEIRO, CARTAO, TRANSFERENCIA, OUTRO) e data (padrão: hoje). */
    public record PaymentRequest(
            @NotNull(message = "Informe a forma de pagamento") String method,
            LocalDate paidAt) {}

    public record SettingsRequest(
            @Size(max = 140, message = "A chave Pix deve ter no máximo 140 caracteres") String pixKey) {}
}
