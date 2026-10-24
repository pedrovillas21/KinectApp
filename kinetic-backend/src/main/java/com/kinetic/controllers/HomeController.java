package com.kinetic.controllers;

import com.kinetic.dtos.HomeDashboardResponseDTO;
import com.kinetic.services.HomeAggregatorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/home")
@Tag(
        name = "Tela inicial (Home)",
        description = "Endpoint único que junta, em uma só resposta, tudo que a tela inicial do app precisa mostrar."
)
public class HomeController extends BaseController {

    private final HomeAggregatorService homeAggregatorService;

    public HomeController(HomeAggregatorService homeAggregatorService) {
        this.homeAggregatorService = homeAggregatorService;
    }

    @Operation(
            summary = "Buscar tudo que a tela inicial precisa",
            description = "Junta em uma resposta só várias informações do usuário logado — próxima ficha de treino, "
                    + "progresso, avisos etc. — poupando o app de fazer várias chamadas separadas."
    )
    @GetMapping("/dashboard")
    public ResponseEntity<HomeDashboardResponseDTO> getDashboard() {
        String userEmail = currentUserEmail();
        return ResponseEntity.ok(homeAggregatorService.buildDashboardData(userEmail));
    }
}
