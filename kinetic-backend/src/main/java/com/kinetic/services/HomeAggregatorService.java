package com.kinetic.services;

import com.kinetic.dtos.HomeDashboardResponseDTO;
import com.kinetic.dtos.NextWorkoutResponseDTO;
import com.kinetic.dtos.RankingEntryDTO;
import com.kinetic.dtos.WeeklyActivityPointDTO;
import com.kinetic.models.Exercise;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutExecutionLog;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.models.WorkoutSession;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutExecutionLogRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class HomeAggregatorService {

    private static final String[] WEEK_DAYS_PT = {"Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"};

    private final UserRepository userRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutExecutionLogRepository workoutExecutionLogRepository;
    private final WorkoutSessionRepository workoutSessionRepository;

    public HomeAggregatorService(UserRepository userRepository,
                                 WorkoutPlanRepository workoutPlanRepository,
                                 WorkoutExecutionLogRepository workoutExecutionLogRepository,
                                 WorkoutSessionRepository workoutSessionRepository) {
        this.userRepository = userRepository;
        this.workoutPlanRepository = workoutPlanRepository;
        this.workoutExecutionLogRepository = workoutExecutionLogRepository;
        this.workoutSessionRepository = workoutSessionRepository;
    }

    @Transactional(readOnly = true)
    public HomeDashboardResponseDTO buildDashboardData(String userEmail) {
        User user = userRepository.getByEmailOrThrow(userEmail);

        String firstName = extractFirstName(user.getNome());
        List<WorkoutPlan> plans = workoutPlanRepository.findByUserIdAndStatusOrderByCreatedAtAsc(user.getId(), "active");
        boolean onboardingCompleted = Boolean.TRUE.equals(user.getWorkoutOnboardingCompleted()) || !plans.isEmpty();

        if (!onboardingCompleted) {
            return new HomeDashboardResponseDTO(false, firstName, 0, 0, 0, 0, null, List.of(), List.of());
        }

        NextWorkoutResponseDTO nextWorkout = buildNextWorkout(user.getId(), plans);
        int streak = calculateStreak(user.getId());
        int[] adherence = calculateAdherence(user);
        List<WeeklyActivityPointDTO> weeklyActivity = buildWeeklyActivity(user.getId());
        List<RankingEntryDTO> ranking = buildMockRanking(firstName);

        return new HomeDashboardResponseDTO(
                true,
                firstName,
                streak,
                adherence[0],
                adherence[1],
                adherence[2],
                nextWorkout,
                ranking,
                weeklyActivity
        );
    }

    private NextWorkoutResponseDTO buildNextWorkout(UUID userId, List<WorkoutPlan> plans) {
        if (plans.isEmpty()) return null;

        Optional<WorkoutExecutionLog> lastLog =
                workoutExecutionLogRepository.findFirstByUserIdOrderByCompletionDateDesc(userId);

        int nextIndex = 0;
        if (lastLog.isPresent()) {
            UUID lastPlanId = lastLog.get().getWorkoutPlan().getId();
            int lastIndex = -1;
            for (int i = 0; i < plans.size(); i++) {
                if (plans.get(i).getId().equals(lastPlanId)) {
                    lastIndex = i;
                    break;
                }
            }
            nextIndex = (lastIndex + 1) % plans.size();
        }

        return mapPlanToDTO(plans.get(nextIndex));
    }

    private NextWorkoutResponseDTO mapPlanToDTO(WorkoutPlan plan) {
        List<Exercise> exercises = plan.getExercises() != null ? plan.getExercises() : List.of();

        int totalSets = exercises.stream()
                .mapToInt(e -> e.getSets() != null ? e.getSets() : 0)
                .sum();
        int durationInMinutes = Math.max(20, (int) Math.round(totalSets * 1.2));

        LinkedHashSet<String> muscleSet = new LinkedHashSet<>();
        for (Exercise ex : exercises) {
            String muscles = ex.getMuscles();
            if (muscles != null && !muscles.isBlank()) {
                muscleSet.add(muscles.trim());
            }
        }
        List<String> muscleGroups = muscleSet.isEmpty()
                ? List.of("Corpo inteiro")
                : new ArrayList<>(muscleSet);

        String tag = plan.getTag() != null
                ? plan.getTag().toUpperCase()
                : (plan.getSubtitle() != null ? plan.getSubtitle().toUpperCase() : "TREINO");
        String name = plan.getTitle() != null ? plan.getTitle() : "Próximo treino";

        return new NextWorkoutResponseDTO(tag, name, durationInMinutes, exercises.size(), muscleGroups,
                plan.getId().toString());
    }

    private int calculateStreak(UUID userId) {
        LocalDate today = LocalDate.now();
        Set<LocalDate> sessionDates = new HashSet<>(
                workoutSessionRepository.findSessionDatesByUserIdBetween(userId, today.minusDays(365), today)
        );
        int streak = 0;
        for (int i = 0; i < 366; i++) {
            LocalDate checkDate = today.minusDays(i);
            if (sessionDates.contains(checkDate)) {
                streak++;
            } else if (i > 0) {
                // gap found after today — stop; if today has no session yet the streak still continues from yesterday
                break;
            }
        }
        return streak;
    }

    private int[] calculateAdherence(User user) {
        if (user.getFrequency() == null || user.getFrequency() <= 0) {
            return new int[]{0, 0, 0};
        }
        int targetSessions = user.getFrequency() * 4;
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate startOfNextMonth = startOfMonth.plusMonths(1);
        long completed = workoutSessionRepository
                .countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(
                        user.getId(), startOfMonth, startOfNextMonth);
        int efficiency = (int) Math.round(completed * 100.0 / targetSessions);
        return new int[]{(int) completed, targetSessions, efficiency};
    }

    private List<WeeklyActivityPointDTO> buildWeeklyActivity(UUID userId) {
        LocalDate today = LocalDate.now();
        int daysFromSunday = today.getDayOfWeek() == DayOfWeek.SUNDAY ? 0 : today.getDayOfWeek().getValue();
        LocalDate weekStart = today.minusDays(daysFromSunday);
        LocalDate weekEnd = weekStart.plusDays(6);
        String todayIso = today.toString();

        List<WorkoutSession> sessions = workoutSessionRepository
                .findByUserIdAndSessionDateBetween(userId, weekStart, weekEnd);

        Map<LocalDate, Integer> minutesByDate = new HashMap<>();
        for (WorkoutSession session : sessions) {
            Integer durationSecs = session.getDurationInSeconds();
            if (durationSecs == null || durationSecs <= 0) continue;
            int minutes = (int) Math.round(durationSecs / 60.0);
            minutesByDate.merge(session.getSessionDate(), minutes, (a, b) -> a + b);
        }

        List<WeeklyActivityPointDTO> result = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            LocalDate date = weekStart.plusDays(i);
            int minutes = minutesByDate.getOrDefault(date, 0);
            result.add(new WeeklyActivityPointDTO(WEEK_DAYS_PT[i], minutes, date.toString().equals(todayIso)));
        }
        return result;
    }

    private List<RankingEntryDTO> buildMockRanking(String currentUserName) {
        return List.of(
                new RankingEntryDTO("rk-1", 1, "Alex Sterling", 340, 12, true, false),
                new RankingEntryDTO("rk-2", 2, "Marcus Chen", 290, -5, false, false),
                new RankingEntryDTO("rk-3", 3, currentUserName, 215, 8, false, true),
                new RankingEntryDTO("rk-4", 4, "Sarah Jenkins", 180, 18, true, false)
        );
    }

    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "Atleta";
        String[] parts = fullName.trim().split("\\s+");
        return parts[0];
    }
}
