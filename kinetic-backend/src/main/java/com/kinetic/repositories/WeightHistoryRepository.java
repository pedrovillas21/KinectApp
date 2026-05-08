package com.kinetic.repositories;

import com.kinetic.models.User;
import com.kinetic.models.WeightHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeightHistoryRepository extends JpaRepository<WeightHistory, Long> {

    Optional<WeightHistory> findByUserAndLoggedAt(User user, LocalDate loggedAt);

    Optional<WeightHistory> findFirstByUserOrderByLoggedAtDesc(User user);

    List<WeightHistory> findAllByUserOrderByLoggedAtAsc(User user);

    /** Pontos de peso dentro do intervalo do período selecionado, ordenados cronologicamente. */
    List<WeightHistory> findByUserAndLoggedAtBetweenOrderByLoggedAtAsc(
            User user,
            LocalDate startDate,
            LocalDate endDate
    );
}
