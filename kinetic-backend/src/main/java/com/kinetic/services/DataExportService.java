package com.kinetic.services;

import com.kinetic.dtos.AccountExportDTO;
import com.kinetic.dtos.AccountExportDTO.*;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.*;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Monta a exportação dos dados do usuário logado ({@link AccountExportDTO}).
 * Consultas próprias via JPQL para não depender de métodos de repositório que
 * outras telas usam com outra forma; tudo numa transação só leitura, com os
 * relacionamentos necessários em JOIN FETCH para não cair em N+1.
 */
@Service
public class DataExportService {

    static final int FORMAT_VERSION = 1;

    @PersistenceContext
    private EntityManager em;

    private final UserRepository userRepository;

    public DataExportService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public AccountExportDTO export(String userEmail) {
        User user = userRepository.getByEmailOrThrow(userEmail);
        UUID id = user.getId();

        return new AccountExportDTO(
                FORMAT_VERSION,
                Instant.now(),
                profile(user),
                list("SELECT w FROM WeightHistory w WHERE w.user.id = :id ORDER BY w.loggedAt", WeightHistory.class, id)
                        .stream().map(w -> new WeightEntry(w.getLoggedAt(), w.getWeight())).toList(),
                list("SELECT s.loginDate FROM UserLoginStreak s WHERE s.user.id = :id ORDER BY s.loginDate", LocalDate.class, id),
                plans(id),
                sessions(id),
                list("SELECT l FROM WorkoutExecutionLog l JOIN FETCH l.workoutPlan WHERE l.user.id = :id ORDER BY l.completionDate",
                        WorkoutExecutionLog.class, id).stream()
                        .map(l -> new ExecutionLog(l.getWorkoutPlan().getId(), l.getWorkoutPlan().getTitle(),
                                l.getCompletionDate(), l.getDurationMinutes()))
                        .toList(),
                list("SELECT c FROM PlanCycleSnapshot c WHERE c.user.id = :id ORDER BY c.cycleStartDate",
                        PlanCycleSnapshot.class, id).stream()
                        .map(c -> new CycleSnapshot(c.getCycleStartDate(), c.getCycleEndDate(), c.getGoal(),
                                c.getEndWeight(), c.getTotalVolume(), c.getCompletedSessions(), c.getTargetSessions(),
                                c.getAdherencePercentage(), c.getVolumeByMuscle(), c.getCreatedAt()))
                        .toList(),
                assessments(id, activeStudents(id)),
                social(id),
                trainer(id, activeStudents(id))
        );
    }

    /**
     * Alunos com vínculo ATIVO com o usuário (como personal). Dado de saúde de ex-aluno
     * não vai na exportação do personal: é do aluno, que tem a própria exportação.
     */
    private Set<UUID> activeStudents(UUID trainerId) {
        return Set.copyOf(em.createQuery("SELECT t.student.id FROM TrainerClient t "
                        + "WHERE t.trainer.id = :id AND t.status = :status", UUID.class)
                .setParameter("id", trainerId)
                .setParameter("status", TrainerLinkStatus.ATIVO)
                .getResultList());
    }

    private static Profile profile(User u) {
        return new Profile(u.getId(), u.getNome(), u.getEmail(), name(u.getRole()), name(u.getStatus()),
                u.isEmailVerified(), u.getCpf(), u.getPhone(), u.getPixKey(), u.getCompanyId(),
                u.getLevel(), u.getBirthDate(), u.getWeight(), u.getHeight(), u.getGoal(), u.getFrequency(),
                u.getMedicalConditions(), u.getWorkoutOnboardingCompleted(), u.getAvatarUrl(),
                u.getCreatedAt(), u.getLastActive());
    }

    private List<Plan> plans(UUID id) {
        Map<UUID, List<PlanExercise>> exercisesByPlan = list(
                "SELECT e FROM Exercise e WHERE e.workoutPlan.user.id = :id ORDER BY e.sortOrder NULLS LAST, e.name",
                Exercise.class, id).stream()
                .collect(Collectors.groupingBy(e -> e.getWorkoutPlan().getId(), Collectors.mapping(
                        e -> new PlanExercise(e.getId(), e.getName(), e.getMuscles(), e.getType(), e.getSets(),
                                e.getReps(), e.getWeight(), e.getRestTime(), e.getSection(), e.getNotes(),
                                e.getSortOrder(), e.isArchived()),
                        Collectors.toList())));

        return list("SELECT p FROM WorkoutPlan p LEFT JOIN FETCH p.createdBy WHERE p.user.id = :id ORDER BY p.createdAt",
                WorkoutPlan.class, id).stream()
                .map(p -> new Plan(p.getId(), p.getTitle(), p.getSubtitle(), p.getTag(), p.getLevel(), p.getStatus(),
                        p.getEstimatedDurationMinutes(), p.getCreatedAt(), ref(p.getCreatedBy()),
                        exercisesByPlan.getOrDefault(p.getId(), List.of())))
                .toList();
    }

