package com.kinetic.services;

import com.kinetic.utils.SetLimits;

import com.kinetic.utils.AppTime;

import com.kinetic.dtos.MonthlyStatsResponseDTO;
import com.kinetic.exceptions.DuplicateWorkoutSessionException;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutPlan;
import com.kinetic.models.WorkoutSession;
import com.kinetic.dtos.LogSessionRequestDTO;
import com.kinetic.dtos.SetLogDto;
import com.kinetic.models.Exercise;
import com.kinetic.models.ExerciseSetLog;
import com.kinetic.repositories.ExerciseRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkoutSessionService {

    private final WorkoutSessionRepository workoutSessionRepository;
    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;
    private final PresenceService presenceService;
    private final TrainingSummaryService trainingSummaryService;

    /**
     * Peso gravado na série. Peso corporal entra como o peso atual do aluno + carga
     * extra: é aproximação, mas dá volume e progressão em vez de 0 kg. Sem carga
     * grava 0 seja o que for enviado.
     */
    static double effectiveWeight(Exercise exercise, User user, SetLogDto set) {
        double typed = set.weightUsed();
        if (!SetLimits.isPlausible(typed, set.repsPerformed())) {
            throw new IllegalArgumentException("Série de " + exercise.getName() + " com "
                    + set.repsPerformed() + " reps e " + typed + " kg está fora do possível. Confira os valores.");
        }
        return switch (exercise.effectiveLoadType()) {
            case NONE -> 0;
            case BODYWEIGHT -> (user.getWeight() != null ? user.getWeight() : 0) + typed;
            case EXTERNAL -> typed;
        };
    }

    /** Treino só conta no ranking da semana em que foi feito: aceita até 7 dias atrás. */
    static final int MAX_SESSION_AGE_DAYS = 7;

    /** Soma dos treinos de um dia (mesmo teto de um treino só). */
    static final int MAX_SECONDS_PER_DAY = 21_600;

    /**
     * O app manda a data local do aparelho; 1 dia à frente cobre fuso/relógio adiantado.
     * Fora disso a data é inventada e serviria para inflar uma semana do ranking.
     */
    static void requirePlausibleDate(LocalDate date, LocalDate today) {
        if (date.isBefore(today.minusDays(MAX_SESSION_AGE_DAYS)) || date.isAfter(today.plusDays(1))) {
            throw new IllegalArgumentException("Data do treino inválida: registre treinos de até "
                    + MAX_SESSION_AGE_DAYS + " dias atrás.");
        }
    }

    /**
     * Grava o treino executado. Idempotente por {@code clientSessionId}: reenvio do
     * mesmo treino devolve {@code false} sem gravar nada de novo.
     *
     * @return {@code true} se o treino foi criado agora, {@code false} se já existia
     */
    @Transactional
    public boolean logSession(String userEmail, LogSessionRequestDTO request) {
        User user = userRepository.getByEmailOrThrow(userEmail);

        UUID clientSessionId = request.clientSessionId();
        if (clientSessionId != null
                && workoutSessionRepository.existsByUserIdAndClientSessionId(user.getId(), clientSessionId)) {
            return false;
        }
        requirePlausibleDate(request.date(), AppTime.today());
        // O teto de 6 h vale para o dia inteiro, não para cada treino: senão várias
        // sessões seguidas inflariam o ranking da Arena.
        long dayTotal = workoutSessionRepository.sumDurationByUserIdAndSessionDate(user.getId(), request.date());
        if (dayTotal + request.durationInSeconds() > MAX_SECONDS_PER_DAY) {
            throw new IllegalArgumentException("Limite de 6 horas de treino por dia atingido.");
        }

        WorkoutSession session = new WorkoutSession();
        session.setUser(user);
        session.setDurationInSeconds(request.durationInSeconds());
        session.setSessionDate(request.date());
        session.setClientSessionId(clientSessionId);

        Map<UUID, Exercise> exercises = new HashMap<>();
        for (SetLogDto setDto : request.exercisesLog()) {
            Exercise exercise = exercises.computeIfAbsent(Objects.requireNonNull(setDto.exerciseId()), id ->
                    exerciseRepository.findById(id)
                            // Só exercícios das fichas do próprio usuário: com o id de uma ficha
                            // alheia, as séries iriam parar no histórico de outra pessoa.
                            .filter(e -> e.getWorkoutPlan() != null && e.getWorkoutPlan().getUser() != null
                                    && e.getWorkoutPlan().getUser().getId().equals(user.getId()))
                            .orElseThrow(() -> new EntityNotFoundException("Exercise not found with id: " + id)));

            ExerciseSetLog setLog = new ExerciseSetLog();
            setLog.setExercise(exercise);
            setLog.setSetNumber(setDto.setNumber());
            setLog.setRepsPerformed(setDto.repsPerformed());
            setLog.setWeightUsed(effectiveWeight(exercise, user, setDto));
            setLog.setWorkoutSession(session);

            session.getSetLogs().add(setLog);
        }

        // A ficha do treino é a dos exercícios; treino que mistura fichas fica sem ficha.
        Map<UUID, WorkoutPlan> plans = new HashMap<>();
        for (Exercise exercise : exercises.values()) {
            plans.put(exercise.getWorkoutPlan().getId(), exercise.getWorkoutPlan());
        }
        if (plans.size() == 1) {
            session.setWorkoutPlan(plans.values().iterator().next());
        }

        // Flush já aqui: se dois envios do mesmo treino passaram juntos pelo exists acima,
        // o índice único barra o segundo dentro deste try, e não no commit.
        try {
            workoutSessionRepository.saveAndFlush(session);
        } catch (DataIntegrityViolationException e) {
            String detail = e.getMostSpecificCause().getMessage();
            if (clientSessionId != null && detail != null
                    && detail.contains("uq_workout_sessions_user_client_session")) {
                throw new DuplicateWorkoutSessionException();
            }
            throw e;
        }
        presenceService.endSession(userEmail);
        return true;
    }

    /** Treinos do mês corrente contra a meta do usuário (ver {@link TrainingSummaryService#monthlyAdherence}). */
    @Transactional(readOnly = true)
    public MonthlyStatsResponseDTO getMonthlyStats(String userEmail) {
        User user = userRepository.getByEmailOrThrow(userEmail);
        return TrainingSummaryService.monthlyAdherence(
                trainingSummaryService.sessionsThisMonth(user.getId()), user.getFrequency());
    }
}
