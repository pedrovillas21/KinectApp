package com.kinetic.services;

import com.kinetic.dtos.HomeDashboardResponseDTO;
import com.kinetic.dtos.NextWorkoutResponseDTO;
import com.kinetic.dtos.RankingEntryDTO;
import com.kinetic.dtos.WeeklyActivityPointDTO;
import com.kinetic.dtos.WorkoutPlanResponseDTO;
import com.kinetic.models.Exercise;
import com.kinetic.models.User;
import com.kinetic.models.UserConnection;
import com.kinetic.models.WorkoutExecutionLog;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.models.WorkoutSession;
import com.kinetic.repositories.UserConnectionRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutExecutionLogRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
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
    private final UserConnectionRepository userConnectionRepository;

    public HomeAggregatorService(UserRepository userRepository,
                                 WorkoutPlanRepository workoutPlanRepository,
                                 WorkoutExecutionLogRepository workoutExecutionLogRepository,
                                 WorkoutSessionRepository workoutSessionRepository,
                                 UserConnectionRepository userConnectionRepository) {
        this.userRepository = userRepository;
        this.workoutPlanRepository = workoutPlanRepository;
        this.workoutExecutionLogRepository = workoutExecutionLogRepository;
        this.workoutSessionRepository = workoutSessionRepository;
        this.userConnectionRepository = userConnectionRepository;
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
        List<RankingEntryDTO> ranking = buildRanking(user);

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
        // Prioriza a estimativa da IA; cai no heuristico (fonte unica compartilhada) quando nula.
        int durationInMinutes = plan.getEstimatedDurationMinutes() != null
                ? plan.getEstimatedDurationMinutes()
                : WorkoutPlanResponseDTO.heuristicDurationMinutes(totalSets);

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

    /** Linhas exibidas no card da Home; a lista completa fica na tela Social ("Ver tudo"). */
    private static final int RANKING_CARD_SIZE = 4;

    /**
     * Ranking da Arena: competição semanal de minutos treinados entre o usuário e as
     * conexões aceitas dele (pessoas adicionadas na tela Social). Minutos vêm da soma
     * de durationInSeconds das WorkoutSessions da semana corrente; o delta compara com
     * a semana anterior.
     */
    private List<RankingEntryDTO> buildRanking(User me) {
        Map<UUID, User> competitors = new LinkedHashMap<>();
        competitors.put(me.getId(), me);
        for (UserConnection conn : userConnectionRepository.findAcceptedFor(me.getId())) {
            User friend = conn.getRequester().getId().equals(me.getId())
                    ? conn.getAddressee()
                    : conn.getRequester();
            competitors.putIfAbsent(friend.getId(), friend);
        }

        // Mesma convenção de semana do WeeklyChart: começa no domingo.
        LocalDate today = LocalDate.now();
        int daysFromSunday = today.getDayOfWeek() == DayOfWeek.SUNDAY ? 0 : today.getDayOfWeek().getValue();
        LocalDate weekStart = today.minusDays(daysFromSunday);

        Map<UUID, Integer> currentMinutes =
                minutesPerUser(competitors.keySet(), weekStart, weekStart.plusDays(6));
        Map<UUID, Integer> previousMinutes =
                minutesPerUser(competitors.keySet(), weekStart.minusDays(7), weekStart.minusDays(1));

        List<User> ordered = competitors.values().stream()
                .sorted(Comparator
                        .comparing((User u) -> currentMinutes.getOrDefault(u.getId(), 0),
                                Comparator.reverseOrder())
                        .thenComparing(u -> u.getNome() == null ? "" : u.getNome()))
                .toList();

        List<RankingEntryDTO> entries = new ArrayList<>(ordered.size());
        for (int i = 0; i < ordered.size(); i++) {
            User u = ordered.get(i);
            boolean isMe = u.getId().equals(me.getId());
            int minutes = currentMinutes.getOrDefault(u.getId(), 0);
            entries.add(new RankingEntryDTO(
                    u.getId().toString(),
                    i + 1,
                    isMe ? extractFirstName(u.getNome()) : safeName(u),
                    minutes,
                    minutes - previousMinutes.getOrDefault(u.getId(), 0),
                    !isMe && isOnline(u),
                    isMe
            ));
        }
        return trimRankingForCard(entries);
    }

    /** Corta para o tamanho do card garantindo que a linha "Você" sempre apareça (com a posição real). */
    private List<RankingEntryDTO> trimRankingForCard(List<RankingEntryDTO> entries) {
        if (entries.size() <= RANKING_CARD_SIZE) return entries;
        List<RankingEntryDTO> top = new ArrayList<>(entries.subList(0, RANKING_CARD_SIZE));
        boolean meVisible = top.stream().anyMatch(RankingEntryDTO::isCurrentUser);
        if (!meVisible) {
            RankingEntryDTO meEntry = entries.stream()
                    .filter(RankingEntryDTO::isCurrentUser)
                    .findFirst()
                    .orElse(null);
            if (meEntry != null) {
                top.set(RANKING_CARD_SIZE - 1, meEntry);
            }
        }
        return top;
    }

    private Map<UUID, Integer> minutesPerUser(Collection<UUID> userIds, LocalDate start, LocalDate end) {
        Map<UUID, Integer> result = new HashMap<>();
        for (Object[] row : workoutSessionRepository.sumDurationSecondsPerUserBetween(userIds, start, end)) {
            long seconds = ((Number) row[1]).longValue();
            result.put((UUID) row[0], (int) Math.round(seconds / 60.0));
        }
        return result;
    }

    // Mesma regra de presença do SocialService.derivePresence: treinando (sessão ativa,
    // visto há <5 min) ou online (visto há <2 min) acendem o ponto verde do ranking.
    private boolean isOnline(User u) {
        if (u.getLastActive() == null) return false;
        LocalDateTime now = LocalDateTime.now();
        if (u.getActiveSessionId() != null && u.getLastActive().isAfter(now.minusMinutes(5))) {
            return true;
        }
        return u.getLastActive().isAfter(now.minusMinutes(2));
    }

    private String safeName(User u) {
        return (u.getNome() == null || u.getNome().isBlank()) ? "Atleta" : u.getNome();
    }

    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "Atleta";
        String[] parts = fullName.trim().split("\\s+");
        return parts[0];
    }
}