    private List<Session> sessions(UUID id) {
        Map<UUID, List<SetEntry>> setsBySession = list(
                "SELECT l FROM ExerciseSetLog l JOIN FETCH l.exercise WHERE l.workoutSession.user.id = :id "
                        + "ORDER BY l.loggedAt, l.setNumber",
                ExerciseSetLog.class, id).stream()
                .collect(Collectors.groupingBy(l -> l.getWorkoutSession().getId(), Collectors.mapping(
                        l -> new SetEntry(l.getExercise().getId(), l.getExercise().getName(), l.getSetNumber(),
                                l.getRepsPerformed(), l.getWeightUsed(), l.getLoggedAt()),
                        Collectors.toList())));

        return list("SELECT s FROM WorkoutSession s WHERE s.user.id = :id ORDER BY s.sessionDate",
                WorkoutSession.class, id).stream()
                .map(s -> new Session(s.getId(), s.getSessionDate(), s.getDurationInSeconds(),
                        setsBySession.getOrDefault(s.getId(), List.of())))
                .toList();
    }

    /** Avaliações em que o usuário é o aluno avaliado ou o personal que avaliou (só de alunos ativos). */
    private List<Assessment> assessments(UUID id, Set<UUID> activeStudents) {
        return list("SELECT a FROM PhysicalAssessment a JOIN FETCH a.student LEFT JOIN FETCH a.trainer "
                        + "WHERE a.student.id = :id OR a.trainer.id = :id ORDER BY a.assessedOn",
                PhysicalAssessment.class, id).stream()
                .filter(a -> a.getStudent().getId().equals(id) || activeStudents.contains(a.getStudent().getId()))
                .map(a -> new Assessment(a.getId(), a.getAssessedOn(), ref(a.getStudent()), ref(a.getTrainer()),
                        a.getWeightKg(), a.getHeightCm(), a.getBodyFatPct(), a.getMuscleMassKg(), a.getRestingHr(),
                        a.getChestCm(), a.getWaistCm(), a.getAbdomenCm(), a.getHipCm(),
                        a.getArmRightCm(), a.getArmLeftCm(), a.getThighRightCm(), a.getThighLeftCm(),
                        a.getCalfRightCm(), a.getCalfLeftCm(), a.getNotes(), a.getCreatedAt()))
                .toList();
    }

    private Social social(UUID id) {
        List<Post> posts = list("SELECT p FROM SocialPost p LEFT JOIN FETCH p.workoutSession WHERE p.author.id = :id "
                        + "ORDER BY p.createdAt", SocialPost.class, id).stream()
                .map(p -> new Post(p.getId(), p.getKind(), p.getCategory(), p.getIntensity(), p.getDurationMinutes(),
                        p.getCalories(), p.getCaption(), p.getImageUrl(), p.getBadge(),
                        p.getWorkoutSession() == null ? null : p.getWorkoutSession().getId(),
                        p.getCreatedAt(), p.getExpiresAt()))
                .toList();

        List<Comment> comments = list("SELECT c FROM PostComment c JOIN FETCH c.post WHERE c.user.id = :id "
                        + "ORDER BY c.createdAt", PostComment.class, id).stream()
                .map(c -> new Comment(c.getId(), c.getPost().getId(), c.getBody(), c.getCreatedAt()))
                .toList();

        List<Like> likes = list("SELECT l FROM PostLike l JOIN FETCH l.post WHERE l.user.id = :id ORDER BY l.createdAt",
                PostLike.class, id).stream()
                .map(l -> new Like(l.getPost().getId(), l.getCreatedAt()))
                .toList();

        List<Connection> connections = list("SELECT c FROM UserConnection c JOIN FETCH c.requester JOIN FETCH c.addressee "
                        + "WHERE c.requester.id = :id OR c.addressee.id = :id ORDER BY c.createdAt",
                UserConnection.class, id).stream()
                .map(c -> {
                    boolean sent = c.getRequester().getId().equals(id);
                    return new Connection(ref(sent ? c.getAddressee() : c.getRequester()), c.getStatus(),
                            sent ? "SENT" : "RECEIVED", c.getCreatedAt(), c.getRespondedAt());
                })
                .toList();

        return new Social(posts, comments, likes, connections);
    }

