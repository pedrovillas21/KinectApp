package com.kinetic.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinetic.models.PlanCycleSnapshot;
import com.kinetic.models.User;
import com.kinetic.repositories.ExerciseSetLogRepository;
import com.kinetic.repositories.PlanCycleSnapshotRepository;
import com.kinetic.repositories.WeightHistoryRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class PlanCycleSnapshotService {

    private final PlanCycleSnapshotRepository snapshotRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final ExerciseSetLogRepository exerciseSetLogRepository;
    private final WeightHistoryRepository weightHistoryRepository;
    private final ObjectMapper objectMapper;

    public PlanCycleSnapshotService(PlanCycleSnapshotRepository snapshotRepository,
                                    WorkoutSessionRepository workoutSessionRepository,
                                    ExerciseSetLogRepository exerciseSetLogRepository,
                                    WeightHistoryRepository weightHistoryRepository,
                                    ObjectMapper objectMapper) {
        this.snapshotRepository = snapshotRepository;
        this.workoutSessionRepository = workoutSessionRepository;
        this.exerciseSetLogRepository = exerciseSetLogRepository;
        this.weightHistoryRepository = weightHistoryRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Captura um snapshot do ciclo que está sendo encerrado.
     * Deve ser chamado ANTES de archiveActivePlans e ANTES de atualizar user.goal/weight.
     *
     * @param user       usuário dono do ciclo
     * @param cycleStart início do ciclo (createdAt do plano ativo mais antigo)
     * @param oldGoal    objetivo vigente no ciclo que está sendo encerrado
     * @param oldWeight  peso do usuário no início da regeneração
     */
    @Transactional
    public void captureSnapshot(User user, LocalDate cycleStart, String oldGoal, double oldWeight) {
        LocalDate cycleEnd = LocalDate.now();
        long dayCount = ChronoUnit.DAYS.between(cycleStart, cycleEnd);

        // Sessões completadas no ciclo
        long completedRaw = workoutSessionRepository
                .countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(
                        user.getId(), cycleStart, cycleEnd.plusDays(1));
        int completedSessions = (int) completedRaw;

        // Target com guard para divisão por zero em ciclos muito curtos
        int frequency = (user.getFrequency() != null && user.getFrequency() > 0) ? user.getFrequency() : 1;
        int weeks = Math.max(1, (int) Math.ceil(dayCount / 7.0));
        int targetSessions = Math.max(frequency, frequency * weeks);

        int adherencePct = targetSessions > 0
                ? (int) Math.min(100, Math.round(completedSessions * 100.0 / targetSessions))
                : 0;

        // Volume por grupo muscular
        Map<String, Double> volumeMap = volumeMapFromDB(user.getId(), cycleStart, cycleEnd);
        double totalVolume = volumeMap.values().stream().mapToDouble(Double::doubleValue).sum();

        String volumeJson = null;
        try {
            volumeJson = objectMapper.writeValueAsString(volumeMap);
        } catch (JsonProcessingException e) {
            log.warn("Falha ao serializar volumeByMuscle para JSON: {}", e.getMessage());
        }

        // Peso final: último registro ou fallback para oldWeight
        double endWeight = weightHistoryRepository
                .findFirstByUserOrderByLoggedAtDesc(user)
                .map(wh -> wh.getWeight())
                .orElse(oldWeight);

        PlanCycleSnapshot snapshot = new PlanCycleSnapshot();
        snapshot.setUser(user);
        snapshot.setCycleStartDate(cycleStart);
        snapshot.setCycleEndDate(cycleEnd);
        snapshot.setGoal(oldGoal);
        snapshot.setEndWeight(endWeight);
        snapshot.setTotalVolume(totalVolume);
        snapshot.setCompletedSessions(completedSessions);
        snapshot.setTargetSessions(targetSessions);
        snapshot.setAdherencePercentage(adherencePct);
        snapshot.setVolumeByMuscle(volumeJson);

        snapshotRepository.save(snapshot);
        log.info("Snapshot do ciclo [{} → {}] salvo para usuário {}", cycleStart, cycleEnd, user.getId());
    }

    private Map<String, Double> volumeMapFromDB(java.util.UUID userId, LocalDate start, LocalDate end) {
        List<Object[]> rows = exerciseSetLogRepository.findVolumeByMuscleGroupBetween(userId, start, end);
        Map<String, Double> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String muscle = (row[0] != null) ? (String) row[0] : "Outros";
            double vol = (row[1] instanceof Number n) ? n.doubleValue() : 0.0;
            map.put(muscle, vol);
        }
        return map;
    }
}
