package com.kinetic.services;

import lombok.RequiredArgsConstructor;
import com.kinetic.utils.AppTime;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kinetic.models.PlanCycleSnapshot;
import com.kinetic.models.User;
import com.kinetic.repositories.PlanCycleSnapshotRepository;
import com.kinetic.repositories.WeightHistoryRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanCycleSnapshotService {

    private final PlanCycleSnapshotRepository snapshotRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final WeightHistoryRepository weightHistoryRepository;
    private final TrainingSummaryService trainingSummaryService;
    private final ObjectMapper objectMapper;

    /** Números de um ciclo de treino: sessões, meta, aderência (%) e volume por grupo muscular. */
    public record CycleStats(int completedSessions, int targetSessions, int adherencePct,
                             Map<String, Double> volumeByMuscle, double totalVolume) {
    }

    /**
     * Ciclo entre {@code start} e {@code end} (inclusivos). A meta é a frequência semanal vezes as
     * semanas do ciclo (mínimo 1); sem frequência definida conta 1 treino por semana.
     */
    public CycleStats cycleStats(User user, LocalDate start, LocalDate end) {
        int completed = (int) workoutSessionRepository
                .countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(user.getId(), start, end.plusDays(1));
        int frequency = (user.getFrequency() != null && user.getFrequency() > 0) ? user.getFrequency() : 1;
        int weeks = Math.max(1, (int) Math.ceil(ChronoUnit.DAYS.between(start, end) / 7.0));
        int target = frequency * weeks;
        int adherencePct = (int) Math.min(100, Math.round(completed * 100.0 / target));
        Map<String, Double> volume = trainingSummaryService.volumeByMuscle(user.getId(), start, end);
        double totalVolume = volume.values().stream().mapToDouble(d -> d != null ? d : 0.0).sum();
        return new CycleStats(completed, target, adherencePct, volume, totalVolume);
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
        LocalDate cycleEnd = AppTime.today();
        CycleStats stats = cycleStats(user, cycleStart, cycleEnd);

        String volumeJson = null;
        try {
            volumeJson = objectMapper.writeValueAsString(stats.volumeByMuscle());
        } catch (JsonProcessingException e) {
            log.warn("Falha ao serializar volumeByMuscle para JSON: {}", e.getMessage());
        }

        // Peso final: último registro dentro do ciclo, ou fallback para oldWeight (peso do perfil
        // antes da regeneração). Limitar ao intervalo do ciclo evita poluição por registros de
        // ciclos anteriores quando o usuário tem histórico manual de longa data.
        double endWeight = weightHistoryRepository
                .findFirstByUserAndLoggedAtBetweenOrderByLoggedAtDesc(user, cycleStart, cycleEnd)
                .map(wh -> wh.getWeight())
                .orElse(oldWeight);

        PlanCycleSnapshot snapshot = new PlanCycleSnapshot();
        snapshot.setUser(user);
        snapshot.setCycleStartDate(cycleStart);
        snapshot.setCycleEndDate(cycleEnd);
        snapshot.setGoal(oldGoal);
        snapshot.setEndWeight(endWeight);
        snapshot.setTotalVolume(stats.totalVolume());
        snapshot.setCompletedSessions(stats.completedSessions());
        snapshot.setTargetSessions(stats.targetSessions());
        snapshot.setAdherencePercentage(stats.adherencePct());
        snapshot.setVolumeByMuscle(volumeJson);

        snapshotRepository.save(snapshot);
        log.info("Snapshot do ciclo [{} → {}] salvo para usuário {}", cycleStart, cycleEnd, user.getId());
    }
}
