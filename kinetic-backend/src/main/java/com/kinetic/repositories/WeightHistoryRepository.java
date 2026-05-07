package com.kinetic.repositories;

import com.kinetic.models.User;
import com.kinetic.models.WeightHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface WeightHistoryRepository extends JpaRepository<WeightHistory, Long> {
    Optional<WeightHistory> findByUserAndLoggedAt(User user, LocalDate loggedAt);
}
