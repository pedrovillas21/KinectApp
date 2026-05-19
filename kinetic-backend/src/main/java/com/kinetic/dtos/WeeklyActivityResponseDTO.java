package com.kinetic.dtos;

import java.time.LocalDate;
import java.util.List;

/**
 * Agregado da semana corrente do usuário (Domingo → Sábado).
 * O FE renderiza a lista "days" diretamente nas barras do gráfico de atividade
 * da Home; "totalMinutes" alimenta o rótulo "Total semanal".
 */
public record WeeklyActivityResponseDTO(
        LocalDate weekStartDate,
        LocalDate weekEndDate,
        int totalMinutes,
        List<WeeklyActivityDayDTO> days
) {
}
