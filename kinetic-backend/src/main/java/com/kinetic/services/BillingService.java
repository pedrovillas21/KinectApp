package com.kinetic.services;

import com.kinetic.billing.GatewayEvent;
import com.kinetic.billing.PaymentGateway;
import com.kinetic.dtos.BillingOverviewDTO;
import com.kinetic.enums.BillingPlan;
import com.kinetic.enums.SubscriptionStatus;
import com.kinetic.enums.TrainerLinkSource;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.exceptions.AiQuotaExceededException;
import com.kinetic.exceptions.PlanLimitExceededException;
import com.kinetic.models.TrainerSubscription;
import com.kinetic.models.User;
import com.kinetic.repositories.AiPlanGenerationRepository;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.TrainerSubscriptionRepository;
import com.kinetic.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Assinatura do personal no Kinetic: teste grátis, escolha/troca de plano,
 * cancelamento, eventos do gateway e o limite de alunos ativos por plano.
 *
 * <p>Também controla a cota de gerações de IA do personal: total único no teste
 * grátis, mensal por plano (renova com a cobrança) e uma trava diária anti-abuso.
 *
 * <p>O limite só trava a <i>entrada</i> de alunos novos (convite e aceite);
 * quem já está na carteira continua acessível mesmo com o plano vencido.
 * Personais de uma EMPRESA ficam fora da cobrança (a empresa é o cliente).
 *
 * <p>Os métodos que chamam o gateway não são @Transactional de propósito: a
 * chamada HTTP externa não deve segurar uma conexão do pool.
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    /** Alunos ativos permitidos durante o teste grátis. */
    static final int TRIAL_MAX_STUDENTS = 5;
    /** Gerações de IA no teste grátis inteiro (não renova). */
    static final int TRIAL_AI_GENERATIONS = 10;
    /** Trava anti-abuso (bug, script, uso indevido), vale para todo personal. */
    static final int AI_DAILY_CAP = 30;
    private static final DateTimeFormatter DAY_MONTH = DateTimeFormatter.ofPattern("dd/MM").withZone(
            ZoneId.of("America/Sao_Paulo"));
    private static final ZoneId BILLING_ZONE = ZoneId.of("America/Sao_Paulo");

    private final TrainerSubscriptionRepository subscriptionRepository;
    private final TrainerClientRepository trainerClientRepository;
    private final AiPlanGenerationRepository aiPlanGenerationRepository;
    private final UserRepository userRepository;
    private final PaymentGateway gateway;
    private final TrainerEventService trainerEventService;

    @Value("${billing.trial-days:14}")
    private int trialDays;

    // ── Consulta ────────────────────────────────────────────────────────────

    public BillingOverviewDTO overview(String trainerEmail) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        return toDto(getOrCreate(trainer), trainer);
    }

    // ── Plano ───────────────────────────────────────────────────────────────

    /**
     * Assina um plano, ou troca de plano quando já há uma assinatura paga. Na
     * assinatura nova a 1ª cobrança vence hoje e o personal paga pelo
     * {@code checkoutUrl}; o plano só passa a valer quando o pagamento confirma.
     */
    public BillingOverviewDTO subscribe(String trainerEmail, String planCode) {
        BillingPlan plan = parsePlan(planCode);
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        TrainerSubscription sub = getOrCreate(trainer);

        long active = countActiveStudents(trainer);
        if (active > plan.getMaxStudents()) {
            throw new IllegalArgumentException(String.format(
                    "Você tem %d alunos ativos e o plano %s permite até %d. Escolha um plano maior.",
                    active, plan.getDisplayName(), plan.getMaxStudents()));
        }

        boolean paying = (sub.getStatus() == SubscriptionStatus.ATIVA || sub.getStatus() == SubscriptionStatus.ATRASADA)
                && sub.getGatewaySubscriptionId() != null
                && gateway.name().equals(sub.getGateway());
        if (paying) {
            if (sub.getPlan() == plan) {
                throw new IllegalArgumentException("Você já está no plano " + plan.getDisplayName() + ".");
            }
            // Troca vale já; o novo valor entra nas próximas cobranças (sem proporcional por enquanto).
            gateway.updateSubscriptionPlan(sub.getGatewaySubscriptionId(), plan);
            sub.setPlan(plan);
            return toDto(save(sub), trainer);
        }

        // Assinatura nova (saindo do teste, refazendo uma pendente ou voltando após cancelar).
        if (sub.getStatus() == SubscriptionStatus.PENDENTE && sub.getGatewaySubscriptionId() != null
                && gateway.name().equals(sub.getGateway())) {
            cancelQuietly(sub.getGatewaySubscriptionId());
        }
        if (sub.getGatewayCustomerId() == null || !gateway.name().equals(sub.getGateway())) {
            sub.setGatewayCustomerId(gateway.createCustomer(trainer));
        }
        sub.setGateway(gateway.name());
        PaymentGateway.GatewaySubscription created = gateway.createSubscription(
                sub.getGatewayCustomerId(), plan, LocalDate.now(BILLING_ZONE), sub.getId().toString());

        sub.setGatewaySubscriptionId(created.id());
        sub.setCheckoutUrl(created.checkoutUrl());
        sub.setPlan(plan);
        sub.setStatus(SubscriptionStatus.PENDENTE);
        sub.setCanceledAt(null);
        return toDto(save(sub), trainer);
    }

    /**
     * Cancela a assinatura. Se nada foi pago ainda, volta ao teste grátis (que
     * pode já ter vencido); se foi, o plano vale até o fim do período pago.
     */
    public BillingOverviewDTO cancel(String trainerEmail) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        TrainerSubscription sub = getOrCreate(trainer);
        if (sub.getStatus() == SubscriptionStatus.TRIAL || sub.getStatus() == SubscriptionStatus.CANCELADA) {
            throw new IllegalArgumentException("Você não tem uma assinatura ativa para cancelar.");
        }

        if (sub.getGatewaySubscriptionId() != null && gateway.name().equals(sub.getGateway())) {
            gateway.cancelSubscription(sub.getGatewaySubscriptionId());
        }

        sub.setCheckoutUrl(null);
        if (sub.getCurrentPeriodEnd() == null) {
            sub.setStatus(SubscriptionStatus.TRIAL);
            sub.setPlan(null);
            sub.setGatewaySubscriptionId(null);
        } else {
            sub.setStatus(SubscriptionStatus.CANCELADA);
            sub.setCanceledAt(Instant.now());
        }
        return toDto(save(sub), trainer);
    }

    /** Só no modo demo: simula a confirmação do pagamento da cobrança em aberto. */
    public BillingOverviewDTO confirmDemoPayment(String trainerEmail) {
        if (!"DEMO".equals(gateway.name())) {
            throw new EntityNotFoundException("Recurso indisponível.");
        }
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        TrainerSubscription sub = getOrCreate(trainer);
        if (sub.getStatus() != SubscriptionStatus.PENDENTE || sub.getGatewaySubscriptionId() == null) {
            throw new IllegalArgumentException("Não há cobrança em aberto para pagar.");
        }
        handleEvent(new GatewayEvent("demo_" + UUID.randomUUID(), GatewayEvent.Type.PAYMENT_PAID,
                sub.getGatewaySubscriptionId(), LocalDate.now(BILLING_ZONE)));
        return toDto(subscriptionRepository.findById(sub.getId()).orElseThrow(), trainer);
    }

    // ── Eventos do gateway ──────────────────────────────────────────────────

    /** Aplica um evento do gateway (webhook ou demo). Reenvios do mesmo evento são ignorados. */
    @Transactional
    public void handleEvent(GatewayEvent event) {
        if (event.type() == GatewayEvent.Type.IGNORED || event.subscriptionId() == null) {
            return;
        }
        if (event.eventId() != null && subscriptionRepository.registerWebhookEvent(event.eventId()) == 0) {
            return;
        }
        TrainerSubscription sub = subscriptionRepository.findByGatewaySubscriptionId(event.subscriptionId())
                .orElse(null);
        if (sub == null) {
            log.warn("Evento de cobrança para assinatura desconhecida ({}); ignorado.", event.type());
            return;
        }

        switch (event.type()) {
            case PAYMENT_PAID -> {
                LocalDate base = event.dueDate() != null ? event.dueDate() : LocalDate.now(BILLING_ZONE);
                Instant paidUntil = base.plusMonths(1).atStartOfDay(BILLING_ZONE).toInstant();
                if (sub.getCurrentPeriodEnd() == null || paidUntil.isAfter(sub.getCurrentPeriodEnd())) {
                    sub.setCurrentPeriodEnd(paidUntil);
                }
                if (sub.getStatus() != SubscriptionStatus.CANCELADA) {
                    sub.setStatus(SubscriptionStatus.ATIVA);
                }
                sub.setCheckoutUrl(null);
            }
            case PAYMENT_OVERDUE -> {
                if (sub.getStatus() == SubscriptionStatus.ATIVA) {
                    sub.setStatus(SubscriptionStatus.ATRASADA);
                }
            }
            case SUBSCRIPTION_ENDED -> {
                if (sub.getStatus() != SubscriptionStatus.CANCELADA) {
                    sub.setStatus(SubscriptionStatus.CANCELADA);
                    sub.setCanceledAt(Instant.now());
                    sub.setCheckoutUrl(null);
                }
            }
            default -> { }
        }
        save(sub);
        trainerEventService.publishAfterCommit(sub.getTrainer().getId(), "billing", null);
    }

    // ── Limite de alunos ────────────────────────────────────────────────────

    /**
     * Barra a entrada de um aluno novo quando o plano do personal está cheio.
     *
     * @param studentFacing true quando quem vê o erro é o aluno (aceite/resgate de convite)
     */
    public void assertCanAddStudent(User trainer, boolean studentFacing) {
        if (trainer.getCompanyId() != null) {
            return;
        }
        Instant now = Instant.now();
        int limit = subscriptionRepository.findByTrainerId(trainer.getId())
                .map(sub -> studentLimit(sub, now))
                // Ainda sem assinatura (nunca abriu o painel de plano): está no começo do teste.
                .orElse(TRIAL_MAX_STUDENTS);
        if (countActiveStudents(trainer) < limit) {
            return;
        }
        if (studentFacing) {
            throw new PlanLimitExceededException(
                    "Seu personal atingiu o limite de alunos do plano dele. Avise-o para liberar a sua vaga.");
        }
        throw new PlanLimitExceededException(limit == 0
                ? "Seu período de teste acabou. Assine um plano para adicionar alunos."
                : "Seu plano permite até " + limit + " alunos ativos. Mude de plano para adicionar mais.");
    }

    // ── Cota de IA ──────────────────────────────────────────────────────────

    /**
     * Barra uma nova geração de prévia por IA quando a cota do personal acabou.
     * Chamado antes da chamada à IA; só gerações bem-sucedidas são gravadas e contam.
     */
    public void assertCanGenerateAi(User trainer) {
        Instant now = Instant.now();
        if (countAiSince(trainer, now.minus(Duration.ofDays(1))) >= AI_DAILY_CAP) {
            throw new AiQuotaExceededException("Você atingiu o limite de " + AI_DAILY_CAP
                    + " gerações de IA nas últimas 24 horas. Tente de novo mais tarde.");
        }

        TrainerSubscription sub = getOrCreate(trainer);
        AiAllowance allowance = aiAllowance(sub, trainer, now);
        if (allowance.limit() == null || countAiSince(trainer, allowance.periodStart()) < allowance.limit()) {
            return;
        }
        if (allowance.limit() == 0) {
            throw new AiQuotaExceededException("Seu período de teste acabou. Assine um plano para gerar fichas com IA.");
        }
        if (allowance.trial()) {
            throw new AiQuotaExceededException("Você usou as " + allowance.limit()
                    + " gerações de IA do teste grátis. Assine um plano para continuar gerando fichas.");
        }
        throw new AiQuotaExceededException("Você usou as " + allowance.limit()
                + " gerações de IA do seu plano neste período"
                + (allowance.resetsAt() != null ? ". A cota renova em " + DAY_MONTH.format(allowance.resetsAt()) : "")
                + ". Para ter mais agora, mude de plano.");
    }

    /**
     * @param limit       gerações permitidas no período; nulo = sem cota
     * @param periodStart desde quando as gerações contam
     * @param resetsAt    quando a cota renova; nulo quando é um total único (teste)
     * @param trial       cota do teste grátis (total único) e não do plano
     */
    private record AiAllowance(Integer limit, Instant periodStart, Instant resetsAt, boolean trial) {}

    private AiAllowance aiAllowance(TrainerSubscription sub, User trainer, Instant now) {
        if (trainer.getCompanyId() != null) {
            return new AiAllowance(null, now.minus(Duration.ofDays(30)), null, false);
        }
        boolean trialValid = sub.getTrialEndsAt().isAfter(now);
        boolean periodValid = sub.getCurrentPeriodEnd() != null && sub.getCurrentPeriodEnd().isAfter(now);
        Integer planAi = sub.getPlan() != null ? sub.getPlan().getAiGenerationsPerMonth() : null;
        boolean paid = planAi != null && switch (sub.getStatus()) {
            case ATIVA, ATRASADA -> true;
            case PENDENTE, CANCELADA -> periodValid;
            case TRIAL -> false;
        };

        if (paid) {
            // A cota acompanha o ciclo de cobrança: renova junto com o período pago.
            Instant start = periodValid
                    ? sub.getCurrentPeriodEnd().atZone(BILLING_ZONE).minusMonths(1).toInstant()
                    : now.minus(Duration.ofDays(30));
            return new AiAllowance(planAi, start, periodValid ? sub.getCurrentPeriodEnd() : null, false);
        }
        if (trialValid && (sub.getStatus() == SubscriptionStatus.TRIAL
                || sub.getStatus() == SubscriptionStatus.PENDENTE)) {
            return new AiAllowance(TRIAL_AI_GENERATIONS, sub.getCreatedAt(), null, true);
        }
        return new AiAllowance(0, now, null, false);
    }

    private long countAiSince(User trainer, Instant since) {
        // ai_plan_generations.created_at é gravado no fuso do servidor (LocalDateTime.now()).
        return aiPlanGenerationRepository.countByTrainerIdAndCreatedAtGreaterThanEqual(
                trainer.getId(), LocalDateTime.ofInstant(since, ZoneId.systemDefault()));
    }

    // ── Internos ────────────────────────────────────────────────────────────

    private int studentLimit(TrainerSubscription sub, Instant now) {
        boolean trialValid = sub.getTrialEndsAt().isAfter(now);
        boolean periodValid = sub.getCurrentPeriodEnd() != null && sub.getCurrentPeriodEnd().isAfter(now);
        int planMax = sub.getPlan() != null && sub.getPlan().getMaxStudents() != null
                ? sub.getPlan().getMaxStudents() : 0;
        return switch (sub.getStatus()) {
            case TRIAL -> trialValid ? TRIAL_MAX_STUDENTS : 0;
            // Escolheu o plano e falta pagar: vale o que já valia (teste ou período pago anterior).
            case PENDENTE -> Math.max(trialValid ? TRIAL_MAX_STUDENTS : 0, periodValid ? planMax : 0);
            case ATIVA, ATRASADA -> planMax;
            case CANCELADA -> periodValid ? planMax : 0;
        };
    }

    private long countActiveStudents(User trainer) {
        return trainerClientRepository.countByTrainerIdAndStatusAndSourceNot(
                trainer.getId(), TrainerLinkStatus.ATIVO, TrainerLinkSource.COMPANY);
    }

    /** Assinatura do personal; na primeira vez cria já em teste grátis. */
    private TrainerSubscription getOrCreate(User trainer) {
        return subscriptionRepository.findByTrainerId(trainer.getId()).orElseGet(() -> {
            Instant now = Instant.now();
            TrainerSubscription sub = new TrainerSubscription();
            sub.setTrainer(trainer);
            sub.setStatus(SubscriptionStatus.TRIAL);
            sub.setTrialEndsAt(now.plus(Duration.ofDays(trialDays)));
            sub.setCreatedAt(now);
            try {
                return save(sub);
            } catch (DataIntegrityViolationException e) {
                // Duas abas abrindo o painel ao mesmo tempo: a outra já criou.
                return subscriptionRepository.findByTrainerId(trainer.getId()).orElseThrow(() -> e);
            }
        });
    }

    private TrainerSubscription save(TrainerSubscription sub) {
        sub.setUpdatedAt(Instant.now());
        return subscriptionRepository.saveAndFlush(sub);
    }

    private void cancelQuietly(String gatewaySubscriptionId) {
        try {
            gateway.cancelSubscription(gatewaySubscriptionId);
        } catch (RuntimeException e) {
            log.warn("Não foi possível cancelar a assinatura pendente anterior: {}", e.getMessage());
        }
    }

    private static BillingPlan parsePlan(String code) {
        BillingPlan plan;
        try {
            plan = BillingPlan.valueOf(code.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Plano inválido.");
        }
        if (plan.isComingSoon()) {
            throw new IllegalArgumentException("O plano " + plan.getDisplayName() + " ainda não está disponível.");
        }
        return plan;
    }

    private BillingOverviewDTO toDto(TrainerSubscription sub, User trainer) {
        Instant now = Instant.now();
        int limit = studentLimit(sub, now);
        long active = countActiveStudents(trainer);
        boolean exempt = trainer.getCompanyId() != null;
        List<BillingOverviewDTO.PlanDTO> plans = Arrays.stream(BillingPlan.values())
                .map(p -> new BillingOverviewDTO.PlanDTO(
                        p.name(), p.getDisplayName(), p.getMaxStudents(), p.getPriceCents(),
                        p.getAiGenerationsPerMonth(), p.isComingSoon()))
                .toList();
        AiAllowance ai = aiAllowance(sub, trainer, now);
        return new BillingOverviewDTO(
                gateway.name(),
                sub.getStatus().name(),
                sub.getPlan() != null ? sub.getPlan().name() : null,
                sub.getPlan() != null ? sub.getPlan().getDisplayName() : null,
                limit,
                active,
                exempt || active < limit,
                sub.getTrialEndsAt(),
                sub.getCurrentPeriodEnd(),
                sub.getCanceledAt(),
                sub.getCheckoutUrl(),
                countAiSince(trainer, ai.periodStart()),
                ai.limit(),
                ai.resetsAt(),
                plans);
    }
}
