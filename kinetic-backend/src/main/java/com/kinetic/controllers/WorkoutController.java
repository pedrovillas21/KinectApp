package com.kinetic.controllers;

import com.kinetic.dtos.GenerateWorkoutRequestDto;
import com.kinetic.dtos.WorkoutPlanResponseDTO;
import com.kinetic.services.GeminiService.InvalidGeminiResponseException;
import com.kinetic.services.WorkoutService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/workouts")
public class WorkoutController extends BaseController {

    private static final Logger log = LoggerFactory.getLogger(WorkoutController.class);

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateWorkout(@RequestBody GenerateWorkoutRequestDto request) {
        String userEmail = currentUserEmail();

        try {
            List<WorkoutPlanResponseDTO> response = workoutService.generateWorkoutForUser(userEmail, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (InvalidGeminiResponseException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Falha inesperada ao gerar treino para o usuário {}", userEmail, e);
            throw e;
        }
    }

    @GetMapping("/my-plans")
    public ResponseEntity<List<WorkoutPlanResponseDTO>> getMyPlans() {
        String userEmail = currentUserEmail();
        List<WorkoutPlanResponseDTO> plans = workoutService.getMyPlans(userEmail);
        return ResponseEntity.ok(plans);
    }
}
