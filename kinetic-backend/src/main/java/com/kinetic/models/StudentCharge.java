package com.kinetic.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Cobrança de um mês da mensalidade do aluno. Status gravado: PENDENTE, PAGO ou
 * CANCELADO; "atrasada" é derivado (PENDENTE com vencimento no passado).
 */
@Entity
@Table(name = "student_charges")
@Getter
@Setter
@NoArgsConstructor
public class StudentCharge {

    public static final String PENDENTE = "PENDENTE";
    public static final String PAGO = "PAGO";
    public static final String CANCELADO = "CANCELADO";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Nulo só em cobrança retida de aluno que excluiu a conta (a mensalidade foi junto). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private StudentBillingPlan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id", nullable = false)
    private User trainer;

    /** Nulo quando o aluno excluiu a conta: a cobrança paga fica como registro de renda do personal. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    /** Nome do aluno guardado na exclusão da conta dele (só em cobrança retida). */
    @Column(name = "student_name")
    private String studentName;

    /** Até quando a cobrança retida fica guardada (expurgo pelo LegalRetentionService). */
    @Column(name = "retain_until")
    private LocalDate retainUntil;

    /** Dia 1 do mês a que a cobrança se refere. */
    @Column(name = "reference_month", nullable = false)
    private LocalDate referenceMonth;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(nullable = false, length = 16)
    private String status = PENDENTE;

    @Column(name = "paid_at")
    private LocalDate paidAt;

    @Column(name = "payment_method", length = 16)
    private String paymentMethod;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
