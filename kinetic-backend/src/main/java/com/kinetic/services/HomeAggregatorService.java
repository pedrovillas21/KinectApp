package com.kinetic.services;

import com.kinetic.enums.PresenceStatus;
import lombok.RequiredArgsConstructor;
import com.kinetic.utils.AppTime;

import com.kinetic.dtos.HomeDashboardResponseDTO;
import com.kinetic.dtos.HomeWeekDayDTO;
import com.kinetic.dtos.NextWorkoutExerciseDTO;
import com.kinetic.dtos.NextWorkoutResponseDTO;
import com.kinetic.dtos.RankingEntryDTO;
import com.kinetic.dtos.UserRefDTO;
import com.kinetic.dtos.MonthlyStatsResponseDTO;
import com.kinetic.dtos.WorkoutPlanResponseDTO;
import com.kinetic.models.Exercise;
import com.kinetic.models.User;
import com.kinetic.models.UserConnection;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.models.WorkoutSession;
import com.kinetic.repositories.UserConnectionRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutPlanRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HomeAggregatorService {

    private final UserRepository userRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final UserConnectionRepository userConnectionRepository;
    private final TrainingSummaryService trainingSummaryService;

    @Transactional(readOnly = true)
    public HomeDashboardResponseDTO buildDashboardData(String userEmail) {
        User user = userRepository.getByEmailOrThrow(userEmail);

        String firstName = extractFirstName(user.getNome());
        List<WorkoutPlan> plans = workoutPlanRepository.findByUserIdAndStatusOrderByCreatedAtAsc(user.getId(), "active");
        boolean onboardingCompleted = Boolean.TRUE.equals(user.getWorkoutOnboardingCompleted()) || !plans.isEmpty();

        // Campos novos do redesign (faixa da semana, sessões do mês, volume 7d): baratos e
        // úteis mesmo antes do onboarding, então vêm nos dois caminhos.
        LocalDate today = AppTime.today();
        long monthSessions = trainingSummaryService.sessionsThisMonth(user.getId());
        double volume7dKg = trainingSummaryService.volumeBetween(user.getId(), today.minusDays(6), today);
        List<HomeWeekDayDTO> week = trainingSummaryService.currentWeek(user.getId());

        if (!onboardingCompleted) {
            return new HomeDashboardResponseDTO(false, firstName, 0, 0, 0, 0, null, List.of(),
                    monthSessions, volume7dKg, week);
        }

        NextWorkoutResponseDTO nextWorkout = buildNextWorkout(user.getId(), plans);
        int streak = trainingSummaryService.streakDays(user.getId());
        MonthlyStatsResponseDTO adherence = TrainingSummaryService.monthlyAdherence(monthSessions, user.getFrequency());
        List<RankingEntryDTO> ranking = buildRanking(user);

        return new HomeDashboardResponseDTO(
                true,
                firstName,
                streak,
                (int) adherence.completedSessions(),
                adherence.targetSessions(),
                adherence.efficiency(),
                nextWorkout,
                ranking,
                monthSessions,
                volume7dKg,
                week
        );
    }

    private NextWorkoutResponseDTO buildNextWorkout(UUID userId, List<WorkoutPlan> plans) {
        if (plans.isEmpty()) return null;

        Optional<WorkoutSession> lastSession =
                workoutSessionRepository.findFirstByUserIdAndWorkoutPlanIsNotNullOrderByCreatedAtDesc(userId);

        int nextIndex = 0;
        if (lastSession.isPresent()) {
            UUID lastPlanId = lastSession.get().getWorkoutPlan().getId();
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

        List<NextWorkoutExerciseDTO> firstExercises = exercises.stream()
                .limit(3)
                .map(e -> new NextWorkoutExerciseDTO(e.getName(), e.getSets(), e.getReps()))
                .toList();

        return new NextWorkoutResponseDTO(tag, name, durationInMinutes, exercises.size(), muscleGroups,
                plan.getId().toString(), firstExercises, prescriberOf(plan));
    }

    /** Personal que montou a ficha pelo painel; nulo quando a ficha é do próprio aluno (IA do app). */
    private UserRefDTO prescriberOf(WorkoutPlan plan) {
        User creator = plan.getCreatedBy();
        if (creator == null || creator.getId().equals(plan.getUser().getId())) return null;
        return new UserRefDTO(creator.getId(), safeName(creator), creator.getAvatarUrl());
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
            User friend = conn.otherSide(me.getId());
            competitors.putIfAbsent(friend.getId(), friend);
        }

        // Semana começando no domingo, como no resto da Home.
        LocalDate weekStart = TrainingSummaryService.weekStart(AppTime.today());

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
                    !isMe && SocialService.presenceOf(u) != PresenceStatus.OFFLINE,
                    isMe
            ));
        }
        return trimRankingForCard(entries);
    }

    /** Corta para o tamanho do card garantindo que a linha "Você" sempre apareça (com a posição real). */
    // O "this" implícito de RankingEntryDTO::isCurrentUser não tem nulidade declarada pelo
    // Predicate<T> do JDK, gerando aviso de unchecked conversion sem risco real de NPE.
    @SuppressWarnings("null")
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

    private String safeName(User u) {
        return (u.getNome() == null || u.getNome().isBlank()) ? "Atleta" : u.getNome();
    }

    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "Atleta";
        String[] parts = fullName.trim().split("\\s+");
        return parts[0];
    }
}
