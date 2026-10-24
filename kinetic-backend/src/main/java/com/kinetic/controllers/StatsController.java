package com.kinetic.controllers;

import com.kinetic.dtos.PlanEvolutionResponseDTO;
import com.kinetic.dtos.StatsSummaryResponseDTO;
import com.kinetic.services.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
@Tag(
        name = "Estatísticas",
        description = "Dashboards e comparativos calculados em cima do histórico de treinos do usuário logado."
)
public class StatsController extends BaseController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @Operation(
            summary = "Ver o resumo de estatísticas de um período",
            description = "Calcula, a partir do histórico de treinos salvo no banco, um resumo (aderência, volume, "
                    + "frequência etc.) para o período pedido. O parâmetro \"period\" é opcional: se não for enviado, "
                    + "usa \"month\" (mês atual)."
    )
    @GetMapping("/summary")
    public ResponseEntity<StatsSummaryResponseDTO> getSummary(
            @Parameter(description = "Período a calcular: \"week\", \"month\", \"q\" (trimestre) ou \"year\". Padrão: \"month\".")
            @RequestParam(name = "period", defaultValue = "month") String period) {
        String userEmail = currentUserEmail();
        return ResponseEntity.ok(statsService.getSummary(userEmail, period));
    }

    @Operation(
            summary = "Comparar o ciclo de treino atual com o anterior",
            description = "Compara os resultados desde a última vez que a ficha de treino foi gerada de novo contra "
                    + "o ciclo anterior. Não depende do período escolhido na tela de estatísticas — é sempre "
                    + "\"ciclo atual vs. ciclo passado\"."
    )
    @GetMapping("/plan-evolution")
    public ResponseEntity<PlanEvolutionResponseDTO> getPlanEvolution() {
        String userEmail = currentUserEmail();
        return ResponseEntity.ok(statsService.getPlanEvolution(userEmail));
    }
}
