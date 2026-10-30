package com.kinetic.services;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Mensalidade nova: se o dia do vencimento já passou neste mês, a primeira cobrança é no mês seguinte. */
class StudentFinanceFirstBillingTest {

    private static LocalDate first(String today, int dueDay) {
        return StudentFinanceService.firstBillingMonth(LocalDate.parse(today), dueDay);
    }

    @Test
    void pastDueDayStartsNextMonth() {
        assertEquals(LocalDate.parse("2026-11-01"), first("2026-10-29", 10));
        assertEquals(LocalDate.parse("2027-01-01"), first("2026-12-15", 5));
        // Dia 28 numa fevereiro ainda cabe; passou do dia 28 em janeiro → fevereiro.
        assertEquals(LocalDate.parse("2027-02-01"), first("2027-01-30", 28));
    }

    @Test
    void dueDayTodayOrAheadStaysThisMonth() {
        assertEquals(LocalDate.parse("2026-10-01"), first("2026-10-10", 10));
        assertEquals(LocalDate.parse("2026-10-01"), first("2026-10-01", 28));
    }
}
