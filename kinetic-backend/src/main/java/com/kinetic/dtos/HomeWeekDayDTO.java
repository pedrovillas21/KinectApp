package com.kinetic.dtos;

import java.time.LocalDate;

/** Dia da faixa da semana do Início (domingo a sábado da semana corrente). */
public record HomeWeekDayDTO(
        LocalDate date,
        boolean trained,
        boolean today
) {}
