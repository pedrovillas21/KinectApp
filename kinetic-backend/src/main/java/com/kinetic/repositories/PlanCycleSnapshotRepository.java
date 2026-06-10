package com.kinetic.repositories;

import com.kinetic.models.PlanCycleSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanCycleSnapshotRepository extends JpaRepository<PlanCycleSnapshot, UUID> {
    Optional<PlanCycleSnapshot> findFirstByUserIdOrderByCycleEndDateDesc(UUID userId);
}
