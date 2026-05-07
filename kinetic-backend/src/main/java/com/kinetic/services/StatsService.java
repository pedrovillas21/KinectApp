package com.kinetic.services;

import com.kinetic.dtos.StatsSummaryResponseDTO;
import com.kinetic.dtos.VolumeByMuscleGroupDTO;
import com.kinetic.dtos.WeightPointDTO;
import com.kinetic.models.ExerciseSetLog;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutSession;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WeightHistoryRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StatsService {

    private final WorkoutSessionRepository workoutSessionRepository;
    private final UserRepository userRepository;
    private final WeightHistoryRepository weightHistoryRepository;
    private final UserService userService;

    public StatsService(WorkoutSessionRepository workoutSessionRepository,
                        UserRepository userRepository,
                        WeightHistoryRepository weightHistoryRepository,
                        UserService userService) {
        this.workoutSessionRepository = workoutSessionRepository;
        this.userRepository = userRepository;
        this.weightHistoryRepository = weightHistoryRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public StatsSummaryResponseDTO getSummary(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Boolean needsWeightUpdate = userService.needsWeightUpdate(userEmail);

        int efficiencyPercentage = calculateEfficiency(user);
        List<VolumeByMuscleGroupDTO> volumeList = calculateCurrentWeekVolume(user);
        List<WeightPointDTO> weightHistory = getWeightHistory(user);

        return new StatsSummaryResponseDTO(needsWeightUpdate, efficiencyPercentage, volumeList, weightHistory);
    }

    private int calculateEfficiency(User user) {
        if (user.getFrequency() == null || user.getFrequency() <= 0) {
            return 0;
        }

        int targetSessions = user.getFrequency() * 4;
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate startOfNextMonth = startOfMonth.plusMonths(1);
        long completedSessions = workoutSessionRepository
                .countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(
                        user.getId(),
                        startOfMonth,
                        startOfNextMonth
                );

        return (int) Math.round((completedSessions * 100.0) / targetSessions);
    }

    private List<VolumeByMuscleGroupDTO> calculateCurrentWeekVolume(User user) {
        LocalDate startOfWeek = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = startOfWeek.plusDays(6);

        List<WorkoutSession> sessions = workoutSessionRepository.findByUserIdAndSessionDateBetween(
                user.getId(), startOfWeek, endOfWeek);

        Map<String, Double> volumeMap = new HashMap<>();

        for (WorkoutSession session : sessions) {
            for (ExerciseSetLog log : session.getSetLogs()) {
                String muscle = log.getExercise().getMuscles();
                if (muscle == null || muscle.isEmpty()) {
                    muscle = "Outros";
                }
                
                double volume = log.getRepsPerformed() * log.getWeightUsed();
                volumeMap.put(muscle, volumeMap.getOrDefault(muscle, 0.0) + volume);
            }
        }

        return volumeMap.entrySet().stream()
                .map(entry -> new VolumeByMuscleGroupDTO(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    private List<WeightPointDTO> getWeightHistory(User user) {
        return weightHistoryRepository.findAllByUserOrderByLoggedAtAsc(user).stream()
                .map(h -> new WeightPointDTO(h.getLoggedAt(), h.getWeight()))
                .collect(Collectors.toList());
    }
}
