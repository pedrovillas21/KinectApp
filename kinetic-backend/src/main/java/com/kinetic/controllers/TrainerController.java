package com.kinetic.controllers;

import com.kinetic.dtos.MonthlyStatsResponseDTO;
import com.kinetic.dtos.PlanEvolutionResponseDTO;
import com.kinetic.dtos.StatsSummaryResponseDTO;
import com.kinetic.dtos.TrainerInviteRequestDTO;
import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.dtos.TrainerWorkoutPlanRequestDTO;
import com.kinetic.dtos.WorkoutPlanResponseDTO;
import com.kinetic.services.StatsService;
import com.kinetic.services.TrainerLinkService;
import com.kinetic.services.TrainerPlanService;
import com.kinetic.services.WorkoutSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.lang.NonNull;
import java.util.List;
import java.util.UUID;

/** Endpoints do PERSONAL (papel garantido via @PreAuthorize + claim do JWT). */
@RestController
@RequestMapping("/api/trainer")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PERSONAL')")
@Tag(
        name = "Personal trainer",
        description = "Endpoints só para usuários com o papel PERSONAL: convidar alunos, ver a carteira de alunos "
                + "e montar as fichas de treino de cada aluno."
)
public class TrainerController extends BaseController {

    private final TrainerLinkService trainerLinkService;
    private final StatsService statsService;
    private final WorkoutSessionService workoutSessionService;
    private final TrainerPlanService trainerPlanService;

