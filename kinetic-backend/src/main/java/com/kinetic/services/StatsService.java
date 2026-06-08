package com.kinetic.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinetic.dtos.*;
import com.kinetic.enums.StatsPeriodParam;
import com.kinetic.models.PlanCycleSnapshot;
import com.kinetic.models.User;
import com.kinetic.models.WeightHistory;
import com.kinetic.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class StatsService {

    private final WorkoutSessionRepository workoutSessionRepository;
    private final UserRepository userRepository;
    private final WeightHistoryRepository weightHistoryRepository;
    private final ExerciseSetLogRepository exerciseSetLogRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserService userService;
    private final CommunityStatsService communityStatsService;
    private final PlanCycleSnapshotRepository planCycleSnapshotRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final ObjectMapper objectMapper;

    public StatsService(WorkoutSessionRepository workoutSessionRepository,
                        UserRepository userRepository,
                        WeightHistoryRepository weightHistoryRepository,
                        ExerciseSetLogRepository exerciseSetLogRepository,
                        ExerciseRepository exerciseRepository,
                        UserService userService,
                        CommunityStatsService communityStatsService,
                        PlanCycleSnapshotRepository planCycleSnapshotRepository,
                        WorkoutPlanRepository workoutPlanRepository,
                        ObjectMapper objectMapper) {
        this.workoutSessionRepository = workoutSessionRepository;
        this.userRepository = userRepository;
        this.weightHistoryRepository = weightHistoryRepository;
        this.exerciseSetLogRepository = exerciseSetLogRepository;
        this.exerciseRepository = exerciseRepository;
        this.userService = userService;
        this.communityStatsService = communityStatsService;
        this.planCycleSnapshotRepository = planCycleSnapshotRepository;
        this.workoutPlanRepository = workoutPlanRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public StatsSummaryResponseDTO getSummary(String userEmail, String periodStr) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        StatsPeriodParam period = StatsPeriodParam.fromString(periodStr);
        LocalDate start     = period.startDate();
        LocalDate end       = period.endDate();
        LocalDate prevStart = period.previousStartDate();
        LocalDate prevEnd   = period.previousEndDate();

        boolean needsWeightUpdate = userService.needsWeightUpdate(userEmail);

        // ── Sessões e eficiência ─────────────────────────────────────────────
        int frequency      = (user.getFrequency() != null && user.getFrequency() > 0) ? user.getFrequency() : 0;
        int targetSessions = frequency > 0 ? period.targetSessions(frequency) : 0;

        long completedRaw = workoutSessionRepository
                .countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(
                        user.getId(), start, end.plusDays(1));
        int completedSessions = (int) completedRaw;
        int efficiencyPercent = targetSessions > 0
                ? (int) Math.min(100, Math.round(completedSessions * 100.0 / targetSessions))
                : 0;

        // ── Peso ─────────────────────────────────────────────────────────────
        WeightSummaryDTO weightSummary = buildWeightSummary(user, start, end);

        // ── Volume ───────────────────────────────────────────────────────────
        VolumeSummaryDTO volumeSummary = buildVolumeSummary(user, start, end, prevStart, prevEnd);

        // ── Comunidade ───────────────────────────────────────────────────────
        int communityAvg = communityStatsService.getAverageEfficiency();
        CommunityComparisonDTO community = new CommunityComparisonDTO(
                communityAvg,
                efficiencyPercent >= communityAvg
        );

        // ── Insight (motor de regras) ────────────────────────────────────────
        StatsInsightDTO insight = buildInsight(period, efficiencyPercent, weightSummary, volumeSummary);

        return new StatsSummaryResponseDTO(
                needsWeightUpdate,
                period.id(),
                efficiencyPercent,
                completedSessions,
                targetSessions,
                weightSummary,
                volumeSummary,
                community,
                insight
        );
    }

    // ── Peso ──────────────────────────────────────────────────────────────────

    private WeightSummaryDTO buildWeightSummary(User user, LocalDate start, LocalDate end) {
        List<WeightHistory> history = weightHistoryRepository
                .findByUserAndLoggedAtBetweenOrderByLoggedAtAsc(user, start, end);

        List<WeightPointDTO> points = history.stream()
                .map(h -> new WeightPointDTO(h.getLoggedAt(), h.getWeight()))
                .collect(Collectors.toList());

        double current;
        double delta;

        if (!history.isEmpty()) {
            current = history.get(history.size() - 1).getWeight();
            delta   = current - history.get(0).getWeight();
        } else {
            current = user.getWeight() != null ? user.getWeight() : 0.0;
            delta   = 0.0;
        }

        return new WeightSummaryDTO(points, current, delta, "kg");
    }

    // ── Volume ────────────────────────────────────────────────────────────────

    private VolumeSummaryDTO buildVolumeSummary(User user,
                                                LocalDate start,     LocalDate end,
                                                LocalDate prevStart, LocalDate prevEnd) {
        Map<String, Double> currentVolume  = volumeMapFromDB(user.getId(), start, end);
        Map<String, Double> previousVolume = volumeMapFromDB(user.getId(), prevStart, prevEnd);

        double totalCurrent  = currentVolume.values().stream().mapToDouble(Double::doubleValue).sum();
        double totalPrevious = previousVolume.values().stream().mapToDouble(Double::doubleValue).sum();
        int totalDeltaPct    = deltaPct(totalCurrent, totalPrevious);

        // Garante que grupos planejados mas não treinados apareçam como isRest
        // e que grupos treinados apenas no período anterior continuem visíveis
        // para preservar regressões (-100%) ao invés de sumirem silenciosamente.
        Set<String> allMuscles = new LinkedHashSet<>(
                exerciseRepository.findDistinctMusclesByUserId(user.getId()));
        allMuscles.addAll(currentVolume.keySet());
        allMuscles.addAll(previousVolume.keySet());

        List<VolumeByMuscleGroupDTO> byGroup = allMuscles.stream()
                .map(muscle -> {
                    double vol     = currentVolume.getOrDefault(muscle, 0.0);
                    double prevVol = previousVolume.getOrDefault(muscle, 0.0);
                    boolean isRest = vol == 0.0;
                    return new VolumeByMuscleGroupDTO(muscle, vol, deltaPct(vol, prevVol), isRest);
                })
                .collect(Collectors.toList());

        return new VolumeSummaryDTO(byGroup, totalCurrent, totalDeltaPct);
    }

    private Map<String, Double> volumeMapFromDB(UUID userId, LocalDate start, LocalDate end) {
        List<Object[]> rows = exerciseSetLogRepository.findVolumeByMuscleGroupBetween(userId, start, end);
        Map<String, Double> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String muscle = (row[0] != null) ? (String) row[0] : "Outros";
            double vol    = (row[1] instanceof Number n) ? n.doubleValue() : 0.0;
            map.put(muscle, vol);
        }
        return map;
    }

    private int deltaPct(double current, double previous) {
        if (previous == 0) return current > 0 ? 100 : 0;
        return (int) Math.round(((current - previous) / previous) * 100);
    }

    // ── Motor de regras do Insight ─────────────────────────────────────────────

    private StatsInsightDTO buildInsight(StatsPeriodParam period,
                                          int adherence,
                                          WeightSummaryDTO weight,
                                          VolumeSummaryDTO volume) {
        String tag = period.insightTag();

        // Regra 1: aderência alta + queda de peso → déficit calórico ajustado
        if (adherence >= 80 && weight.delta() < 0) {
            return new StatsInsightDTO(tag,
                    String.format("Aderência de %d%% somada à perda consistente de peso indica déficit "
                            + "calórico bem ajustado. Próximo passo: avaliar composição corporal.", adherence));
        }

        // Regra 2: aderência crítica → incentivo à consistência
        if (adherence < 50) {
            return new StatsInsightDTO(tag,
                    "Sua aderência está abaixo de 50%. Foque em retomar o ritmo: priorize 2–3 treinos "
                            + "curtos esta semana para reconstruir o hábito.");
        }

        // Regra 3: volume cresceu significativamente → elogio à progressão de carga
        if (volume.deltaPercentage() >= 10) {
            return new StatsInsightDTO(tag,
                    String.format("Volume total +%d%% — sinal claro de sobrecarga progressiva ativa. "
                            + "Mantenha a qualidade do sono para sustentar o crescimento.", volume.deltaPercentage()));
        }

        // Fallback genérico
        return new StatsInsightDTO(tag,
                String.format("Aderência em %d%%. Continue forçando os limites — "
                        + "pequenas melhorias compostas geram grandes resultados.", adherence));
    }

    // ── Evolução de ciclo (plano anterior vs. ciclo atual) ────────────────────

    @Transactional(readOnly = true)
    public PlanEvolutionResponseDTO getPlanEvolution(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Fonte da verdade: se não há snapshot anterior, não há comparação possível.
        Optional<PlanCycleSnapshot> latestSnapshot =
                planCycleSnapshotRepository.findFirstByUserIdOrderByCycleEndDateDesc(user.getId());

        if (latestSnapshot.isEmpty()) {
            return new PlanEvolutionResponseDTO(
                    false, false, null, null,
                    null, null, null,
                    0, 0, null, null);
        }

        PlanCycleSnapshot prev = latestSnapshot.get();

        // Início do ciclo atual = createdAt do plano ativo mais antigo
        Optional<java.time.LocalDateTime> cycleStartOpt =
                workoutPlanRepository.findEarliestActiveCreatedAt(user.getId());

        LocalDate cycleStart = cycleStartOpt
                .map(java.time.LocalDateTime::toLocalDate)
                .orElse(LocalDate.now());

        LocalDate today = LocalDate.now();

        // Sessões do ciclo atual
        long currentCompletedRaw = workoutSessionRepository
                .countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(
                        user.getId(), cycleStart, today.plusDays(1));
        int currentCompleted = (int) currentCompletedRaw;

        boolean currentCycleStarted = currentCompleted > 0;

        // Target do ciclo atual (guard de divisão por zero)
        int frequency = (user.getFrequency() != null && user.getFrequency() > 0) ? user.getFrequency() : 1;
        long dayCount = ChronoUnit.DAYS.between(cycleStart, today);
        int weeks = Math.max(1, (int) Math.ceil(dayCount / 7.0));
        int currentTarget = Math.max(frequency, frequency * weeks);
        int currentAdherencePct = currentTarget > 0
                ? (int) Math.min(100, Math.round(currentCompleted * 100.0 / currentTarget))
                : 0;

        // Volume atual
        Map<String, Double> currentVolumeMap = volumeMapFromDB(user.getId(), cycleStart, today);
        double currentTotalVolume = currentVolumeMap.values().stream().mapToDouble(Double::doubleValue).sum();

        // Peso atual
        double currentWeight = weightHistoryRepository.findFirstByUserOrderByLoggedAtDesc(user)
                .map(wh -> wh.getWeight())
                .orElse(user.getWeight() != null ? user.getWeight() : 0.0);

        // Snapshots anteriores
        double prevWeight = prev.getEndWeight() != null ? prev.getEndWeight() : 0.0;
        double prevVolume = prev.getTotalVolume() != null ? prev.getTotalVolume() : 0.0;
        double prevAdherence = prev.getAdherencePercentage() != null ? prev.getAdherencePercentage() : 0.0;

        String goal = prev.getGoal();

        // good = orientado ao objetivo
        boolean weightGood = isWeightDeltaGood(goal, currentWeight - prevWeight);
        MetricDeltaDTO weightDelta = new MetricDeltaDTO(prevWeight, currentWeight,
                currentWeight - prevWeight, weightGood);
        MetricDeltaDTO volumeDelta = new MetricDeltaDTO(prevVolume, currentTotalVolume,
                currentTotalVolume - prevVolume, currentTotalVolume >= prevVolume);
        MetricDeltaDTO adherenceDelta = new MetricDeltaDTO(prevAdherence, currentAdherencePct,
                currentAdherencePct - prevAdherence, currentAdherencePct >= prevAdherence);

        // volumeByMuscle do snapshot anterior deserializado
        Map<String, Double> prevVolumeByMuscle = deserializeVolumeByMuscle(prev.getVolumeByMuscle());

        StatsInsightDTO insight = buildEvolutionInsight(goal, weightDelta, volumeDelta, adherenceDelta);

        return new PlanEvolutionResponseDTO(
                true,
                currentCycleStarted,
                cycleStart,
                goal,
                weightDelta,
                volumeDelta,
                adherenceDelta,
                prev.getCompletedSessions() != null ? prev.getCompletedSessions() : 0,
                currentCompleted,
                prevVolumeByMuscle,
                insight
        );
    }

    private boolean isWeightDeltaGood(String goal, double delta) {
        if (goal == null) return delta < 0;
        String g = goal.toLowerCase();
        if (g.contains("hipertrofia") || g.contains("massa") || g.contains("ganho")) {
            return delta > 0;
        }
        return delta < 0; // emagrecimento e afins: perda é boa
    }

    private Map<String, Double> deserializeVolumeByMuscle(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Double>>() {});
        } catch (Exception e) {
            log.warn("Falha ao desserializar volumeByMuscle: {}", e.getMessage());
            return Map.of();
        }
    }

    private StatsInsightDTO buildEvolutionInsight(String goal,
                                                   MetricDeltaDTO weight,
                                                   MetricDeltaDTO volume,
                                                   MetricDeltaDTO adherence) {
        String tag = "Evolução do Plano";

        if (weight.good() && volume.delta() > 0) {
            return new StatsInsightDTO(tag,
                    "Peso em direção ao objetivo e volume crescendo — progressão sólida. Continue sobrecarregando gradualmente.");
        }
        if (adherence.current() >= 80 && volume.delta() > 0) {
            return new StatsInsightDTO(tag,
                    String.format("Aderência de %.0f%% e volume +%.0f kg — ciclo consistente e produtivo.",
                            adherence.current(), volume.delta()));
        }
        if (adherence.current() < 50) {
            return new StatsInsightDTO(tag,
                    "Aderência abaixo de 50% neste ciclo. Foque em retomar o ritmo antes de escalar a carga.");
        }
        if (!weight.good()) {
            return new StatsInsightDTO(tag,
                    "O peso foi na direção oposta ao objetivo. Revise alimentação e intensidade do treino.");
        }
        return new StatsInsightDTO(tag,
                String.format("Ciclo em andamento. Aderência: %.0f%% · Volume: %s.",
                        adherence.current(),
                        adherence.current() >= adherence.previous() ? "mantido" : "queda"));
    }
}
