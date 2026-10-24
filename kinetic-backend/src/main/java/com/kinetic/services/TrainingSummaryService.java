package com.kinetic.services;

import com.kinetic.utils.AppTime;

import com.kinetic.dtos.AchievementDTO;
import com.kinetic.dtos.BestSetDTO;
import com.kinetic.dtos.HomeWeekDayDTO;
import com.kinetic.dtos.PersonalRecordDTO;
import com.kinetic.dtos.WorkoutExerciseSummaryDTO;
import com.kinetic.dtos.WorkoutSummaryDTO;
import com.kinetic.models.Exercise;
import com.kinetic.models.ExerciseSetLog;
import com.kinetic.models.WorkoutSession;
import com.kinetic.repositories.ExerciseSetLogRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Números de treino de um usuário, compartilhados pela Home, pelo feed, pelo perfil
 * público e pelo "Comparar progresso". Tudo é derivado de workout_sessions e
 * exercise_set_logs — não há tabela de agregados nem de conquistas.
 *
 * <p>Convenção de semana: começa no domingo (a mesma do gráfico semanal e do ranking).
 */
@Service
@Transactional(readOnly = true)
public class TrainingSummaryService {

    /** Semanas do gráfico do perfil e do comparar. */
    public static final int WEEKS = 12;
    /** Exercícios mostrados por card de treino. */
    private static final int CARD_EXERCISES = 3;

    private final WorkoutSessionRepository workoutSessionRepository;
    private final ExerciseSetLogRepository exerciseSetLogRepository;

    public TrainingSummaryService(WorkoutSessionRepository workoutSessionRepository,
                                  ExerciseSetLogRepository exerciseSetLogRepository) {
        this.workoutSessionRepository = workoutSessionRepository;
        this.exerciseSetLogRepository = exerciseSetLogRepository;
    }

    // ── Datas ────────────────────────────────────────────────────────────────

    public static LocalDate weekStart(LocalDate day) {
        int daysFromSunday = day.getDayOfWeek() == DayOfWeek.SUNDAY ? 0 : day.getDayOfWeek().getValue();
        return day.minusDays(daysFromSunday);
    }

    /** Domingos das últimas {@link #WEEKS} semanas, a mais antiga primeiro; a última é a semana atual. */
    public List<LocalDate> lastWeekStarts() {
        LocalDate current = weekStart(AppTime.today());
        List<LocalDate> starts = new ArrayList<>(WEEKS);
        for (int i = WEEKS - 1; i >= 0; i--) {
            starts.add(current.minusWeeks(i));
        }
        return starts;
    }

    // ── Home ─────────────────────────────────────────────────────────────────

    /**
     * Dias seguidos com treino terminando hoje. Se hoje ainda não tem treino, a
     * sequência continua contando a partir de ontem.
     */
    public int streakDays(UUID userId) {
        LocalDate today = AppTime.today();
        Set<LocalDate> sessionDates = new HashSet<>(
                workoutSessionRepository.findSessionDatesByUserIdBetween(userId, today.minusDays(365), today)
        );
        int streak = 0;
        for (int i = 0; i < 366; i++) {
            LocalDate checkDate = today.minusDays(i);
            if (sessionDates.contains(checkDate)) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        return streak;
    }

    /** Maior sequência de dias seguidos com treino em todo o histórico. */
    public int bestStreakDays(UUID userId) {
        return longestRun(workoutSessionRepository.findAllSessionDatesByUserId(userId));
    }

    /** Maior série de datas consecutivas (repetidas contam uma vez). */
    static int longestRun(Collection<LocalDate> dates) {
        int longest = 0;
        int run = 0;
        LocalDate prev = null;
        for (LocalDate d : new TreeSet<>(dates)) {
            run = (prev != null && prev.plusDays(1).equals(d)) ? run + 1 : 1;
            longest = Math.max(longest, run);
            prev = d;
        }
        return longest;
    }

    /**
     * Exercícios cujo recorde de carga foi superado entre as datas (inclusivas), o mais recente
     * primeiro. Mesma regra dos cards: a primeira vez de um exercício não é recorde, nem peso corporal.
     */
    public List<PersonalRecordDTO> recordsBetween(UUID userId, LocalDate start, LocalDate end) {
        Map<String, Double> before = new HashMap<>();
        for (Object[] row : exerciseSetLogRepository.maxWeightPerExerciseBefore(userId, start)) {
            if (row[1] == null) continue;
            before.merge(normalizeExerciseName((String) row[0]), ((Number) row[1]).doubleValue(), (a, b) -> Math.max(a, b));
        }
        return personalRecords(userId).stream()
                .filter(r -> !r.date().isBefore(start) && !r.date().isAfter(end))
                .filter(r -> {
                    Double prev = before.get(normalizeExerciseName(r.exercise()));
                    return prev != null && r.weightKg() > 0 && r.weightKg() > prev;
                })
                .sorted(Comparator.comparing(PersonalRecordDTO::date).reversed())
                .toList();
    }

    /** Treinos registrados no mês corrente. */
    public long sessionsThisMonth(UUID userId) {
        LocalDate startOfMonth = AppTime.today().withDayOfMonth(1);
        return workoutSessionRepository.countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(
                userId, startOfMonth, startOfMonth.plusMonths(1));
    }

    /** Volume (reps × carga, kg) entre as datas, ambas inclusivas. */
    public double volumeBetween(UUID userId, LocalDate start, LocalDate end) {
        Double v = exerciseSetLogRepository.sumVolumeForUserBetween(userId, start, end);
        return v != null ? round1(v) : 0.0;
    }

    /** Domingo a sábado da semana atual, marcando os dias com treino e o dia de hoje. */
    public List<HomeWeekDayDTO> currentWeek(UUID userId) {
        LocalDate today = AppTime.today();
        LocalDate start = weekStart(today);
        Set<LocalDate> trained = new HashSet<>(
                workoutSessionRepository.findSessionDatesByUserIdBetween(userId, start, start.plusDays(6)));
        List<HomeWeekDayDTO> week = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            LocalDate d = start.plusDays(i);
            week.add(new HomeWeekDayDTO(d, trained.contains(d), d.equals(today)));
        }
        return week;
    }

