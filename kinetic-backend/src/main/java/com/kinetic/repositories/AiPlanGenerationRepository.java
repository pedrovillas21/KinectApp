package com.kinetic.repositories;

import com.kinetic.models.AiPlanGeneration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AiPlanGenerationRepository extends JpaRepository<AiPlanGeneration, UUID> {

    /** Prévias geradas pelo personal desde {@code start} — base da cota de IA do plano. */
    long countByTrainerIdAndCreatedAtGreaterThanEqual(UUID trainerId, LocalDateTime start);

    /** Prévia mais antiga desde {@code start} (nulo se não houver) — diz quando a trava por hora libera. */
    @Query("SELECT MIN(g.createdAt) FROM AiPlanGeneration g WHERE g.trainer.id = :trainerId AND g.createdAt >= :start")
    LocalDateTime findOldestCreatedAtSince(@Param("trainerId") UUID trainerId, @Param("start") LocalDateTime start);

    /** Prévias ainda não aprovadas e dentro da validade — caixa "Hoje" (mais recentes primeiro). */
    @Query("""
            SELECT g FROM AiPlanGeneration g JOIN FETCH g.student
            WHERE g.trainer.id = :trainerId AND g.status = 'PREVIEW' AND g.createdAt >= :since
            ORDER BY g.createdAt DESC
            """)
    List<AiPlanGeneration> findOpenPreviews(@Param("trainerId") UUID trainerId, @Param("since") LocalDateTime since);
}
