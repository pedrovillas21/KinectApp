package com.kinetic.services;

import com.kinetic.dtos.MonthlyStatsResponseDTO;
import com.kinetic.dtos.WeeklyActivityDayDTO;
import com.kinetic.dtos.WeeklyActivityResponseDTO;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutExecutionLog;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.models.WorkoutSession;
import com.kinetic.dtos.LogSessionRequestDTO;
import com.kinetic.dtos.SetLogDto;
import com.kinetic.models.Exercise;
import com.kinetic.models.ExerciseSetLog;
import com.kinetic.repositories.ExerciseRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutExecutionLogRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class WorkoutSessionService {

    private final WorkoutSessionRepository workoutSessionRepository;
    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutExecutionLogRepository workoutExecutionLogRepository;
    private final PresenceService presenceService;

    public WorkoutSessionService(WorkoutSessionRepository workoutSessionRepository,
                                 UserRepository userRepository,
                                 ExerciseRepository exerciseRepository,
                                 WorkoutPlanRepository workoutPlanRepository,
                                 WorkoutExecutionLogRepository workoutExecutionLogRepository,
                                 PresenceService presenceService) {
        this.workoutSessionRepository = workoutSessionRepository;
        this.userRepository = userRepository;
        this.exerciseRepository = exerciseRepository;
        this.workoutPlanRepository = workoutPlanRepository;
        this.workoutExecutionLogRepository = workoutExecutionLogRepository;
        this.presenceService = presenceService;
    }

    @Transactional
    public void logSession(String userEmail, LogSessionRequestDTO request) {
        User user = findUserByEmail(userEmail);

        WorkoutSession session = new WorkoutSession();
        session.setUser(user);
        session.setDurationInSeconds(request.durationInSeconds());
        session.setSessionDate(request.date());

        for (SetLogDto setDto : request.exercisesLog()) {
            Exercise exercise = exerciseRepository.findById(Objects.requireNonNull(setDto.exerciseId()))
                    .orElseThrow(() -> new EntityNotFoundException("Exercise not found with id: " + setDto.exerciseId()));

            ExerciseSetLog setLog = new ExerciseSetLog();
            setLog.setExercise(exercise);
            setLog.setSetNumber(setDto.setNumber());
            setLog.setRepsPerformed(setDto.repsPerformed());
            setLog.setWeightUsed(setDto.weightUsed());
            setLog.setWorkoutSession(session);

            session.getSetLogs().add(setLog);
        }

        workoutSessionRepository.save(session);
        presenceService.endSession(userEmail);

        UUID planId = request.workoutPlanId();
        if (planId != null) {
            workoutPlanRepository.findById(planId)
                    .filter(plan -> plan.getUser().getId().equals(user.getId()))
                    .ifPresent(plan -> {
                        WorkoutExecutionLog log = new WorkoutExecutionLog();
                        log.setUser(user);
                        log.setWorkoutPlan(plan);
                        log.setCompletionDate(LocalDateTime.now());
                        log.setDurationMinutes((int) Math.round(request.durationInSeconds() / 60.0));
                        workoutExecutionLogRepository.save(log);
                    });
        }
    }

    @Transactional(readOnly = true)
    public MonthlyStatsResponseDTO getMonthlyStats(String userEmail) {
        User user = findUserByEmail(userEmail);

        if (user.getFrequency() == null || user.getFrequency() <= 0) {
            return new MonthlyStatsResponseDTO(0, 0, 0);
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

        int efficiency = (int) Math.round((completedSessions * 100.0) / targetSessions);

        return new MonthlyStatsResponseDTO(completedSessions, targetSessions, efficiency);
    }

    /**
     * Agrega o tempo treinado (em minutos) por dia da semana corrente.
     * A semana começa no Domingo para alinhar com o BarChart do FE
     * (eixo X: Dom, Seg, Ter, Qua, Qui, Sex, Sáb).
     */
    @Transactional(readOnly = true)
    public WeeklyActivityResponseDTO getWeeklyActivity(String userEmail) {
        User user = findUserByEmail(userEmail);

        LocalDate today = LocalDate.now();
        int daysFromSunday = today.getDayOfWeek() == DayOfWeek.SUNDAY
                ? 0
                : today.getDayOfWeek().getValue();
        LocalDate weekStart = today.minusDays(daysFromSunday);
        LocalDate weekEnd = weekStart.plusDays(6);

        List<WorkoutSession> sessions = workoutSessionRepository
                .findByUserIdAndSessionDateBetween(user.getId(), weekStart, weekEnd);

        Map<LocalDate, Integer> minutesByDate = new HashMap<>();
        for (WorkoutSession session : sessions) {
            Integer durationSecs = session.getDurationInSeconds();
            if (durationSecs == null || durationSecs <= 0) continue;
            int minutes = (int) Math.round(durationSecs / 60.0);
            minutesByDate.merge(session.getSessionDate(), minutes, (a, b) -> a + b);
        }

        List<WeeklyActivityDayDTO> days = new ArrayList<>(7);
        int totalMinutes = 0;
        for (int i = 0; i < 7; i++) {
            LocalDate date = weekStart.plusDays(i);
            int minutes = minutesByDate.getOrDefault(date, 0);
            totalMinutes += minutes;
            days.add(new WeeklyActivityDayDTO(date, minutes));
        }

        return new WeeklyActivityResponseDTO(weekStart, weekEnd, totalMinutes, days);
    }

    private User findUserByEmail(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Usuario nao encontrado."));
    }
}
