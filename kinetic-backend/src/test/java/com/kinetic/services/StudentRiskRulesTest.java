package com.kinetic.services;

import com.kinetic.dtos.StudentEngagementDTO;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StudentRiskRulesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 16);
    private static final UUID ID = UUID.randomUUID();

    /** Dias com treino a cada {@code step} dias, de {@code fromDaysAgo} até {@code toDaysAgo} atrás. */
    private static Set<LocalDate> every(int step, int fromDaysAgo, int toDaysAgo) {
        Set<LocalDate> days = new HashSet<>();
        for (int d = fromDaysAgo; d >= toDaysAgo; d -= step) {
            days.add(TODAY.minusDays(d));
        }
        return days;
    }

    private static StudentEngagementDTO eval(Set<LocalDate> days, LocalDate last, int daysLinked, Integer target) {
        return StudentRiskRules.evaluate(ID, days, last, TODAY.minusDays(daysLinked), target, TODAY);
    }

    @Test
    void alunoEmDiaNaoGeraAlerta() {
        Set<LocalDate> days = every(2, 27, 0); // ~3,5x por semana, meta 3
        StudentEngagementDTO r = eval(days, TODAY, 60, 3);
        assertEquals("OK", r.risk());
        assertTrue(r.alerts().isEmpty());
        assertEquals(100, r.adherencePercent());
        assertEquals(0, r.daysSinceLastSession());
    }

    @Test
    void nuncaTreinouDesdeQueEntrou() {
        assertEquals("OK", eval(Set.of(), null, 2, 3).risk(), "2 dias ainda é cedo");
        StudentEngagementDTO medio = eval(Set.of(), null, 4, 3);
        assertEquals("MEDIO", medio.risk());
        assertEquals("NUNCA_TREINOU", medio.alerts().get(0).type());
        assertEquals("ALTO", eval(Set.of(), null, 8, 3).risk());
        assertNull(medio.daysSinceLastSession());
    }

    @Test
    void treinoAntesDoVinculoNaoContaComoTreinoDesdeQueEntrou() {
        LocalDate before = TODAY.minusDays(20);
        StudentEngagementDTO r = eval(Set.of(before), before, 5, 3);
        assertEquals("NUNCA_TREINOU", r.alerts().get(0).type());
    }

    @Test
    void inativoConformeAMetaSemanal() {
        // Meta 3x: médio a partir de 5 dias (ceil(14/3)), alto a partir de 10.
        LocalDate last4 = TODAY.minusDays(4);
        assertTrue(eval(every(2, 27, 4), last4, 60, 3).alerts().stream().noneMatch(a -> a.type().equals("INATIVO")));
        LocalDate last5 = TODAY.minusDays(5);
        StudentEngagementDTO medio = eval(every(2, 27, 5), last5, 60, 3);
        assertEquals("MEDIO", medio.alerts().stream().filter(a -> a.type().equals("INATIVO")).findFirst().orElseThrow().severity());
        LocalDate last12 = TODAY.minusDays(12);
        StudentEngagementDTO alto = eval(every(2, 27, 12), last12, 60, 3);
        assertEquals("ALTO", alto.risk());
        assertEquals("Não treina há 12 dias", alto.alerts().get(0).message());
    }

    @Test
    void quedaDeAderenciaEntreQuinzenas() {
        // Quinzena anterior: 6 treinos (100% da meta 3x); última: 1 treino (17%).
        Set<LocalDate> days = every(2, 26, 16);
        days.add(TODAY.minusDays(3));
        StudentEngagementDTO r = eval(days, TODAY.minusDays(3), 60, 3);
        StudentEngagementDTO.Alert queda = r.alerts().stream().filter(a -> a.type().equals("QUEDA")).findFirst().orElseThrow();
        assertEquals("ALTO", queda.severity());
        assertTrue(queda.message().startsWith("Aderência caiu de 100% para 17%"));
    }

    @Test
    void aderenciaBaixaSoParaQuemEstaHa14DiasOuMais() {
        Set<LocalDate> days = every(7, 21, 0); // 1x por semana, meta 4x
        assertTrue(eval(days, TODAY, 10, 4).alerts().isEmpty(), "entrou há 10 dias: ainda sem julgamento");
        StudentEngagementDTO r = eval(days, TODAY, 30, 4);
        assertEquals("BAIXA_ADERENCIA", r.alerts().get(0).type());
        assertEquals(25, r.adherencePercent());
    }

    @Test
    void semMetaSoAvaliaInatividade() {
        LocalDate last = TODAY.minusDays(8);
        StudentEngagementDTO r = eval(Set.of(last), last, 60, null);
        assertNull(r.adherencePercent());
        assertNull(r.weeklyTarget());
        assertEquals(1, r.alerts().size());
        assertEquals("INATIVO", r.alerts().get(0).type());
    }
}
