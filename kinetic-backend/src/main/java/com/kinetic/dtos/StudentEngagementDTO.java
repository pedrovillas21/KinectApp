package com.kinetic.dtos;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Engajamento de um aluno da carteira, para o painel de aderência do personal.
 *
 * @param lastSessionDate      último treino registrado (qualquer época); nulo = nunca treinou
 * @param daysSinceLastSession dias desde o último treino; nulo = nunca treinou
 * @param weeklyTarget         meta de treinos por semana (frequência do aluno); nulo = sem meta
 * @param adherencePercent     treinos feitos / meta na janela recente (0–100); nulo = sem meta
 * @param adherenceWindowDays  tamanho da janela da aderência (até 28 dias; menor para quem entrou há pouco)
 * @param risk                 "ALTO", "MEDIO" ou "OK" — o pior alerta
 * @param alerts               motivos do risco, do mais grave para o mais leve
 * @param pause                pausa dos alertas em vigor; nulo = alertas valendo
 */
public record StudentEngagementDTO(
        UUID studentId,
        LocalDate lastSessionDate,
        Integer daysSinceLastSession,
        Integer weeklyTarget,
        Integer adherencePercent,
        int adherenceWindowDays,
        int sessionsLast7Days,
        String risk,
        List<Alert> alerts,
        Pause pause
) {
    public StudentEngagementDTO withPause(Pause p) {
        return new StudentEngagementDTO(studentId, lastSessionDate, daysSinceLastSession, weeklyTarget,
                adherencePercent, adherenceWindowDays, sessionsLast7Days, risk, alerts, p);
    }

    /**
     * @param until    alertas escondidos até esta data (inclusive)
     * @param reason   LESAO, VIAGEM, CONTATO ou OUTRO
     * @param note     o que o personal anotou (opcional)
     */
    public record Pause(LocalDate until, String reason, String note, LocalDateTime pausedAt) {}

    /**
     * @param type     NUNCA_TREINOU, INATIVO, QUEDA ou BAIXA_ADERENCIA
     * @param severity ALTO ou MEDIO
     * @param message  frase pronta para o painel
     */
    public record Alert(String type, String severity, String message) {}
}
