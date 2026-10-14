package com.kinetic.repositories;

import com.kinetic.models.AiPlanGeneration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AiPlanGenerationRepository extends JpaRepository<AiPlanGeneration, UUID> {
}
