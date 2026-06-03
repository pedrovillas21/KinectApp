package com.kinetic.repositories;

import com.kinetic.models.User;
import com.kinetic.models.WorkoutExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutExecutionLogRepository extends JpaRepository<WorkoutExecutionLog, UUID> {

    Optional<WorkoutExecutionLog> findFirstByUserIdOrderByCompletionDateDesc(UUID userId);

    long countByUser(User user);
}
