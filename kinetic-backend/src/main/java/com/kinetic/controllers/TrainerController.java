package com.kinetic.controllers;

import com.kinetic.dtos.AiPlanContextDTO;
import com.kinetic.dtos.AlertPauseRequestDTO;
import com.kinetic.dtos.AiPlanPreviewDTO;
import com.kinetic.dtos.InviteCodeCreateRequestDTO;
import com.kinetic.dtos.MonthlyStatsResponseDTO;
import com.kinetic.dtos.PlanEvolutionResponseDTO;
import com.kinetic.dtos.StatsSummaryResponseDTO;
import com.kinetic.dtos.StudentEngagementDTO;
import com.kinetic.dtos.StudentProtocolDTOs;
import com.kinetic.dtos.TodayItemDTO;
import com.kinetic.dtos.TrainerAiPlanApproveRequestDTO;
import com.kinetic.dtos.TrainerAiPlanRequestDTO;
import com.kinetic.dtos.TrainerInviteCodeDTO;
import com.kinetic.dtos.TrainerInviteRequestDTO;
import com.kinetic.dtos.TrainerLinkDTO;
import com.kinetic.dtos.TrainerWorkoutPlanRequestDTO;
import com.kinetic.dtos.WorkoutPlanResponseDTO;
import com.kinetic.services.StatsService;
import com.kinetic.services.StudentProtocolService;
import com.kinetic.services.TrainerAiPlanService;
import com.kinetic.services.TrainerEventService;
import com.kinetic.services.TrainerEngagementService;
import com.kinetic.services.TrainerTodayService;
import com.kinetic.services.TrainerInviteCodeService;
import com.kinetic.services.TrainerLinkService;
import com.kinetic.services.TrainerPlanService;
import com.kinetic.services.WorkoutSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import org.springframework.lang.NonNull;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    private final TrainerAiPlanService trainerAiPlanService;
    private final TrainerInviteCodeService trainerInviteCodeService;
    private final TrainerEngagementService trainerEngagementService;
    private final TrainerTodayService trainerTodayService;
    private final TrainerEventService trainerEventService;
    private final StudentProtocolService studentProtocolService;

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

    // ── Convite por link (aluno sem conta) ───────────────────────────────────

    @Operation(
            summary = "Gerar um link de convite",
            description = "Cria um código de uso único, válido por 7 dias, para o personal mandar ao aluno (ex.: "
                    + "pelo WhatsApp). O código em claro só vem nesta resposta; o servidor guarda apenas o hash. "
                    + "Quando o aluno resgata o código no app, o vínculo já nasce ATIVO."
    )
    @PostMapping("/invite-codes")
    public ResponseEntity<TrainerInviteCodeDTO> createInviteCode(@Valid @RequestBody InviteCodeCreateRequestDTO dto) {
        TrainerInviteCodeDTO invite = trainerInviteCodeService.create(currentUserEmail(), dto.getLabel());
        return ResponseEntity.status(HttpStatus.CREATED).body(invite);
    }

    @Operation(
            summary = "Listar links de convite em aberto",
            description = "Convites por link ainda não usados pelo aluno, inclusive os vencidos (para renovar). "
                    + "Não traz o código: para reenviar, gere um novo."
    )
    @GetMapping("/invite-codes")
    public ResponseEntity<List<TrainerInviteCodeDTO>> listInviteCodes() {
        return ResponseEntity.ok(trainerInviteCodeService.listOpen(currentUserEmail()));
    }

    @Operation(
            summary = "Gerar um novo código para um convite",
            description = "Troca o código do convite (o link antigo para de funcionar) e renova a validade por "
                    + "mais 7 dias. O código novo só vem nesta resposta."
    )
    @PostMapping("/invite-codes/{inviteId}/regenerate")
    public ResponseEntity<TrainerInviteCodeDTO> regenerateInviteCode(@PathVariable @NonNull UUID inviteId) {
        return ResponseEntity.ok(trainerInviteCodeService.regenerate(currentUserEmail(), inviteId));
    }

    @Operation(
            summary = "Cancelar um link de convite",
            description = "Apaga o convite ainda não usado; o link enviado deixa de funcionar."
    )
    @DeleteMapping("/invite-codes/{inviteId}")
    public ResponseEntity<Void> revokeInviteCode(@PathVariable @NonNull UUID inviteId) {
        trainerInviteCodeService.revoke(currentUserEmail(), inviteId);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Caixa de entrada \"Hoje\"",
            description = "Pendências que pedem ação, da mais urgente para a menos: cobranças atrasadas ou "
                    + "vencendo, alunos em risco, prévias de IA esperando revisão, reavaliações, fichas antigas e "
                    + "convites vencendo. Cada item traz a rota do painel onde se resolve."
    )
    @GetMapping("/today")
    public ResponseEntity<List<TodayItemDTO>> today() {
        return ResponseEntity.ok(trainerTodayService.today(currentUserEmail()));
    }

    @Operation(
            summary = "Painel de aderência da carteira",
            description = "Para cada aluno ativo: último treino, aderência recente (janela móvel de até 28 dias) e "
                    + "alertas de risco de abandono (nunca treinou, inativo, queda de aderência, aderência baixa), "
                    + "com o risco geral ALTO, MEDIO ou OK."
    )
    @GetMapping("/students/engagement")
    public ResponseEntity<List<StudentEngagementDTO>> engagement() {
        return ResponseEntity.ok(trainerEngagementService.engagement(currentUserEmail()));
    }

    @Operation(
            summary = "Pausar os alertas de risco de um aluno",
            description = "Esconde os alertas do aluno (fila de hoje e painel de risco) por N dias, contando hoje, "
                    + "com o motivo (LESAO, VIAGEM, CONTATO, OUTRO) e uma nota opcional. Pausar de novo sobrescreve."
    )
    @PutMapping("/students/{studentId}/alert-pause")
    public ResponseEntity<StudentEngagementDTO.Pause> pauseAlerts(@PathVariable @NonNull UUID studentId,
                                                                  @Valid @RequestBody AlertPauseRequestDTO dto) {
        return ResponseEntity.ok(trainerEngagementService.pauseAlerts(currentUserEmail(), studentId, dto));
    }

    @Operation(
            summary = "Ignorar o lembrete do dia de um aluno",
            description = "Tira o item \"ainda não treinou hoje\" do aluno da fila de hoje até o dia seguinte."
    )
    @PostMapping("/students/{studentId}/today-dismiss")
    public ResponseEntity<Void> dismissMissedToday(@PathVariable @NonNull UUID studentId) {
        trainerTodayService.dismissMissedToday(currentUserEmail(), studentId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Reativar os alertas de risco de um aluno")
    @DeleteMapping("/students/{studentId}/alert-pause")
    public ResponseEntity<Void> resumeAlerts(@PathVariable @NonNull UUID studentId) {
        trainerEngagementService.resumeAlerts(currentUserEmail(), studentId);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Encerrar o vínculo com um aluno",
            description = "Tira o aluno da carteira do personal (ex.: o aluno cancelou o serviço). O personal perde "
                    + "o acesso aos dados dele e o aluno volta a controlar as próprias fichas. O histórico de treinos "
                    + "do aluno não é apagado. 404 = aluno fora da carteira; 400 = vínculo atribuído pela empresa."
    )
    @DeleteMapping("/students/{studentId}")
    public ResponseEntity<Void> endStudentLink(@PathVariable @NonNull UUID studentId) {
        trainerLinkService.endLinkByTrainer(currentUserEmail(), studentId);
        return ResponseEntity.noContent().build();
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
            summary = "Ver as estatísticas mensais de todos os alunos",
            description = "Mesmo cálculo de GET /students/{studentId}/monthly-stats para cada aluno com vínculo "
                    + "ATIVO, numa resposta só: mapa studentId → estatísticas."
    )
    @GetMapping("/students/monthly-stats")
    public ResponseEntity<Map<UUID, MonthlyStatsResponseDTO>> studentsMonthlyStats() {
        // shortcut: 2 consultas por aluno no servidor (ok até ~60 alunos); com carteiras maiores, agrupar num COUNT ... GROUP BY.
        Map<UUID, MonthlyStatsResponseDTO> stats = new LinkedHashMap<>();
        for (TrainerLinkDTO link : trainerLinkService.listStudents(currentUserEmail())) {
            stats.put(link.peer().id(), workoutSessionService.getMonthlyStats(link.peer().email()));
        }
        return ResponseEntity.ok(stats);
    }

    @Operation(
            summary = "Receber avisos em tempo real",
            description = "Stream SSE (text/event-stream). A cada mudança relevante (treino concluído, peso, protocolo, "
                    + "vínculo, cobrança) chega um evento \"change\" com {type, studentId}; o painel recarrega a tela "
                    + "aberta. Comentário \"ping\" a cada 25s mantém a conexão viva."
    )
    @GetMapping(path = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events(HttpServletResponse response) {
        // Sem buffer em proxy (nginx) e sem cache: cada evento sai na hora.
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache");
        return trainerEventService.subscribe(currentUserEmail());
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

    @Operation(
            summary = "Ver o protocolo e a anamnese de um aluno",
            description = "Objetivo, nível, frequência e anamnese do aluno, com quem mudou por último e quando o "
                    + "aluno conferiu a anamnese no app."
    )
    @GetMapping("/students/{studentId}/protocol")
    public ResponseEntity<StudentProtocolDTOs.Response> studentProtocol(@PathVariable @NonNull UUID studentId) {
        return ResponseEntity.ok(studentProtocolService.getForTrainer(currentUserEmail(), studentId));
    }

    @Operation(
            summary = "Definir o protocolo e a anamnese de um aluno",
            description = "Com vínculo ativo, objetivo, nível e frequência são do personal (o aluno só vê no app). "
                    + "Mudar a anamnese pede uma nova conferência do aluno. As fichas atuais não mudam."
    )
    @PutMapping("/students/{studentId}/protocol")
    public ResponseEntity<StudentProtocolDTOs.Response> updateStudentProtocol(
            @PathVariable @NonNull UUID studentId,
            @Valid @RequestBody StudentProtocolDTOs.UpdateRequest dto) {
        return ResponseEntity.ok(studentProtocolService.updateByTrainer(currentUserEmail(), studentId, dto));
    }

    // ── Fichas geradas por IA a pedido do personal ──────────────────────────
    // A IA só gera a prévia; as fichas chegam ao aluno quando o personal aprova.

    @Operation(
            summary = "Ver o que a IA considera do aluno",
            description = "Dados da anamnese do aluno (objetivo, nível, idade, peso, altura, frequência e condições "
                    + "médicas) que vão para a IA junto com o pedido do personal, e quantas fichas ele tem hoje."
    )
    @GetMapping("/students/{studentId}/ai-plans/context")
    public ResponseEntity<AiPlanContextDTO> aiPlanContext(@PathVariable @NonNull UUID studentId) {
        return ResponseEntity.ok(trainerAiPlanService.getContext(currentUserEmail(), studentId));
    }

    @Operation(
            summary = "Gerar uma prévia de fichas com IA",
            description = "O Gemini monta as fichas a partir do pedido do personal e do perfil do aluno. Nada é salvo "
                    + "no app do aluno: a resposta é uma prévia para revisão, válida por 24 horas. Pode levar alguns "
                    + "segundos. 502/503 = a IA falhou ou está indisponível."
    )
    @PostMapping("/students/{studentId}/ai-plans/preview")
    public ResponseEntity<AiPlanPreviewDTO> generateAiPlanPreview(
            @PathVariable @NonNull UUID studentId,
            @Valid @RequestBody TrainerAiPlanRequestDTO dto) {
        AiPlanPreviewDTO preview = trainerAiPlanService.generatePreview(currentUserEmail(), studentId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(preview);
    }

    @Operation(
            summary = "Aprovar uma prévia de fichas da IA",
            description = "Salva as fichas como o personal as revisou, prescritas por ele, e registra a declaração "
                    + "de revisão aceita. Com replaceCurrent, as fichas atuais do aluno são arquivadas. 409 = prévia "
                    + "já aprovada ou expirada."
    )
    @PostMapping("/students/{studentId}/ai-plans/{generationId}/approve")
    public ResponseEntity<List<WorkoutPlanResponseDTO>> approveAiPlans(
            @PathVariable @NonNull UUID studentId,
            @PathVariable @NonNull UUID generationId,
            @Valid @RequestBody TrainerAiPlanApproveRequestDTO dto) {
        List<WorkoutPlanResponseDTO> plans =
                trainerAiPlanService.approve(currentUserEmail(), studentId, generationId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(plans);
    }
}
