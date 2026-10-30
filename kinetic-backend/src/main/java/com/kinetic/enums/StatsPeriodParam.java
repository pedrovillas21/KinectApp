package com.kinetic.enums;

import com.kinetic.utils.AppTime;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Locale;
import java.util.function.UnaryOperator;

public enum StatsPeriodParam {

    WEEK(today -> today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)), 1, "Foco da semana"),
    MONTH(today -> today.withDayOfMonth(1), 4, "Destaque do mês"),
    Q(today -> today.minusDays(89), 13, "Tendência trimestral"),
    YEAR(today -> today.minusDays(364), 52, "Visão anual");

    /** Início do período a partir de hoje. */
    private final UnaryOperator<LocalDate> startFromToday;
    private final int targetWeeks;
    private final String insightTag;

    StatsPeriodParam(UnaryOperator<LocalDate> startFromToday, int targetWeeks, String insightTag) {
        this.startFromToday = startFromToday;
        this.targetWeeks = targetWeeks;
        this.insightTag = insightTag;
    }

    public LocalDate startDate() {
        return startFromToday.apply(AppTime.today());
    }

    public int targetWeeks() {
        return targetWeeks;
    }

    public String insightTag() {
        return insightTag;
    }

    /** Id usado pelos clientes: "week", "month", "q" ou "year". */
    public String id() {
        return name().toLowerCase(Locale.ROOT);
    }

    public LocalDate endDate() {
        return AppTime.today();
    }

    /** Início do período anterior (mesmo comprimento que o atual). */
    public LocalDate previousStartDate() {
        LocalDate current = startDate();
        LocalDate end     = endDate();
        long days = java.time.temporal.ChronoUnit.DAYS.between(current, end) + 1;
        return current.minusDays(days);
    }

    public LocalDate previousEndDate() {
        return startDate().minusDays(1);
    }

    /** Target de sessões para o usuário no período, dado a frequência semanal. */
    public int targetSessions(int weeklyFrequency) {
        return Math.max(1, weeklyFrequency * targetWeeks());
    }

    public static StatsPeriodParam fromString(String value) {
        if (value == null) return MONTH;
        return switch (value.toLowerCase()) {
            case "week"  -> WEEK;
            case "q"     -> Q;
            case "year"  -> YEAR;
            default      -> MONTH;
        };
    }
}
