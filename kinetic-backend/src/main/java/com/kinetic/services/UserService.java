package com.kinetic.services;

import com.kinetic.dtos.ChangePasswordDTO;
import com.kinetic.dtos.UpdateWeightRequestDTO;
import com.kinetic.dtos.UserProfileResponseDTO;
import com.kinetic.models.User;
import com.kinetic.models.UserLoginStreak;
import com.kinetic.models.WeightHistory;
import com.kinetic.repositories.UserLoginStreakRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WeightHistoryRepository;
import com.kinetic.repositories.WorkoutExecutionLogRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public UserService(UserRepository userRepository,
                       WeightHistoryRepository weightHistoryRepository,
                       UserLoginStreakRepository userLoginStreakRepository,
                       WorkoutExecutionLogRepository workoutExecutionLogRepository,
                       PasswordEncoder passwordEncoder,
                       RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.weightHistoryRepository = weightHistoryRepository;
        this.userLoginStreakRepository = userLoginStreakRepository;
        this.workoutExecutionLogRepository = workoutExecutionLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public void updateUserWeight(String userEmail, UpdateWeightRequestDTO dto) {
        User user = userRepository.getByEmailOrThrow(userEmail);

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

    @Transactional
    public void changePassword(String userEmail, ChangePasswordDTO dto) {
        User user = userRepository.getByEmailOrThrow(userEmail);

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getSenha())) {
            throw new IllegalArgumentException("Senha atual incorreta.");
        }
        if (passwordEncoder.matches(dto.getNewPassword(), user.getSenha())) {
            throw new IllegalArgumentException("A nova senha deve ser diferente da atual.");
        }

        user.setSenha(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        // Invalida todas as sessões (refresh tokens) após a troca: o usuário
        // precisa entrar novamente com a nova senha em todos os dispositivos.
        refreshTokenService.revokeAllForUser(user);
    }

    public boolean needsWeightUpdate(String userEmail) {
        User user = userRepository.getByEmailOrThrow(userEmail);

        return weightHistoryRepository.findFirstByUserOrderByLoggedAtDesc(user)
                .map(lastHistory -> {
                    long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(lastHistory.getLoggedAt(), LocalDate.now());
                    return daysBetween >= 30;
                })
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public UserProfileResponseDTO getUserProfile(String userEmail) {
        User user = userRepository.getByEmailOrThrow(userEmail);

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
        LocalDate today = LocalDate.now();

        // Pula o insert se o login de hoje já foi registrado. Sem esta checagem,
        // um segundo login no mesmo dia violaria a constraint única
        // (user_id, login_date) — e como o INSERT do Hibernate só vai a flush no
        // commit (fora do try/catch abaixo), a exceção derrubaria o /auth/login
        // inteiro com 500, fazendo o usuário parecer estar com a senha errada.
        if (userLoginStreakRepository.existsByUserAndLoginDate(user, today)) {
            return;
        }

        try {
            UserLoginStreak entry = new UserLoginStreak();
            entry.setUser(user);
            entry.setLoginDate(today);
            // saveAndFlush força o INSERT aqui dentro do try, para que uma corrida
            // concorrente (dois logins simultâneos do mesmo usuário) seja capturada
            // em vez de estourar no commit.
            userLoginStreakRepository.saveAndFlush(entry);
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
