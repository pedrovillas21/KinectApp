package com.kinetic.repositories;

import com.kinetic.models.User;
import com.kinetic.models.WorkoutExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutExecutionLogRepository extends JpaRepository<WorkoutExecutionLog, UUID> {

    Optional<WorkoutExecutionLog> findFirstByUserIdOrderByCompletionDateDesc(UUID userId);

    long countByUser(User user);

    /**
     * Ultima data de conclusao por plano do usuario, em uma unica query (evita N+1).
     * Cada linha do resultado e [plano.id (UUID), MAX(completionDate)].
     */
    @Query("SELECT l.workoutPlan.id, MAX(l.completionDate) FROM WorkoutExecutionLog l " +
           "WHERE l.user.id = :userId GROUP BY l.workoutPlan.id")
    List<Object[]> findLatestCompletionPerPlan(@Param("userId") UUID userId);
}
