package com.kinetic.controllers;

import com.kinetic.dtos.LogSessionRequestDTO;
import com.kinetic.dtos.MonthlyStatsResponseDTO;
import com.kinetic.dtos.StartSessionResponseDTO;
import com.kinetic.dtos.WeeklyActivityResponseDTO;
import com.kinetic.services.PresenceService;
import com.kinetic.services.WorkoutSessionService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class WorkoutSessionController extends BaseController {

    private final WorkoutSessionService workoutSessionService;
    private final PresenceService presenceService;

    public WorkoutSessionController(WorkoutSessionService workoutSessionService,
                                     PresenceService presenceService) {
        this.workoutSessionService = workoutSessionService;
        this.presenceService = presenceService;
    }

    @PostMapping("/start")
    public ResponseEntity<StartSessionResponseDTO> startSession() {
        String userEmail = currentUserEmail();
        java.util.UUID sessionId = presenceService.startSession(userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(new StartSessionResponseDTO(sessionId));
    }

    @DeleteMapping("/active")
    public ResponseEntity<?> clearActiveSession() {
        String userEmail = currentUserEmail();
        presenceService.endSession(userEmail);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/log")
    public ResponseEntity<?> logSession(@Valid @RequestBody LogSessionRequestDTO request) {
        String userEmail = currentUserEmail();

        try {
            workoutSessionService.logSession(userEmail, request);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/monthly-stats")
    public ResponseEntity<MonthlyStatsResponseDTO> getMonthlyStats() {
        String userEmail = currentUserEmail();
        return ResponseEntity.ok(workoutSessionService.getMonthlyStats(userEmail));
    }

    @GetMapping("/weekly-activity")
    public ResponseEntity<WeeklyActivityResponseDTO> getWeeklyActivity() {
        String userEmail = currentUserEmail();
        return ResponseEntity.ok(workoutSessionService.getWeeklyActivity(userEmail));
    }
}
