package com.kinetic.enums;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

public enum StatsPeriodParam {

    WEEK {
        @Override public LocalDate startDate()         { return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)); }
        @Override public int targetWeeks()             { return 1; }
        @Override public String insightTag()           { return "Foco da semana"; }
        @Override public String id()                   { return "week"; }
    },
    MONTH {
        @Override public LocalDate startDate()         { return LocalDate.now().withDayOfMonth(1); }
        @Override public int targetWeeks()             { return 4; }
        @Override public String insightTag()           { return "Destaque do mês"; }
        @Override public String id()                   { return "month"; }
    },
    Q {
        @Override public LocalDate startDate()         { return LocalDate.now().minusDays(89); }
        @Override public int targetWeeks()             { return 13; }
        @Override public String insightTag()           { return "Tendência trimestral"; }
        @Override public String id()                   { return "q"; }
    },
    YEAR {
        @Override public LocalDate startDate()         { return LocalDate.now().minusDays(364); }
        @Override public int targetWeeks()             { return 52; }
        @Override public String insightTag()           { return "Visão anual"; }
        @Override public String id()                   { return "year"; }
    };

    public abstract LocalDate startDate();
    public abstract int targetWeeks();
    public abstract String insightTag();
    public abstract String id();

    public LocalDate endDate() {
        return LocalDate.now();
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
