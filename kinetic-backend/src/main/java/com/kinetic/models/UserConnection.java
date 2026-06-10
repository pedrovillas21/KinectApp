package com.kinetic.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_connections")
@Getter
@Setter
@NoArgsConstructor
public class UserConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "addressee_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User addressee;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "requester_in_squad", nullable = false)
    private Boolean requesterInSquad = true;

    @Column(name = "addressee_in_squad", nullable = false)
    private Boolean addresseeInSquad = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;
}
