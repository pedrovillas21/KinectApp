package com.kinetic.controllers;

import com.kinetic.dtos.HomeDashboardResponseDTO;
import com.kinetic.services.HomeAggregatorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/home")
public class HomeController extends BaseController {

    private final HomeAggregatorService homeAggregatorService;

    public HomeController(HomeAggregatorService homeAggregatorService) {
        this.homeAggregatorService = homeAggregatorService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<HomeDashboardResponseDTO> getDashboard() {
        String userEmail = currentUserEmail();
        return ResponseEntity.ok(homeAggregatorService.buildDashboardData(userEmail));
    }
}
