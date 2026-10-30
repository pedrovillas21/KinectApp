package com.kinetic.models;

import com.kinetic.enums.TrainerLinkSource;
import com.kinetic.enums.TrainerLinkStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Vínculo profissional personal↔aluno. Domínio separado do UserConnection
 * (social) de propósito: cardinalidade, ciclo de vida e regras são outros.
 */
@Entity
@Table(name = "trainer_clients")
@Getter
@Setter
@NoArgsConstructor
public class TrainerClient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User trainer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainerLinkStatus status = TrainerLinkStatus.PENDENTE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainerLinkSource source = TrainerLinkSource.INVITE;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    /** Alertas de risco do aluno escondidos até esta data (inclusive); nulo = sem pausa. */
    @Column(name = "alerts_paused_until")
    private java.time.LocalDate alertsPausedUntil;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_pause_reason", length = 16)
    private com.kinetic.enums.AlertPauseReason alertPauseReason;

    @Column(name = "alert_pause_note", length = 500)
    private String alertPauseNote;

    @Column(name = "alert_paused_at")
    private LocalDateTime alertPausedAt;

    /** Dia em que o personal ignorou o lembrete "ainda não treinou hoje" deste aluno. */
    @Column(name = "daily_nudge_dismissed_on")
    private java.time.LocalDate dailyNudgeDismissedOn;

    /** Escolhido pelo personal para continuar ativo quando a carteira passa do limite do Grátis. */
    @Column(name = "kept_on_downgrade", nullable = false)
    private boolean keptOnDowngrade;
}
