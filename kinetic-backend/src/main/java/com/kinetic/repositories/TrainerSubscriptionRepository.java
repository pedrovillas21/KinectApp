package com.kinetic.repositories;

import com.kinetic.models.TrainerSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

public interface TrainerSubscriptionRepository extends JpaRepository<TrainerSubscription, UUID> {

    Optional<TrainerSubscription> findByTrainerId(UUID trainerId);

    Optional<TrainerSubscription> findByGatewaySubscriptionId(String gatewaySubscriptionId);

    /**
     * Marca um evento de webhook como processado. Devolve 0 quando ele já tinha
     * chegado antes (reenvio do gateway), e aí o evento é ignorado.
     */
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO billing_webhook_events (event_id) VALUES (:eventId) ON CONFLICT DO NOTHING",
            nativeQuery = true)
    int registerWebhookEvent(@Param("eventId") String eventId);
}