    private Trainer trainer(UUID id, Set<UUID> activeStudents) {
        List<Link> links = list("SELECT t FROM TrainerClient t JOIN FETCH t.trainer JOIN FETCH t.student "
                        + "WHERE t.trainer.id = :id OR t.student.id = :id ORDER BY t.createdAt",
                TrainerClient.class, id).stream()
                .map(t -> {
                    boolean isTrainer = t.getTrainer().getId().equals(id);
                    return new Link(t.getId(), isTrainer ? "TRAINER" : "STUDENT",
                            ref(isTrainer ? t.getStudent() : t.getTrainer()), name(t.getStatus()), name(t.getSource()),
                            t.getCreatedAt(), t.getRespondedAt(), t.getEndedAt());
                })
                .toList();

        List<BillingPlanEntry> billingPlans = list("SELECT b FROM StudentBillingPlan b JOIN FETCH b.trainer JOIN FETCH b.student "
                        + "WHERE b.trainer.id = :id OR b.student.id = :id ORDER BY b.createdAt",
                StudentBillingPlan.class, id).stream()
                .map(b -> new BillingPlanEntry(b.getId(), ref(b.getTrainer()), ref(b.getStudent()), b.getAmountCents(),
                        b.getDueDay(), b.isActive(), b.getStartsOn(), b.getCreatedAt()))
                .toList();

        List<Charge> charges = list("SELECT c FROM StudentCharge c JOIN FETCH c.trainer LEFT JOIN FETCH c.student s "
                        + "WHERE c.trainer.id = :id OR s.id = :id ORDER BY c.referenceMonth",
                StudentCharge.class, id).stream()
                .map(c -> new Charge(c.getId(), ref(c.getTrainer()),
                        // Aluno que excluiu a conta: só o nome guardado na cobrança retida.
                        c.getStudent() != null ? ref(c.getStudent()) : new PersonRef(null, c.getStudentName()),
                        c.getReferenceMonth(),
                        c.getDueDate(), c.getAmountCents(), c.getStatus(), c.getPaidAt(), c.getPaymentMethod()))
                .toList();

        Subscription subscription = list("SELECT s FROM TrainerSubscription s WHERE s.trainer.id = :id",
                TrainerSubscription.class, id).stream()
                .findFirst()
                .map(s -> new Subscription(name(s.getPlan()), name(s.getStatus()), s.getTrialEndsAt(),
                        s.getCurrentPeriodEnd(), s.getCanceledAt(), s.getGateway(), s.getCreatedAt()))
                .orElse(null);

        List<InviteCode> inviteCodes = list("SELECT i FROM TrainerInviteCode i WHERE i.trainer.id = :id ORDER BY i.createdAt",
                TrainerInviteCode.class, id).stream()
                .map(i -> new InviteCode(i.getLabel(), i.getExpiresAt(), i.getRedeemedBy(), i.getRedeemedAt(),
                        i.getCreatedAt()))
                .toList();

        List<FeedbackEntry> feedbacks = list("SELECT f FROM Feedback f JOIN FETCH f.student JOIN FETCH f.personal "
                        + "WHERE f.student.id = :id OR f.personal.id = :id ORDER BY f.createdAt",
                Feedback.class, id).stream()
                .map(f -> {
                    boolean sent = f.getStudent().getId().equals(id);
                    // Feedback anônimo recebido pelo personal continua anônimo na exportação dele.
                    PersonRef student = sent || !f.isAnonymous() ? ref(f.getStudent()) : null;
                    return new FeedbackEntry(f.getId(), sent ? "SENT" : "RECEIVED", student, ref(f.getPersonal()),
                            f.isAnonymous(), f.getContent(), f.getCreatedAt());
                })
                .toList();

        List<PlanRef> plansForOthers = list("SELECT p FROM WorkoutPlan p JOIN FETCH p.user "
                        + "WHERE p.createdBy.id = :id AND p.user.id <> :id ORDER BY p.createdAt",
                WorkoutPlan.class, id).stream()
                .filter(p -> activeStudents.contains(p.getUser().getId()))
                .map(p -> new PlanRef(p.getId(), p.getTitle(), ref(p.getUser()), p.getStatus(), p.getCreatedAt()))
                .toList();

        List<AiGeneration> aiGenerations = list("SELECT g FROM AiPlanGeneration g LEFT JOIN FETCH g.trainer "
                        + "LEFT JOIN FETCH g.student WHERE g.trainer.id = :id OR g.student.id = :id ORDER BY g.createdAt",
                AiPlanGeneration.class, id).stream()
                // Como personal, só as gerações de alunos ativos (a geração traz a anamnese do aluno).
                .filter(g -> g.getStudent() != null && (g.getStudent().getId().equals(id)
                        || activeStudents.contains(g.getStudent().getId())))
                .map(g -> {
                    boolean isTrainer = g.getTrainer() != null && g.getTrainer().getId().equals(id);
                    return new AiGeneration(g.getId(), isTrainer ? "TRAINER" : "STUDENT",
                            ref(isTrainer ? g.getStudent() : g.getTrainer()), g.getStatus(), g.getPrompt(),
                            g.getOptions(), g.getAiOutput(), g.getApprovedPlans(), g.getDeclarationText(),
                            g.getCreatedAt(), g.getApprovedAt());
                })
                .toList();

        return new Trainer(links, billingPlans, charges, subscription, inviteCodes, feedbacks, plansForOthers,
                aiGenerations);
    }

    private <T> List<T> list(String jpql, Class<T> type, UUID id) {
        return em.createQuery(jpql, type).setParameter("id", id).getResultList();
    }

    private static PersonRef ref(User u) {
        return u == null ? null : new PersonRef(u.getId(), u.getNome());
    }

    private static String name(Enum<?> e) {
        return e == null ? null : e.name();
    }
}