    // ── Perfil / comparar ────────────────────────────────────────────────────

    public long totalSessions(UUID userId) {
        return workoutSessionRepository.countByUserId(userId);
    }

    /** Minutos treinados em cada semana de {@code weekStarts} (mesma ordem). */
    public List<Integer> weeklyMinutes(UUID userId, List<LocalDate> weekStarts) {
        if (weekStarts.isEmpty()) return List.of();
        LocalDate from = weekStarts.get(0);
        LocalDate to = weekStarts.get(weekStarts.size() - 1).plusDays(6);
        Map<LocalDate, Long> secondsPerWeek = new HashMap<>();
        for (WorkoutSession s : workoutSessionRepository.findByUserIdAndSessionDateBetween(userId, from, to)) {
            Integer secs = s.getDurationInSeconds();
            if (secs == null || secs <= 0) continue;
            secondsPerWeek.merge(weekStart(s.getSessionDate()), secs.longValue(), (a, b) -> a + b);
        }
        return weekStarts.stream()
                .map(w -> (int) Math.round(secondsPerWeek.getOrDefault(w, 0L) / 60.0))
                .toList();
    }

    /**
     * Recorde de cada exercício, agrupando pelo nome normalizado (cada ficha nova cria
     * um Exercise novo, então o id não serve para juntar o histórico). Ordenado pela
     * carga, maior primeiro.
     */
    public List<PersonalRecordDTO> personalRecords(UUID userId) {
        Map<String, PersonalRecordDTO> best = new HashMap<>();
        for (Object[] row : exerciseSetLogRepository.findDistinctSetsForUser(userId)) {
            String name = (String) row[0];
            double weight = ((Number) row[1]).doubleValue();
            int reps = ((Number) row[2]).intValue();
            LocalDate date = (LocalDate) row[3];
            PersonalRecordDTO candidate = new PersonalRecordDTO(displayName(name), weight, reps, date);
            best.merge(normalizeExerciseName(name), candidate, TrainingSummaryService::better);
        }
        return best.values().stream()
                .sorted(Comparator.comparingDouble((PersonalRecordDTO r) -> r.weightKg()).reversed()
                        .thenComparing(r -> r.exercise()))
                .toList();
    }

    /** Recordes indexados pelo nome normalizado — usado para cruzar dois usuários no comparar. */
    public Map<String, PersonalRecordDTO> personalRecordsByKey(UUID userId) {
        return personalRecords(userId).stream()
                .collect(Collectors.toMap(r -> normalizeExerciseName(r.exercise()), Function.identity(),
                        (a, b) -> a, LinkedHashMap::new));
    }

