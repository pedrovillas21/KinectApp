package com.kinetic.dtos;

import java.time.LocalDate;
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
        List<Alert> alerts
) {
    /**
     * @param type     NUNCA_TREINOU, INATIVO, QUEDA ou BAIXA_ADERENCIA
     * @param severity ALTO ou MEDIO
     * @param message  frase pronta para o painel
     */
    public record Alert(String type, String severity, String message) {}
}
