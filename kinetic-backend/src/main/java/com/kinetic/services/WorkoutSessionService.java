package com.kinetic.services;

import com.kinetic.dtos.MonthlyStatsResponseDTO;
import com.kinetic.dtos.WorkoutSessionLogRequestDTO;
import com.kinetic.models.User;
import com.kinetic.models.WorkoutSession;
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

    public WorkoutSessionService(WorkoutSessionRepository workoutSessionRepository,
                                 UserRepository userRepository) {
        this.workoutSessionRepository = workoutSessionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void logSession(String userEmail, WorkoutSessionLogRequestDTO request) {
        User user = findUserByEmail(userEmail);

        WorkoutSession session = new WorkoutSession();
        session.setUser(user);
        session.setDurationInSeconds(request.durationInSeconds());
        session.setSessionDate(request.date());

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