    /** Conquistas calculadas na hora: 1º treino, 10/50/100 treinos, sequências e volume acumulado. */
    public List<AchievementDTO> achievements(UUID userId) {
        List<LocalDate> sessionDates = workoutSessionRepository.findAllSessionDatesByUserId(userId);
        List<AchievementDTO> list = new ArrayList<>();

        list.add(countAchievement("FIRST_WORKOUT", "Primeiro treino", "Registrou o primeiro treino.", 1, sessionDates));
        list.add(countAchievement("WORKOUTS_10", "10 treinos", "Completou 10 treinos.", 10, sessionDates));
        list.add(countAchievement("WORKOUTS_50", "50 treinos", "Completou 50 treinos.", 50, sessionDates));
        list.add(countAchievement("WORKOUTS_100", "100 treinos", "Completou 100 treinos.", 100, sessionDates));

        // Sequências: maior série de dias consecutivos com treino, e o dia em que cada meta foi batida.
        TreeSet<LocalDate> days = new TreeSet<>(sessionDates);
        int longest = 0;
        int run = 0;
        LocalDate prev = null;
        LocalDate reached7 = null;
        LocalDate reached30 = null;
        for (LocalDate d : days) {
            run = (prev != null && prev.plusDays(1).equals(d)) ? run + 1 : 1;
            longest = Math.max(longest, run);
            if (run >= 7 && reached7 == null) reached7 = d;
            if (run >= 30 && reached30 == null) reached30 = d;
            prev = d;
        }
        list.add(new AchievementDTO("STREAK_7", "Semana cheia", "Treinou 7 dias seguidos.",
                reached7 != null, reached7, Math.min(longest, 7), 7));
        list.add(new AchievementDTO("STREAK_30", "Mês sem falhar", "Treinou 30 dias seguidos.",
                reached30 != null, reached30, Math.min(longest, 30), 30));

        // Volume acumulado em toneladas.
        long[] targetsKg = {10_000, 100_000, 1_000_000};
        String[] codes = {"VOLUME_10T", "VOLUME_100T", "VOLUME_1000T"};
        String[] titles = {"10 toneladas", "100 toneladas", "1.000 toneladas"};
        LocalDate[] reachedAt = new LocalDate[targetsKg.length];
        double cumulative = 0;
        for (Object[] row : exerciseSetLogRepository.sumVolumePerDayForUser(userId)) {
            cumulative += ((Number) row[1]).doubleValue();
            for (int i = 0; i < targetsKg.length; i++) {
                if (reachedAt[i] == null && cumulative >= targetsKg[i]) reachedAt[i] = (LocalDate) row[0];
            }
        }
        for (int i = 0; i < targetsKg.length; i++) {
            list.add(new AchievementDTO(codes[i], titles[i],
                    "Levantou " + titles[i] + " somando todos os treinos.",
                    reachedAt[i] != null, reachedAt[i], Math.min(Math.round(cumulative), targetsKg[i]), targetsKg[i]));
        }

        return list;
    }

    // ── Cards de treino (feed e aba "Treinos") ───────────────────────────────

    /**
     * Resumo de cada sessão (título, duração, volume, 3 primeiros exercícios com a melhor
     * série, recordes batidos). Carrega as séries de todas as sessões numa consulta só;
     * os recordes fazem uma consulta por sessão (página do feed/perfil é pequena).
     */
    public Map<UUID, WorkoutSummaryDTO> summarize(Collection<WorkoutSession> sessions) {
        if (sessions.isEmpty()) return Map.of();
        Map<UUID, WorkoutSession> byId = new LinkedHashMap<>();
        for (WorkoutSession s : sessions) byId.putIfAbsent(s.getId(), s);

        Map<UUID, List<ExerciseSetLog>> logsBySession = exerciseSetLogRepository
                .findWithExerciseBySessionIds(byId.keySet()).stream()
                .collect(Collectors.groupingBy(sl -> sl.getWorkoutSession().getId()));

        Map<UUID, WorkoutSummaryDTO> result = new HashMap<>();
        for (WorkoutSession s : byId.values()) {
            result.put(s.getId(), summarizeOne(s, logsBySession.getOrDefault(s.getId(), List.of())));
        }
        return result;
    }

