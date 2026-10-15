package com.kinetic.repositories;

import com.kinetic.models.PasswordResetCode;
import com.kinetic.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, UUID> {

    Optional<PasswordResetCode> findByUser(User user);

    // flush imediato: o insert do código novo (mesma user_id, coluna UNIQUE)
    // vem logo em seguida na mesma transação.
    @Modifying(flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM PasswordResetCode c WHERE c.user = :user")
    void deleteByUser(@Param("user") User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetCode c WHERE c.expiresAt < :now")
    int deleteAllExpired(@Param("now") Instant now);
}
