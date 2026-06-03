package com.kinetic.repositories;

import com.kinetic.models.User;
import com.kinetic.models.UserLoginStreak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserLoginStreakRepository extends JpaRepository<UserLoginStreak, UUID> {

    boolean existsByUserAndLoginDate(User user, LocalDate loginDate);

    @Query("SELECT s.loginDate FROM UserLoginStreak s WHERE s.user = :user AND s.loginDate >= :startDate ORDER BY s.loginDate DESC")
    List<LocalDate> findLoginDatesByUserSince(@Param("user") User user, @Param("startDate") LocalDate startDate);

    @Query("SELECT s.loginDate FROM UserLoginStreak s WHERE s.user = :user ORDER BY s.loginDate DESC")
    List<LocalDate> findAllLoginDatesByUser(@Param("user") User user);
}
