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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private StudentBillingPlan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id", nullable = false)
    private User trainer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

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
