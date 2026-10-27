package com.kinetic.services;

import com.kinetic.models.User;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PresenceService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbc;

    public PresenceService(UserRepository userRepository, JdbcTemplate jdbc) {
        this.userRepository = userRepository;
        this.jdbc = jdbc;
    }

    /**
     * Called by the LastActiveInterceptor — gated write (max once per 60s).
     * Grava só last_active: carregar e salvar a linha inteira desfaria uma suspensão ou
     * troca de senha gravada por outra requisição no meio do caminho.
     *
     * @return o id do usuário quando gravou (para o registro de acesso), senão null
     */
    public UUID touch(String email) {
        LocalDateTime now = LocalDateTime.now();
        List<UUID> ids = jdbc.queryForList("""
                UPDATE users SET last_active = ?
                WHERE email = ? AND (last_active IS NULL OR last_active < ?)
                RETURNING id""", UUID.class, now, email, now.minusSeconds(60));
        return ids.isEmpty() ? null : ids.get(0);
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
