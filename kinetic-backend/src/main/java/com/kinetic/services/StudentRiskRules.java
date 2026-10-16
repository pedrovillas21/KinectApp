package com.kinetic.services;

import com.kinetic.dtos.StudentEngagementDTO;
import com.kinetic.dtos.StudentEngagementDTO.Alert;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Regras do alerta de risco de abandono (funções puras, sem banco).
 * Janelas móveis em vez do mês do calendário: no dia 2 ninguém aparece com
 * aderência baixa só porque o mês acabou de virar.
 *
 * <ul>
 *   <li><b>NUNCA_TREINOU</b>: entrou na carteira há 3+ dias e não registrou treino
 *       desde então (ALTO a partir de 7 dias).</li>
 *   <li><b>INATIVO</b>: sem treinar há mais tempo que o normal para a meta dele.
 *       MEDIO a partir de max(4, 14/meta) dias (7 sem meta); ALTO a partir de 10.</li>
 *   <li><b>QUEDA</b>: aderência das últimas 2 semanas caiu 30+ pontos em relação às
 *       2 anteriores, que estavam em 60%+ (ALTO se ficou abaixo de 30%).</li>
 *   <li><b>BAIXA_ADERENCIA</b>: menos de 40% da meta nos últimos 28 dias (ou desde
 *       que entrou, se faz menos tempo).</li>
 * </ul>
 * QUEDA e BAIXA_ADERENCIA só valem para quem está na carteira há 14+ dias e tem meta.
 */
final class StudentRiskRules {

    static final String ALTO = "ALTO";
    static final String MEDIO = "MEDIO";
    static final String OK = "OK";

    private StudentRiskRules() {}

    /**
     * @param sessionDays     dias com treino nos últimos 28 dias (inclusive hoje)
     * @param lastSessionDate último treino de todos os tempos (nulo = nunca)
     * @param linkedSince     dia em que o vínculo com o personal começou
     * @param weeklyTarget    meta semanal; nulo ou ≤ 0 = sem meta
     */
    static StudentEngagementDTO evaluate(UUID studentId, Set<LocalDate> sessionDays, LocalDate lastSessionDate,
                                         LocalDate linkedSince, Integer weeklyTarget, LocalDate today) {
        int daysLinked = (int) Math.max(0, ChronoUnit.DAYS.between(linkedSince, today));
        Integer daysSince = lastSessionDate == null ? null
                : (int) Math.max(0, ChronoUnit.DAYS.between(lastSessionDate, today));
        boolean hasTarget = weeklyTarget != null && weeklyTarget > 0;

        int windowDays = Math.max(7, Math.min(28, daysLinked + 1));
        Integer adherence = hasTarget
                ? percent(countIn(sessionDays, today.minusDays(windowDays - 1L), today), weeklyTarget * windowDays / 7.0)
                : null;

        List<Alert> alerts = new ArrayList<>();
        boolean trainedSinceLink = lastSessionDate != null && !lastSessionDate.isBefore(linkedSince);

        if (!trainedSinceLink && daysLinked >= 3) {
            alerts.add(new Alert("NUNCA_TREINOU", daysLinked >= 7 ? ALTO : MEDIO,
                    "Ainda não registrou treino desde que entrou na sua carteira (há " + plural(daysLinked) + ")"));
        } else if (daysSince != null) {
            int medium = hasTarget ? Math.max(4, (int) Math.ceil(14.0 / weeklyTarget)) : 7;
            int high = Math.max(10, medium + 3);
            if (daysSince >= high) {
                alerts.add(new Alert("INATIVO", ALTO, "Não treina há " + plural(daysSince)));
            } else if (daysSince >= medium) {
                alerts.add(new Alert("INATIVO", MEDIO, "Não treina há " + plural(daysSince)));
            }
        }

        if (hasTarget && daysLinked >= 14) {
            double twoWeekTarget = weeklyTarget * 2.0;
            int current = percent(countIn(sessionDays, today.minusDays(13), today), twoWeekTarget);
            int previous = percent(countIn(sessionDays, today.minusDays(27), today.minusDays(14)), twoWeekTarget);
            if (previous >= 60 && current <= previous - 30) {
                alerts.add(new Alert("QUEDA", current < 30 ? ALTO : MEDIO,
                        "Aderência caiu de " + previous + "% para " + current + "% nas últimas 2 semanas"));
            } else if (adherence != null && adherence < 40) {
                alerts.add(new Alert("BAIXA_ADERENCIA", MEDIO,
                        "Aderência de " + adherence + "% nos últimos " + windowDays + " dias (meta: "
                                + weeklyTarget + "x por semana)"));
            }
        }

        alerts.sort(Comparator.comparing((Alert a) -> ALTO.equals(a.severity()) ? 0 : 1));
        String risk = alerts.isEmpty() ? OK : alerts.get(0).severity();
        int last7 = countIn(sessionDays, today.minusDays(6), today);

        return new StudentEngagementDTO(studentId, lastSessionDate, daysSince, hasTarget ? weeklyTarget : null,
                adherence, windowDays, last7, risk, List.copyOf(alerts));
    }

    private static int countIn(Set<LocalDate> days, LocalDate from, LocalDate to) {
        int count = 0;
        for (LocalDate d : days) {
            if (!d.isBefore(from) && !d.isAfter(to)) count++;
        }
        return count;
    }

    private static int percent(int done, double target) {
        if (target <= 0) return 0;
        return (int) Math.min(100, Math.round(done * 100.0 / target));
    }

    private static String plural(int days) {
        return days + (days == 1 ? " dia" : " dias");
    }
}
