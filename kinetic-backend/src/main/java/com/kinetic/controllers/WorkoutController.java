package com.kinetic.controllers;

import com.kinetic.dtos.GenerateWorkoutRequestDto;
import com.kinetic.dtos.WorkoutPlanResponseDTO;
import com.kinetic.services.GeminiService.InvalidGeminiResponseException;
import com.kinetic.services.WorkoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(
        name = "Treinos (fichas)",
        description = "Geração de fichas de treino por IA e consulta das fichas já salvas do usuário logado."
)
public class WorkoutController extends BaseController {

    private static final Logger log = LoggerFactory.getLogger(WorkoutController.class);

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    @Operation(
            summary = "Gerar uma ficha de treino nova com IA",
            description = "Envia as preferências do usuário (objetivo, dias disponíveis, nível etc.) para o serviço "
                    + "de IA (Gemini), que monta uma ficha de treino. O resultado é salvo no banco e devolvido na "
                    + "resposta. Pode demorar alguns segundos, pois depende de uma chamada externa à IA."
    )
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

    @Operation(
            summary = "Listar as fichas de treino do usuário",
            description = "Busca no banco todas as fichas de treino já geradas para o usuário logado, da mais "
                    + "recente para a mais antiga."
    )
    @GetMapping("/my-plans")
    public ResponseEntity<List<WorkoutPlanResponseDTO>> getMyPlans() {
        String userEmail = currentUserEmail();
        List<WorkoutPlanResponseDTO> plans = workoutService.getMyPlans(userEmail);
        return ResponseEntity.ok(plans);
    }
}
