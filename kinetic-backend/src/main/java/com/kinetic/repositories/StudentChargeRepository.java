package com.kinetic.repositories;

import com.kinetic.models.StudentCharge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface StudentChargeRepository extends JpaRepository<StudentCharge, UUID> {

    /** Cria a cobrança do mês se ainda não existir (idempotente sob concorrência). */
    @Modifying
    @Query(value = """
            INSERT INTO student_charges (plan_id, trainer_id, student_id, reference_month, due_date, amount_cents)
            VALUES (:planId, :trainerId, :studentId, :month, :dueDate, :amountCents)
            ON CONFLICT (plan_id, reference_month) DO NOTHING
            """, nativeQuery = true)
    int insertIfAbsent(@Param("planId") UUID planId,
                       @Param("trainerId") UUID trainerId,
                       @Param("studentId") UUID studentId,
                       @Param("month") LocalDate month,
                       @Param("dueDate") LocalDate dueDate,
                       @Param("amountCents") int amountCents);

    /** Cobranças do mês escolhido + as atrasadas de meses anteriores (para não sumirem da tela). */
    @Query("""
            SELECT c FROM StudentCharge c JOIN FETCH c.student
            WHERE c.trainer.id = :trainerId
              AND (c.referenceMonth = :month OR (c.status = 'PENDENTE' AND c.dueDate < :today))
            ORDER BY c.dueDate, c.student.nome
            """)
    List<StudentCharge> findForMonthOrOverdue(@Param("trainerId") UUID trainerId,
                                              @Param("month") LocalDate month,
                                              @Param("today") LocalDate today);

    /** Cobranças em aberto vencendo até {@code until} (atrasadas inclusas) — caixa de entrada "Hoje". */
    @Query("""
            SELECT c FROM StudentCharge c JOIN FETCH c.student
            WHERE c.trainer.id = :trainerId AND c.status = 'PENDENTE' AND c.dueDate <= :until
            ORDER BY c.dueDate
            """)
    List<StudentCharge> findPendingDueUntil(@Param("trainerId") UUID trainerId, @Param("until") LocalDate until);

    /** Mudou valor/dia da mensalidade: ajusta as cobranças em aberto a partir do mês {@code fromMonth}. */
    @Modifying
    @Query(value = """
            UPDATE student_charges
            SET amount_cents = :amountCents,
                due_date = reference_month + (:dueDay - 1),
                updated_at = CURRENT_TIMESTAMP
            WHERE plan_id = :planId AND status = 'PENDENTE' AND reference_month >= :fromMonth
            """, nativeQuery = true)
    int repricePendingFrom(@Param("planId") UUID planId,
                           @Param("fromMonth") LocalDate fromMonth,
                           @Param("amountCents") int amountCents,
                           @Param("dueDay") int dueDay);

    /** Mensalidade desativada: cancela o que ainda não venceu (o que já venceu continua devido). */
    @Modifying
    @Query(value = """
            UPDATE student_charges
            SET status = 'CANCELADO', updated_at = CURRENT_TIMESTAMP
            WHERE plan_id = :planId AND status = 'PENDENTE' AND due_date >= :today
            """, nativeQuery = true)
    int cancelPendingNotDue(@Param("planId") UUID planId, @Param("today") LocalDate today);
}
