package com.kinetic.repositories;

import com.kinetic.models.TrainerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TrainerProfileRepository extends JpaRepository<TrainerProfile, UUID> {
}
