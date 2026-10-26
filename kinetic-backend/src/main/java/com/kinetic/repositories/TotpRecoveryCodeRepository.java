package com.kinetic.repositories;

import com.kinetic.models.TotpRecoveryCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TotpRecoveryCodeRepository extends JpaRepository<TotpRecoveryCode, UUID> {

    List<TotpRecoveryCode> findByUserIdAndUsedAtIsNull(UUID userId);

    @Modifying
    @Query("DELETE FROM TotpRecoveryCode c WHERE c.user.id = :userId")
    int deleteByUserId(@Param("userId") UUID userId);
}