    private WorkoutSummaryDTO summarizeOne(WorkoutSession session, List<ExerciseSetLog> logs) {
        // Agrupa as séries por exercício (pelo nome normalizado), na ordem da ficha.
        Map<String, List<ExerciseSetLog>> byExercise = new LinkedHashMap<>();
        Map<String, Exercise> exerciseOf = new HashMap<>();
        logs.stream()
                .sorted(Comparator
                        .comparing((ExerciseSetLog sl) -> sl.getExercise().getSortOrder(),
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(sl -> sl.getLoggedAt(), Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(sl -> sl.getSetNumber(), Comparator.nullsLast(Comparator.naturalOrder())))
                .forEach(sl -> {
                    String key = normalizeExerciseName(sl.getExercise().getName());
                    byExercise.computeIfAbsent(key, k -> new ArrayList<>()).add(sl);
                    exerciseOf.putIfAbsent(key, sl.getExercise());
                });

        double volume = 0;
        Map<String, Integer> planVotes = new HashMap<>();
        List<WorkoutExerciseSummaryDTO> exercises = new ArrayList<>();
        Map<String, Double> sessionMax = new HashMap<>();
        for (Map.Entry<String, List<ExerciseSetLog>> e : byExercise.entrySet()) {
            BestSetDTO bestSet = null;
            for (ExerciseSetLog sl : e.getValue()) {
                double w = sl.getWeightUsed() != null ? sl.getWeightUsed() : 0;
                int r = sl.getRepsPerformed() != null ? sl.getRepsPerformed() : 0;
                volume += w * r;
                if (bestSet == null || w > bestSet.weightKg() || (w == bestSet.weightKg() && r > bestSet.reps())) {
                    bestSet = new BestSetDTO(w, r);
                }
            }
            Exercise ex = exerciseOf.get(e.getKey());
            if (ex.getWorkoutPlan() != null && ex.getWorkoutPlan().getTitle() != null) {
                planVotes.merge(ex.getWorkoutPlan().getTitle(), e.getValue().size(), (a, b) -> a + b);
            }
            sessionMax.put(e.getKey(), bestSet != null ? bestSet.weightKg() : 0);
            exercises.add(new WorkoutExerciseSummaryDTO(displayName(ex.getName()), e.getValue().size(), bestSet));
        }

        String title = planVotes.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> entry.getKey())
                .orElse("Treino");

        return new WorkoutSummaryDTO(
                session.getId(),
                session.getSessionDate(),
                title,
                session.getDurationInSeconds(),
                round1(volume),
                countRecords(session, sessionMax),
                exercises.size() > CARD_EXERCISES ? List.copyOf(exercises.subList(0, CARD_EXERCISES)) : exercises,
                Math.max(0, exercises.size() - CARD_EXERCISES)
        );
    }

    /**
     * Exercícios em que a maior carga da sessão superou a melhor carga anterior do usuário.
     * A primeira vez que um exercício aparece não conta como recorde (não há o que superar),
     * nem exercício só com peso corporal.
     */
    private int countRecords(WorkoutSession session, Map<String, Double> sessionMax) {
        if (sessionMax.values().stream().noneMatch(w -> w > 0)) return 0;
        Map<String, Double> previous = new HashMap<>();
        for (Object[] row : exerciseSetLogRepository.maxWeightPerExerciseBefore(
                session.getUser().getId(), session.getSessionDate())) {
            previous.merge(normalizeExerciseName((String) row[0]), ((Number) row[1]).doubleValue(), (a, b) -> Math.max(a, b));
        }
        int records = 0;
        for (Map.Entry<String, Double> e : sessionMax.entrySet()) {
            Double before = previous.get(e.getKey());
            if (before != null && e.getValue() > 0 && e.getValue() > before) records++;
        }
        return records;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Chave de agrupamento de exercícios: sem acento, minúsculo, espaços colapsados. */
    public static String normalizeExerciseName(String name) {
        if (name == null) return "";
        String stripped = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return stripped.toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }

    private static String displayName(String name) {
        return name == null ? "" : name.trim().replaceAll("\\s+", " ");
    }

    private static PersonalRecordDTO better(PersonalRecordDTO a, PersonalRecordDTO b) {
        if (a.weightKg() != b.weightKg()) return a.weightKg() > b.weightKg() ? a : b;
        if (a.reps() != b.reps()) return a.reps() > b.reps() ? a : b;
        // Mesma série: vale a primeira vez que ela saiu.
        return a.date().isAfter(b.date()) ? b : a;
    }

    private static AchievementDTO countAchievement(String code, String title, String description,
                                                   int target, List<LocalDate> orderedDates) {
        boolean unlocked = orderedDates.size() >= target;
        return new AchievementDTO(code, title, description, unlocked,
                unlocked ? orderedDates.get(target - 1) : null,
                Math.min(orderedDates.size(), target), target);
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
