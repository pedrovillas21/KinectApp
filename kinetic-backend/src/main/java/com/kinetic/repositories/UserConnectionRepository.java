package com.kinetic.repositories;

import com.kinetic.models.UserConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserConnectionRepository extends JpaRepository<UserConnection, UUID> {

    @Query("""
        SELECT c FROM UserConnection c
        WHERE (c.requester.id = :a AND c.addressee.id = :b)
           OR (c.requester.id = :b AND c.addressee.id = :a)
        """)
    Optional<UserConnection> findPair(@Param("a") UUID a, @Param("b") UUID b);

    @Query("""
        SELECT c FROM UserConnection c
        WHERE c.status = 'ACCEPTED'
          AND (c.requester.id = :userId OR c.addressee.id = :userId)
        """)
    List<UserConnection> findAcceptedFor(@Param("userId") UUID userId);

    @Query("""
        SELECT c FROM UserConnection c
        WHERE c.status = 'PENDING'
          AND c.addressee.id = :userId
        """)
    List<UserConnection> findPendingIncomingFor(@Param("userId") UUID userId);
}
