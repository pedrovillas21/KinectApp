package com.kinetic.controllers;

import com.kinetic.dtos.LogSessionRequestDTO;
import com.kinetic.dtos.MonthlyStatsResponseDTO;
import com.kinetic.services.WorkoutSessionService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class WorkoutSessionController {

    private final WorkoutSessionService workoutSessionService;

    public WorkoutSessionController(WorkoutSessionService workoutSessionService) {
        this.workoutSessionService = workoutSessionService;
    }

    @PostMapping("/log")
    public ResponseEntity<?> logSession(@Valid @RequestBody LogSessionRequestDTO request) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        try {
            workoutSessionService.logSession(userEmail, request);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/monthly-stats")
    public ResponseEntity<MonthlyStatsResponseDTO> getMonthlyStats() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(workoutSessionService.getMonthlyStats(userEmail));
    }
}
