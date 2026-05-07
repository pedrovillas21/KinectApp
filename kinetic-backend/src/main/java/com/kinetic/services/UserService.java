package com.kinetic.services;

import com.kinetic.dtos.UpdateWeightRequestDTO;
import com.kinetic.models.User;
import com.kinetic.models.WeightHistory;
import com.kinetic.repositories.UserRepository;
import com.kinetic.repositories.WeightHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final WeightHistoryRepository weightHistoryRepository;

    public UserService(UserRepository userRepository, WeightHistoryRepository weightHistoryRepository) {
        this.userRepository = userRepository;
        this.weightHistoryRepository = weightHistoryRepository;
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
}
