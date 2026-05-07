package com.kinetic.repositories;

import com.kinetic.models.WorkoutSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID> {
    long countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate
    );

    java.util.List<WorkoutSession> findByUserIdAndSessionDateBetween(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate
    );
}
