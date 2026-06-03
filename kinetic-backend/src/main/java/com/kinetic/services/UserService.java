package com.kinetic.services;

import com.kinetic.dtos.UpdateWeightRequestDTO;
import com.kinetic.dtos.UserProfileResponseDTO;
import com.kinetic.models.User;
import com.kinetic.models.UserLoginStreak;
import com.kinetic.models.WeightHistory;
import com.kinetic.repositories.UserLoginStreakRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WeightHistoryRepository;
import com.kinetic.repositories.WorkoutExecutionLogRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final WeightHistoryRepository weightHistoryRepository;
    private final UserLoginStreakRepository userLoginStreakRepository;
    private final WorkoutExecutionLogRepository workoutExecutionLogRepository;

    public UserService(UserRepository userRepository,
                       WeightHistoryRepository weightHistoryRepository,
                       UserLoginStreakRepository userLoginStreakRepository,
                       WorkoutExecutionLogRepository workoutExecutionLogRepository) {
        this.userRepository = userRepository;
        this.weightHistoryRepository = weightHistoryRepository;
        this.userLoginStreakRepository = userLoginStreakRepository;
        this.workoutExecutionLogRepository = workoutExecutionLogRepository;
    }

    @Transactional
    public void updateUserWeight(String userEmail, UpdateWeightRequestDTO dto) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        user.setWeight(dto.newWeight());
        userRepository.save(user);

        LocalDate today = LocalDate.now();
        Optional<WeightHistory> existingHistory = weightHistoryRepository.findByUserAndLoggedAt(user, today);

        if (existingHistory.isPresent()) {
            WeightHistory history = existingHistory.get();
            history.setWeight(dto.newWeight());
            weightHistoryRepository.save(history);
        } else {
            WeightHistory newHistory = new WeightHistory();
            newHistory.setUser(user);
            newHistory.setWeight(dto.newWeight());
            newHistory.setLoggedAt(today);
            weightHistoryRepository.save(newHistory);
        }

    }

    public boolean needsWeightUpdate(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        return weightHistoryRepository.findFirstByUserOrderByLoggedAtDesc(user)
                .map(lastHistory -> {
                    long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(lastHistory.getLoggedAt(), LocalDate.now());
                    return daysBetween >= 30;
                })
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public UserProfileResponseDTO getUserProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        LocalDate memberSince = user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate() : null;
        int streak = calculateConsecutiveLoginStreak(user);
        int totalWorkouts = (int) workoutExecutionLogRepository.countByUser(user);

        return new UserProfileResponseDTO(
                user.getNome(),
                user.getEmail(),
                memberSince,
                streak,
                totalWorkouts,
                user.getGoal(),
                user.getBirthDate(),
                user.getWeight(),
                user.getHeight(),
                user.getLevel(),
                user.getFrequency(),
                user.getMedicalConditions()
        );
    }

    @Transactional
    public void recordDailyLogin(User user) {
        try {
            UserLoginStreak entry = new UserLoginStreak();
            entry.setUser(user);
            entry.setLoginDate(LocalDate.now());
            userLoginStreakRepository.save(entry);
        } catch (DataIntegrityViolationException ignored) {
            // concurrent insert hit unique constraint — login already recorded today
        }
    }

    private int calculateConsecutiveLoginStreak(User user) {
        LocalDate today = LocalDate.now();
        Set<LocalDate> loginDates = new HashSet<>(
                userLoginStreakRepository.findAllLoginDatesByUser(user)
        );
        int streak = 0;
        for (int i = 0; ; i++) {
            if (loginDates.contains(today.minusDays(i))) {
                streak++;
            } else if (i > 0) {
                break;
            }
            // i == 0 and today missing: keep going to allow streak from yesterday
        }
        return streak;
    }
}
