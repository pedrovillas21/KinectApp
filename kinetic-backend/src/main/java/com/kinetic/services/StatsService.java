package com.kinetic.services;

import com.kinetic.dtos.*;
import com.kinetic.enums.StatsPeriodParam;
import com.kinetic.models.User;
import com.kinetic.models.WeightHistory;
import com.kinetic.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatsService {

    private final WorkoutSessionRepository workoutSessionRepository;
    private final UserRepository userRepository;
    private final WeightHistoryRepository weightHistoryRepository;
    private final ExerciseSetLogRepository exerciseSetLogRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserService userService;
    private final CommunityStatsService communityStatsService;

    public StatsService(WorkoutSessionRepository workoutSessionRepository,
                        UserRepository userRepository,
                        WeightHistoryRepository weightHistoryRepository,
                        ExerciseSetLogRepository exerciseSetLogRepository,
                        ExerciseRepository exerciseRepository,
                        UserService userService,
                        CommunityStatsService communityStatsService) {
        this.workoutSessionRepository = workoutSessionRepository;
        this.userRepository = userRepository;
        this.weightHistoryRepository = weightHistoryRepository;
        this.exerciseSetLogRepository = exerciseSetLogRepository;
        this.exerciseRepository = exerciseRepository;
        this.userService = userService;
        this.communityStatsService = communityStatsService;
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
}