    @Operation(
            summary = "Convidar um aluno pelo e-mail",
            description = "Cria um convite de vínculo personal-aluno no banco, para o e-mail informado. O aluno "
                    + "precisa aceitar o convite pelo app dele (ver TrainerLinkService/StudentTrainerController) "
                    + "para o vínculo passar a valer."
    )
    @PostMapping("/invites")
    public ResponseEntity<TrainerLinkDTO> invite(@Valid @RequestBody TrainerInviteRequestDTO dto) {
        TrainerLinkDTO link = trainerLinkService.invite(currentUserEmail(), dto.getStudentEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(link);
    }

    @Operation(
            summary = "Listar os alunos vinculados",
            description = "Retorna todos os alunos já vinculados ao personal logado (convites aceitos), com o "
                    + "status do vínculo."
    )
    @GetMapping("/students")
    public ResponseEntity<List<TrainerLinkDTO>> students() {
        return ResponseEntity.ok(trainerLinkService.listStudents(currentUserEmail()));
    }

    // ── Dashboard do aluno (Fase 3 básica) ──────────────────────────────────
    // Reusa os services self-scoped por e-mail: o gate de posse
    // (resolveOwnedStudentEmail) traduz studentId → e-mail só quando existe
    // vínculo ATIVO com o personal logado; sem vínculo, 404.

    @Operation(
            summary = "Ver o resumo de estatísticas de um aluno",
            description = "Mesmo cálculo de GET /api/stats/summary, mas sobre o histórico do aluno informado. "
                    + "Exige vínculo ATIVO entre o personal logado e o aluno; sem vínculo, responde 404."
    )
    @GetMapping("/students/{studentId}/stats")
    public ResponseEntity<StatsSummaryResponseDTO> studentStats(
            @PathVariable @NonNull UUID studentId,
            @Parameter(description = "Período a calcular: \"week\", \"month\", \"q\" (trimestre) ou \"year\". Padrão: \"month\".")
            @RequestParam(name = "period", defaultValue = "month") String period) {
        String studentEmail = trainerLinkService.resolveOwnedStudentEmail(currentUserEmail(), studentId);
        return ResponseEntity.ok(statsService.getSummary(studentEmail, period));
    }

    @Operation(
            summary = "Comparar os ciclos de treino de um aluno",
            description = "Mesmo cálculo de GET /api/stats/plan-evolution, mas sobre o histórico do aluno informado. "
                    + "Exige vínculo ATIVO entre o personal logado e o aluno; sem vínculo, responde 404."
    )
    @GetMapping("/students/{studentId}/plan-evolution")
    public ResponseEntity<PlanEvolutionResponseDTO> studentPlanEvolution(@PathVariable @NonNull UUID studentId) {
        String studentEmail = trainerLinkService.resolveOwnedStudentEmail(currentUserEmail(), studentId);
        return ResponseEntity.ok(statsService.getPlanEvolution(studentEmail));
    }

    @Operation(
            summary = "Ver as estatísticas mensais de um aluno",
            description = "Mesmo cálculo de GET /api/sessions/monthly-stats, mas sobre o histórico do aluno "
                    + "informado. Exige vínculo ATIVO entre o personal logado e o aluno; sem vínculo, responde 404."
    )
    @GetMapping("/students/{studentId}/monthly-stats")
    public ResponseEntity<MonthlyStatsResponseDTO> studentMonthlyStats(@PathVariable @NonNull UUID studentId) {
        String studentEmail = trainerLinkService.resolveOwnedStudentEmail(currentUserEmail(), studentId);
        return ResponseEntity.ok(workoutSessionService.getMonthlyStats(studentEmail));
    }

    // ── Fichas do aluno (prescrição pelo personal) ──────────────────────────
    // Mesmo gate de posse: sem vínculo ATIVO com o aluno, 404.

    @Operation(
            summary = "Listar as fichas vigentes de um aluno",
            description = "Mesmo formato de GET /api/workouts/my-plans, sobre as fichas do aluno informado. Inclui "
                    + "fichas geradas por IA (prescribedByName = null) e as montadas por personal."
    )
    @GetMapping("/students/{studentId}/plans")
    public ResponseEntity<List<WorkoutPlanResponseDTO>> studentPlans(@PathVariable @NonNull UUID studentId) {
        return ResponseEntity.ok(trainerPlanService.listPlans(currentUserEmail(), studentId));
    }

    @Operation(
            summary = "Criar uma ficha para um aluno",
            description = "Salva uma ficha nova montada pelo personal; ela aparece na hora no app do aluno, ao lado "
                    + "das fichas vigentes. A ordem dos exercícios enviados é a ordem de exibição."
    )
    @PostMapping("/students/{studentId}/plans")
    public ResponseEntity<WorkoutPlanResponseDTO> createStudentPlan(
            @PathVariable @NonNull UUID studentId,
            @Valid @RequestBody TrainerWorkoutPlanRequestDTO dto) {
        WorkoutPlanResponseDTO plan = trainerPlanService.createPlan(currentUserEmail(), studentId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(plan);
    }

    @Operation(
            summary = "Editar uma ficha de um aluno",
            description = "Substitui o conteúdo da ficha. Exercícios enviados com id são atualizados no lugar, "
                    + "preservando o histórico de séries; os omitidos são arquivados (nunca apagados). Editar uma "
                    + "ficha gerada por IA passa a autoria para o personal."
    )
    @PutMapping("/students/{studentId}/plans/{planId}")
    public ResponseEntity<WorkoutPlanResponseDTO> updateStudentPlan(
            @PathVariable @NonNull UUID studentId,
            @PathVariable @NonNull UUID planId,
            @Valid @RequestBody TrainerWorkoutPlanRequestDTO dto) {
        return ResponseEntity.ok(trainerPlanService.updatePlan(currentUserEmail(), studentId, planId, dto));
    }

    @Operation(
            summary = "Remover uma ficha do app do aluno",
            description = "Arquiva a ficha (some do app do aluno). O histórico de sessões feitas com ela é mantido."
    )
    @DeleteMapping("/students/{studentId}/plans/{planId}")
    public ResponseEntity<Void> archiveStudentPlan(
            @PathVariable @NonNull UUID studentId,
            @PathVariable @NonNull UUID planId) {
        trainerPlanService.archivePlan(currentUserEmail(), studentId, planId);
        return ResponseEntity.noContent().build();
    }
}
