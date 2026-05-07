package com.kinetic.services;

import com.kinetic.dtos.MonthlyStatsResponseDTO;
import com.kinetic.dtos.WorkoutSessionLogRequestDTO;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutSession;
import com.kinetic.dtos.LogSessionRequestDTO;
import com.kinetic.dtos.SetLogDto;
import com.kinetic.models.Exercise;
import com.kinetic.models.ExerciseSetLog;
import com.kinetic.repositories.ExerciseRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WorkoutSessionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class WorkoutSessionService {

    private final WorkoutSessionRepository workoutSessionRepository;
    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;

    public WorkoutSessionService(WorkoutSessionRepository workoutSessionRepository,
                                 UserRepository userRepository,
                                 ExerciseRepository exerciseRepository) {
        this.workoutSessionRepository = workoutSessionRepository;
        this.userRepository = userRepository;
        this.exerciseRepository = exerciseRepository;
    }

    @Transactional
    public void logSession(String userEmail, LogSessionRequestDTO request) {
        User user = findUserByEmail(userEmail);

        WorkoutSession session = new WorkoutSession();
        session.setUser(user);
        session.setDurationInSeconds(request.durationInSeconds());
        session.setSessionDate(request.date());

        for (SetLogDto setDto : request.exercisesLog()) {
            Exercise exercise = exerciseRepository.findById(setDto.exerciseId())
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

    private User findUserByEmail(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Usuario nao encontrado."));
    }
}
