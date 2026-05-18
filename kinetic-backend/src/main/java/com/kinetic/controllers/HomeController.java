package com.kinetic.controllers;

import com.kinetic.dtos.HomeDashboardResponseDTO;
import com.kinetic.services.HomeAggregatorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/home")
public class HomeController {

    private final HomeAggregatorService homeAggregatorService;

    public HomeController(HomeAggregatorService homeAggregatorService) {
        this.homeAggregatorService = homeAggregatorService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<HomeDashboardResponseDTO> getDashboard() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(homeAggregatorService.buildDashboardData(userEmail));
    }
}
