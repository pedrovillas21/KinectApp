package com.kinetic.services;

import com.kinetic.utils.AppTime;

import com.kinetic.dtos.FinanceOverviewDTO;
import com.kinetic.dtos.FinanceOverviewDTO.ChargeDTO;
import com.kinetic.dtos.FinanceOverviewDTO.PlanDTO;
import com.kinetic.dtos.FinanceOverviewDTO.StudentRefDTO;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.StudentBillingPlan;
import com.kinetic.models.StudentCharge;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.User;
import com.kinetic.repositories.StudentBillingPlanRepository;
import com.kinetic.repositories.StudentChargeRepository;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Controle financeiro do personal: mensalidade por aluno, cobranças mensais,
 * baixa de pagamento e atrasos. O dinheiro não passa pelo Kinetic — o personal
 * recebe do aluno por fora (Pix, dinheiro…) e registra aqui.
 *
 * <p>As cobranças do mês são criadas sob demanda (ao abrir o financeiro ou a
 * caixa "Hoje"), para os alunos com mensalidade ativa e vínculo ATIVO, cobrindo
 * até 2 meses para trás caso o personal tenha ficado um tempo sem abrir o painel.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class StudentFinanceService {

    private static final Set<String> METHODS = Set.of("PIX", "DINHEIRO", "CARTAO", "TRANSFERENCIA", "OUTRO");
    /** Até quantos meses para trás a geração preenche cobranças que faltam. */
    private static final int BACKFILL_MONTHS = 2;

    private final StudentBillingPlanRepository planRepository;
    private final StudentChargeRepository chargeRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final TrainerLinkService trainerLinkService;
    private final UserRepository userRepository;

    // ── Consulta ────────────────────────────────────────────────────────────

    @Transactional
    public FinanceOverviewDTO overview(String trainerEmail, YearMonth month) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        LocalDate today = AppTime.today();
        ensureCharges(trainer, today);

        Map<UUID, TrainerClient> activeLinks = activeLinksByStudent(trainer);
        List<StudentBillingPlan> plans = planRepository.findActiveByTrainerFetchStudent(trainer.getId());
        Set<UUID> withPlan = plans.stream().map(p -> p.getStudent().getId()).collect(Collectors.toSet());

        LocalDate monthStart = month.atDay(1);
        List<StudentCharge> charges = chargeRepository.findForMonthOrOverdue(trainer.getId(), monthStart, today);

        long expected = 0, received = 0, pending = 0, overdue = 0;
        int overdueCount = 0;
        for (StudentCharge c : charges) {
            boolean inMonth = c.getReferenceMonth().equals(monthStart);
            boolean late = isOverdue(c, today);
            if (late) {
                overdue += c.getAmountCents();
                overdueCount++;
            }
            if (!inMonth || StudentCharge.CANCELADO.equals(c.getStatus())) continue;
            expected += c.getAmountCents();
            if (StudentCharge.PAGO.equals(c.getStatus())) received += c.getAmountCents();
            else if (!late) pending += c.getAmountCents();
        }

        List<ChargeDTO> chargeDtos = charges.stream()
                // Atrasadas primeiro; depois por vencimento.
                .sorted(Comparator.comparing((StudentCharge c) -> isOverdue(c, today) ? 0 : 1)
                        .thenComparing(StudentCharge::getDueDate))
                .map(c -> toDto(c, activeLinks, today))
                .toList();
        List<PlanDTO> planDtos = plans.stream()
                .sorted(Comparator.comparing(p -> p.getStudent().getNome()))
                .map(p -> new PlanDTO(p.getStudent().getId(), p.getStudent().getNome(),
                        p.getStudent().getAvatarUrl(), p.getAmountCents(), p.getDueDay()))
                .toList();
        List<StudentRefDTO> withoutPlan = activeLinks.values().stream()
                .map(TrainerClient::getStudent)
                .filter(s -> !withPlan.contains(s.getId()))
                .sorted(Comparator.comparing(User::getNome))
                .map(s -> new StudentRefDTO(s.getId(), s.getNome(), s.getAvatarUrl()))
                .toList();

        return new FinanceOverviewDTO(month.toString(), trainer.getPixKey(), expected, received, pending, overdue,
                overdueCount, chargeDtos, planDtos, withoutPlan);
    }

    /** Cobranças em aberto vencendo até {@code until} (atrasadas inclusas) — usado pela caixa "Hoje". */
    @Transactional
    public List<ChargeDTO> pendingDueUntil(User trainer, LocalDate until) {
        LocalDate today = AppTime.today();
        ensureCharges(trainer, today);
        Map<UUID, TrainerClient> activeLinks = activeLinksByStudent(trainer);
        return chargeRepository.findPendingDueUntil(trainer.getId(), until).stream()
                .map(c -> toDto(c, activeLinks, today))
                .toList();
    }

    // ── Mensalidade ─────────────────────────────────────────────────────────

    /** Cria, reativa ou altera a mensalidade do aluno (exige vínculo ATIVO). */
    @Transactional
    public void setPlan(String trainerEmail, @NonNull UUID studentId, int amountCents, int dueDay) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        User student = trainerLinkService.resolveOwnedStudent(trainerEmail, studentId);
        LocalDate currentMonth = YearMonth.now().atDay(1);

        StudentBillingPlan plan = planRepository.findByTrainerIdAndStudentId(trainer.getId(), studentId)
                .orElse(null);
        boolean wasActive = plan != null && plan.isActive();
        if (plan == null) {
            plan = new StudentBillingPlan();
            plan.setTrainer(trainer);
            plan.setStudent(student);
        }
        if (!wasActive) {
            // Nova ou reativada: começa neste mês, sem cobrar o intervalo em que ficou parada.
            plan.setActive(true);
            plan.setStartsOn(currentMonth);
        }
        plan.setAmountCents(amountCents);
        plan.setDueDay(dueDay);
        plan.setUpdatedAt(Instant.now());
        planRepository.saveAndFlush(plan);

        if (wasActive) {
            chargeRepository.repricePendingFrom(plan.getId(), currentMonth, amountCents, dueDay);
        }
        createChargesFor(plan, AppTime.today());
    }

    /** Desativa a mensalidade: o que ainda não venceu é cancelado; o atrasado continua devido. */
    @Transactional
    public void removePlan(String trainerEmail, @NonNull UUID studentId) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        StudentBillingPlan plan = planRepository.findByTrainerIdAndStudentId(trainer.getId(), studentId)
                .filter(StudentBillingPlan::isActive)
                .orElseThrow(() -> new EntityNotFoundException("Este aluno não tem mensalidade ativa."));
        plan.setActive(false);
        plan.setUpdatedAt(Instant.now());
        planRepository.save(plan);
        chargeRepository.cancelPendingNotDue(plan.getId(), AppTime.today());
    }

    // ── Cobranças ───────────────────────────────────────────────────────────

    @Transactional
    public void markPaid(String trainerEmail, @NonNull UUID chargeId, String method, LocalDate paidAt) {
        StudentCharge charge = ownedCharge(trainerEmail, chargeId);
        if (StudentCharge.CANCELADO.equals(charge.getStatus())) {
            throw new IllegalArgumentException("Esta cobrança foi dispensada. Desfaça antes de registrar o pagamento.");
        }
        String normalized = method == null ? "" : method.trim().toUpperCase(Locale.ROOT);
        if (!METHODS.contains(normalized)) {
            throw new IllegalArgumentException("Forma de pagamento inválida.");
        }
        LocalDate date = paidAt != null ? paidAt : AppTime.today();
        if (date.isAfter(AppTime.today())) {
            throw new IllegalArgumentException("A data do pagamento não pode ser no futuro.");
        }
        charge.setStatus(StudentCharge.PAGO);
        charge.setPaymentMethod(normalized);
        charge.setPaidAt(date);
        charge.setUpdatedAt(Instant.now());
        chargeRepository.save(charge);
    }

    /** Dispensa a cobrança do mês (ex.: aluno viajou, mês de cortesia). */
    @Transactional
    public void waive(String trainerEmail, @NonNull UUID chargeId) {
        StudentCharge charge = ownedCharge(trainerEmail, chargeId);
        if (!StudentCharge.PENDENTE.equals(charge.getStatus())) {
            throw new IllegalArgumentException("Só dá para dispensar uma cobrança em aberto.");
        }
        charge.setStatus(StudentCharge.CANCELADO);
        charge.setUpdatedAt(Instant.now());
        chargeRepository.save(charge);
    }

    /** Desfaz a baixa (ou a dispensa): a cobrança volta a ficar em aberto. */
    @Transactional
    public void reopen(String trainerEmail, @NonNull UUID chargeId) {
        StudentCharge charge = ownedCharge(trainerEmail, chargeId);
        charge.setStatus(StudentCharge.PENDENTE);
        charge.setPaidAt(null);
        charge.setPaymentMethod(null);
        charge.setUpdatedAt(Instant.now());
        chargeRepository.save(charge);
    }

    @Transactional
    public void updatePixKey(String trainerEmail, String pixKey) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        String trimmed = pixKey == null ? null : pixKey.trim();
        trainer.setPixKey(trimmed == null || trimmed.isEmpty() ? null : trimmed);
        userRepository.save(trainer);
    }

    // ── Internos ────────────────────────────────────────────────────────────

    /** Garante as cobranças do mês corrente (e dos 2 anteriores, se faltarem) de cada mensalidade ativa. */
    private void ensureCharges(User trainer, LocalDate today) {
        Set<UUID> activeStudents = activeLinksByStudent(trainer).keySet();
        for (StudentBillingPlan plan : planRepository.findActiveByTrainerFetchStudent(trainer.getId())) {
            if (activeStudents.contains(plan.getStudent().getId())) {
                createChargesFor(plan, today);
            }
        }
    }

    private void createChargesFor(StudentBillingPlan plan, LocalDate today) {
        YearMonth current = YearMonth.from(today);
        YearMonth start = YearMonth.from(plan.getStartsOn());
        YearMonth from = start.isAfter(current.minusMonths(BACKFILL_MONTHS)) ? start : current.minusMonths(BACKFILL_MONTHS);
        for (YearMonth m = from; !m.isAfter(current); m = m.plusMonths(1)) {
            chargeRepository.insertIfAbsent(plan.getId(), plan.getTrainer().getId(), plan.getStudent().getId(),
                    m.atDay(1), m.atDay(plan.getDueDay()), plan.getAmountCents());
        }
    }

    private Map<UUID, TrainerClient> activeLinksByStudent(User trainer) {
        return trainerClientRepository.findByTrainerAndStatusFetchStudent(trainer.getId(), TrainerLinkStatus.ATIVO)
                .stream()
                .collect(Collectors.toMap(l -> l.getStudent().getId(), Function.identity(), (a, b) -> a));
    }

    private StudentCharge ownedCharge(String trainerEmail, @NonNull UUID chargeId) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        StudentCharge charge = chargeRepository.findById(chargeId)
                .orElseThrow(() -> new EntityNotFoundException("Cobrança não encontrada."));
        if (!charge.getTrainer().getId().equals(trainer.getId())) {
            // 404 (e não 403) para não revelar cobranças de outro personal.
            throw new EntityNotFoundException("Cobrança não encontrada.");
        }
        return charge;
    }

    private static boolean isOverdue(StudentCharge c, LocalDate today) {
        return StudentCharge.PENDENTE.equals(c.getStatus()) && c.getDueDate().isBefore(today);
    }

    private static ChargeDTO toDto(StudentCharge c, Map<UUID, TrainerClient> activeLinks, LocalDate today) {
        User student = c.getStudent();
        TrainerClient link = activeLinks.get(student.getId());
        String status = isOverdue(c, today) ? "ATRASADO" : c.getStatus();
        return new ChargeDTO(c.getId(), student.getId(), student.getNome(), student.getAvatarUrl(),
                link != null ? student.getPhone() : null, link != null, c.getReferenceMonth(), c.getDueDate(),
                c.getAmountCents(), status, c.getPaidAt(), c.getPaymentMethod());
    }
}
