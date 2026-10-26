package com.kinetic.services;

import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PresenceService {

    private final UserRepository userRepository;

    public PresenceService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Called by the LastActiveInterceptor — gated write (max once per 60s).
     *
     * @return o id do usuário quando gravou (para o registro de acesso), senão null
     */
    @Transactional
    public UUID touch(String email) {
        return userRepository.findByEmail(email).map(user -> {
            LocalDateTime now = LocalDateTime.now();
            if (user.getLastActive() == null || user.getLastActive().isBefore(now.minusSeconds(60))) {
                user.setLastActive(now);
                userRepository.save(user);
                return user.getId();
            }
            return null;
        }).orElse(null);
    }

    @Transactional
    public UUID startSession(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuario nao encontrado."));
        UUID sessionId = UUID.randomUUID();
        user.setActiveSessionId(sessionId);
        user.setLastActive(LocalDateTime.now());
        userRepository.save(user);
        return sessionId;
    }

    @Transactional
    public void endSession(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setActiveSessionId(null);
            user.setLastActive(LocalDateTime.now());
            userRepository.save(user);
        });
    }
}
