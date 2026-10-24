package com.kinetic.dtos;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Exportação dos dados do usuário logado (LGPD, art. 18). Tudo que é dele ou
 * sobre ele; nunca hashes de senha, de tokens ou de códigos. Outras pessoas
 * aparecem só como {@link PersonRef} (id + nome) e nunca quando o próprio
 * registro as esconde (feedback anônimo recebido).
 */
public record AccountExportDTO(
        int formatVersion,
        Instant exportedAt,
        Profile profile,
        List<WeightEntry> weightHistory,
        List<LocalDate> loginDays,
        List<Plan> workoutPlans,
        List<Session> workoutSessions,
        List<ExecutionLog> workoutExecutionLogs,
        List<CycleSnapshot> planCycleSnapshots,
        List<Assessment> physicalAssessments,
        Social social,
        Trainer trainer
) {

    /** Outra pessoa citada num registro do usuário. */
    public record PersonRef(UUID id, String name) {}

    public record Profile(
            UUID id, String name, String email, String role, String status, boolean emailVerified,
            String cpf, String phone, String pixKey, UUID companyId,
            String level, LocalDate birthDate, Double weight, Double height, String goal, Integer frequency,
            String medicalConditions, Boolean workoutOnboardingCompleted, String avatarUrl,
            LocalDateTime createdAt, LocalDateTime lastActive
    ) {}

    public record WeightEntry(LocalDate date, Double weight) {}

    public record Plan(
            UUID id, String title, String subtitle, String tag, String level, String status,
            Integer estimatedDurationMinutes, LocalDateTime createdAt, PersonRef createdBy,
            List<PlanExercise> exercises
    ) {}

    public record PlanExercise(
            UUID id, String name, String muscles, String type, Integer sets, String reps, String weight,
            String restTime, String section, String notes, Integer sortOrder, boolean archived
    ) {}

    public record Session(
            UUID id, LocalDate date, Integer durationInSeconds, List<SetEntry> sets
    ) {}

    public record SetEntry(
            UUID exerciseId, String exerciseName, Integer setNumber, Integer reps, Double weightKg,
            LocalDateTime loggedAt
    ) {}

    public record ExecutionLog(UUID planId, String planTitle, LocalDateTime completedAt, Integer durationMinutes) {}

    public record CycleSnapshot(
            LocalDate cycleStartDate, LocalDate cycleEndDate, String goal, Double endWeight, Double totalVolume,
            Integer completedSessions, Integer targetSessions, Integer adherencePercentage,
            String volumeByMuscle, LocalDateTime createdAt
    ) {}

    public record Assessment(
            UUID id, LocalDate assessedOn, PersonRef student, PersonRef assessedBy,
            Double weightKg, Double heightCm, Double bodyFatPct, Double muscleMassKg, Integer restingHr,
            Double chestCm, Double waistCm, Double abdomenCm, Double hipCm,
            Double armRightCm, Double armLeftCm, Double thighRightCm, Double thighLeftCm,
            Double calfRightCm, Double calfLeftCm, String notes, Instant createdAt
    ) {}

    public record Social(
            List<Post> posts,
            List<Comment> comments,
            List<Like> likes,
            List<Connection> connections
    ) {}

    /** {@code imageKey}: caminho do arquivo no Storage privado (a URL é assinada sob demanda). */
    public record Post(
            UUID id, String kind, String category, String intensity, Integer durationMinutes, Integer calories,
            String caption, String imageKey, String badge, UUID workoutSessionId,
            LocalDateTime createdAt, LocalDateTime expiresAt
    ) {}

    public record Comment(UUID id, UUID postId, String body, LocalDateTime createdAt) {}

    public record Like(UUID postId, LocalDateTime createdAt) {}

    /** {@code direction}: SENT (você pediu) ou RECEIVED. */
    public record Connection(
            PersonRef user, String status, String direction, LocalDateTime createdAt, LocalDateTime respondedAt
    ) {}

    /**
     * Relação personal/aluno. Para o aluno, {@code links} lista os personais; para o
     * personal, os alunos. Cobranças e planos de cobrança aparecem dos dois lados.
     */
    public record Trainer(
            List<Link> links,
            List<BillingPlanEntry> studentBillingPlans,
            List<Charge> studentCharges,
            Subscription subscription,
            List<InviteCode> inviteCodes,
            List<FeedbackEntry> feedbacks,
            List<PlanRef> plansCreatedForOthers,
            List<AiGeneration> aiPlanGenerations
    ) {}

    /** {@code myRole}: STUDENT ou TRAINER neste vínculo. */
    public record Link(
            UUID id, String myRole, PersonRef counterpart, String status, String source,
            LocalDateTime createdAt, LocalDateTime respondedAt, LocalDateTime endedAt
    ) {}

    public record BillingPlanEntry(
            UUID id, PersonRef trainer, PersonRef student, int amountCents, int dueDay, boolean active,
            LocalDate startsOn, Instant createdAt
    ) {}

    public record Charge(
            UUID id, PersonRef trainer, PersonRef student, LocalDate referenceMonth, LocalDate dueDate,
            int amountCents, String status, LocalDate paidAt, String paymentMethod
    ) {}

    public record Subscription(
            String plan, String status, Instant trialEndsAt, Instant currentPeriodEnd, Instant canceledAt,
            String gateway, Instant createdAt
    ) {}

    public record InviteCode(String label, Instant expiresAt, UUID redeemedBy, Instant redeemedAt, Instant createdAt) {}

    /** {@code direction}: SENT (aluno) ou RECEIVED (personal; aluno omitido se anônimo). */
    public record FeedbackEntry(
            UUID id, String direction, PersonRef student, PersonRef personal, boolean anonymous,
            String content, LocalDateTime createdAt
    ) {}

    public record PlanRef(UUID id, String title, PersonRef owner, String status, LocalDateTime createdAt) {}

    /** {@code myRole}: TRAINER (pediu) ou STUDENT (para quem foi gerado). */
    public record AiGeneration(
            UUID id, String myRole, PersonRef counterpart, String status, String prompt, String options,
            String aiOutput, String approvedPlans, String declarationText, LocalDateTime createdAt,
            LocalDateTime approvedAt
    ) {}
}
