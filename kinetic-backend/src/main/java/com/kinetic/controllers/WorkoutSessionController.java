package com.kinetic.controllers;

import com.kinetic.dtos.LogSessionRequestDTO;
import com.kinetic.dtos.MonthlyStatsResponseDTO;
import com.kinetic.dtos.StartSessionResponseDTO;
import com.kinetic.dtos.WeeklyActivityResponseDTO;
import com.kinetic.services.PresenceService;
import com.kinetic.services.WorkoutSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(
        name = "Sessões de treino",
        description = "Controle de uma sessão de treino em andamento (cronômetro) e registro do treino já executado."
)
public class WorkoutSessionController extends BaseController {

    private final WorkoutSessionService workoutSessionService;
    private final PresenceService presenceService;

    public WorkoutSessionController(WorkoutSessionService workoutSessionService,
                                     PresenceService presenceService) {
        this.workoutSessionService = workoutSessionService;
        this.presenceService = presenceService;
    }

    @Operation(
            summary = "Avisar que o usuário começou a treinar agora",
            description = "Marca no banco que o usuário iniciou uma sessão de treino neste momento e devolve um "
                    + "identificador dessa sessão. Serve para o app saber que existe um treino \"em andamento\" caso "
                    + "o usuário feche e reabra o aplicativo."
    )
    @PostMapping("/start")
    public ResponseEntity<StartSessionResponseDTO> startSession() {
        String userEmail = currentUserEmail();
        java.util.UUID sessionId = presenceService.startSession(userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(new StartSessionResponseDTO(sessionId));
    }

    @Operation(
            summary = "Cancelar/encerrar a sessão em andamento",
            description = "Apaga o registro de \"treino em andamento\" do usuário, sem salvar histórico. Use quando "
                    + "o usuário sai do treino sem concluir (não é o mesmo que registrar o treino feito — para isso "
                    + "use /api/sessions/log)."
    )
    @DeleteMapping("/active")
    public ResponseEntity<?> clearActiveSession() {
        String userEmail = currentUserEmail();
        presenceService.endSession(userEmail);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Registrar um treino concluído",
            description = "Salva no banco os exercícios, séries, cargas e repetições que o usuário realmente fez "
                    + "nessa sessão. É esse registro que alimenta as estatísticas e o histórico do usuário."
    )
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

    @Operation(
            summary = "Ver o resumo do mês de treinos",
            description = "Soma, a partir do histórico salvo no banco, quantos treinos foram feitos e outros "
                    + "números do mês atual do usuário logado."
    )
    @GetMapping("/monthly-stats")
    public ResponseEntity<MonthlyStatsResponseDTO> getMonthlyStats() {
        String userEmail = currentUserEmail();
        return ResponseEntity.ok(workoutSessionService.getMonthlyStats(userEmail));
    }

    @Operation(
            summary = "Ver a atividade da semana",
            description = "Retorna, dia a dia da semana atual, se o usuário treinou ou não — o dado que alimenta o "
                    + "calendário/streak semanal do app."
    )
    @GetMapping("/weekly-activity")
    public ResponseEntity<WeeklyActivityResponseDTO> getWeeklyActivity() {
        String userEmail = currentUserEmail();
        return ResponseEntity.ok(workoutSessionService.getWeeklyActivity(userEmail));
    }
}
