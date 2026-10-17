package com.kinetic.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Código de convite de uso único gerado pelo personal para um aluno que talvez
 * ainda nem tenha conta. O código em claro só existe no link enviado ao aluno.
 */
@Entity
@Table(name = "trainer_invite_codes")
@Getter
@Setter
@NoArgsConstructor
public class TrainerInviteCode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id", nullable = false)
    private User trainer;

    // SHA-256 (hex) do código. Hash rápido basta: o código tem ~50 bits de
    // entropia aleatória, então não há dicionário para atacar.
    @Column(name = "code_hash", nullable = false, unique = true, length = 64)
    private String codeHash;

    /** Nome livre que o personal dá ao convite ("Maria – manhã") para achá-lo na lista. */
    @Column(length = 80)
    private String label;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "redeemed_by")
    private UUID redeemedBy;

    @Column(name = "redeemed_at")
    private Instant redeemedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
