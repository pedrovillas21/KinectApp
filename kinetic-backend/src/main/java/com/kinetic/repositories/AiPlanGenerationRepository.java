package com.kinetic.repositories;

import com.kinetic.models.AiPlanGeneration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AiPlanGenerationRepository extends JpaRepository<AiPlanGeneration, UUID> {

    /** Prévias geradas pelo personal desde {@code start} — base da cota de IA do plano. */
    long countByTrainerIdAndCreatedAtGreaterThanEqual(UUID trainerId, LocalDateTime start);
}
