package com.kinetic.repositories;

import com.kinetic.models.EmailVerificationCode;
import com.kinetic.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, UUID> {

    Optional<EmailVerificationCode> findByUser(User user);

    // flush imediato: o insert do código novo (mesma user_id, coluna UNIQUE)
    // vem logo em seguida.
    @Modifying(flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM EmailVerificationCode c WHERE c.user = :user")
    void deleteByUser(@Param("user") User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerificationCode c WHERE c.expiresAt < :now")
    int deleteAllExpired(@Param("now") Instant now);
}
