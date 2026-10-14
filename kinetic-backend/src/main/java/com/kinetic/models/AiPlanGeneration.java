package com.kinetic.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Geração de fichas por IA pedida pelo personal. Começa como prévia (PREVIEW) e só
 * vira ficha no app do aluno quando o personal aprova (APPROVED). Fica guardada como
 * registro da aprovação: pedido, resposta da IA, versão aprovada e declaração aceita.
 */
@Entity
@Table(name = "ai_plan_generations")
@Getter
@Setter
@NoArgsConstructor
public class AiPlanGeneration {

    public static final String STATUS_PREVIEW = "PREVIEW";
    public static final String STATUS_APPROVED = "APPROVED";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id")
    private User trainer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(columnDefinition = "TEXT")
    private String options;

    @Column(name = "ai_output", nullable = false, columnDefinition = "TEXT")
    private String aiOutput;

    @Column(length = 80)
    private String model;

    @Column(nullable = false, length = 20)
    private String status = STATUS_PREVIEW;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_plans", columnDefinition = "TEXT")
    private String approvedPlans;

    @Column(name = "declaration_text", columnDefinition = "TEXT")
    private String declarationText;

    @Column(name = "replaced_current")
    private Boolean replacedCurrent;
}
