package com.kinetic.repositories;

import com.kinetic.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /** Par (userId, frequency) de todos os usuários com frequência definida — usado pelo CommunityStatsService. */
    @Query("SELECT u.id, u.frequency FROM User u WHERE u.frequency IS NOT NULL AND u.frequency > 0")
    List<Object[]> findAllUserIdAndFrequency();

    List<User> findByNomeContainingIgnoreCaseAndIdNot(String nome, UUID id);
}
