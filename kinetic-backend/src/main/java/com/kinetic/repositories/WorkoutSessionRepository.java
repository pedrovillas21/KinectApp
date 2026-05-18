package com.kinetic.repositories;

import com.kinetic.models.WorkoutSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID> {

    long countByUserIdAndSessionDateGreaterThanEqualAndSessionDateLessThan(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate
    );

    boolean existsByUserIdAndSessionDate(UUID userId, LocalDate sessionDate);

    List<WorkoutSession> findByUserIdAndSessionDateBetween(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate
    );

    /** Contagem de sessões por usuário no intervalo — usado pelo CommunityStatsService para calcular a média global. */
    @Query("""
            SELECT ws.user.id, COUNT(ws)
            FROM WorkoutSession ws
            WHERE ws.sessionDate BETWEEN :startDate AND :endDate
            GROUP BY ws.user.id
            """)
    List<Object[]> countSessionsPerUserBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate
    );
}
