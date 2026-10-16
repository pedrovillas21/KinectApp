package com.kinetic.dtos;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Financeiro do personal no mês: totais, cobranças (do mês + atrasadas de meses
 * anteriores), mensalidades ativas e alunos ainda sem mensalidade.
 * Valores em centavos.
 *
 * @param month          mês exibido (AAAA-MM)
 * @param expectedCents  previsto no mês (cobranças não canceladas)
 * @param receivedCents  recebido das cobranças do mês
 * @param pendingCents   em aberto no mês, ainda dentro do prazo
 * @param overdueCents   atrasado (qualquer mês)
 */
public record FinanceOverviewDTO(
        String month,
        String pixKey,
        long expectedCents,
        long receivedCents,
        long pendingCents,
        long overdueCents,
        int overdueCount,
        List<ChargeDTO> charges,
        List<PlanDTO> plans,
        List<StudentRefDTO> studentsWithoutPlan
) {
    /**
     * @param status       PENDENTE, ATRASADO, PAGO ou CANCELADO ("ATRASADO" = pendente vencida)
     * @param studentPhone celular para o lembrete; nulo se o aluno saiu da carteira
     * @param activeStudent false quando o vínculo com o aluno já foi encerrado
     */
    public record ChargeDTO(UUID id, UUID studentId, String studentName, String studentAvatarUrl,
                            String studentPhone, boolean activeStudent, LocalDate referenceMonth,
                            LocalDate dueDate, int amountCents, String status, LocalDate paidAt,
                            String paymentMethod) {}

    public record PlanDTO(UUID studentId, String studentName, String studentAvatarUrl, int amountCents,
                          int dueDay) {}

    public record StudentRefDTO(UUID studentId, String studentName, String studentAvatarUrl) {}
}
