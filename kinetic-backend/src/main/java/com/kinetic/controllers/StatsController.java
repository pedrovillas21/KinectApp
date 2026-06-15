package com.kinetic.controllers;

import com.kinetic.dtos.PlanEvolutionResponseDTO;
import com.kinetic.dtos.StatsSummaryResponseDTO;
import com.kinetic.services.StatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
public class StatsController extends BaseController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    /**
     * GET /api/stats/summary?period={week|month|q|year}
     * Retorna o dashboard completo de estatísticas para o período informado.
     * O parâmetro é opcional — padrão: "month".
     */
    @GetMapping("/summary")
    public ResponseEntity<StatsSummaryResponseDTO> getSummary(
            @RequestParam(name = "period", defaultValue = "month") String period) {
        String userEmail = currentUserEmail();
        return ResponseEntity.ok(statsService.getSummary(userEmail, period));
    }

    /**
     * GET /api/stats/plan-evolution
     * Compara o ciclo atual (desde a última regeneração) contra o ciclo anterior.
     * Independente do seletor de período — não é recalculado a cada troca de período.
     */
    @GetMapping("/plan-evolution")
    public ResponseEntity<PlanEvolutionResponseDTO> getPlanEvolution() {
        String userEmail = currentUserEmail();
        return ResponseEntity.ok(statsService.getPlanEvolution(userEmail));
    }
}
