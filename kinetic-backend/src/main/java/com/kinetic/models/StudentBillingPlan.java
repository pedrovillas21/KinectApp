package com.kinetic.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Mensalidade que o personal cobra de um aluno (uma por par personal↔aluno). */
@Entity
@Table(name = "student_billing_plans")
@Getter
@Setter
@NoArgsConstructor
public class StudentBillingPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id", nullable = false)
    private User trainer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    /** Dia do vencimento (1–28, para existir em todo mês). */
    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "due_day", nullable = false)
    private int dueDay;

    @Column(nullable = false)
    private boolean active = true;

    /** Primeiro mês cobrado (dia 1); reativar a mensalidade reinicia aqui, sem cobrar o intervalo. */
    @Column(name = "starts_on", nullable = false)
    private LocalDate startsOn;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
