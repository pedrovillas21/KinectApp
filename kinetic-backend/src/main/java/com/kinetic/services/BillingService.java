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
import com.kinetic.models.TrainerClient;
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
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Assinatura do personal no Kinetic: teste grátis, escolha/troca de plano,
 * cancelamento, eventos do gateway e o limite de alunos ativos por plano.
 *
 * <p>Também controla a cota de gerações de IA do personal: total único no teste
 * grátis, mensal por plano (renova com a cobrança) e uma trava diária anti-abuso.
 * Pacotes extras comprados à parte não expiram e só são gastos depois da cota.
 *
 * <p>Sem plano pago (teste encerrado, assinatura cancelada e vencida) vale o
 * plano Grátis: poucos alunos e nenhuma IA além dos pacotes extras.
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
    static final int AI_HOURLY_CAP = 20;
    /** Pacote extra de IA: gerações por compra e preço (centavos). */
    static final int AI_PACK_CREDITS = 20;
    static final int AI_PACK_PRICE_CENTS = 990;
    private static final int FREE_MAX_STUDENTS = BillingPlan.FREE.getMaxStudents();
    /** Assinatura ATIVA segue valendo esse tempo após o vencimento, enquanto a renovação compensa. */
    static final Duration RENEWAL_GRACE = Duration.ofDays(5);
    /** Dias para escolher quem fica ativo quando a carteira passa do limite do Grátis. */
    static final int CHOOSE_ACTIVE_DAYS = 7;
    /** Depois do prazo, trocar quem fica ativo só a cada N dias. */
    static final int ACTIVE_SWAP_COOLDOWN_DAYS = 30;
    private static final DateTimeFormatter DAY_MONTH = DateTimeFormatter.ofPattern("dd/MM").withZone(
            ZoneId.of("America/Sao_Paulo"));
    private static final DateTimeFormatter HOUR_MINUTE = DateTimeFormatter.ofPattern("HH:mm").withZone(
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
        if (plan.getMaxStudents() != null && active > plan.getMaxStudents()) {
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
        requireDemo();
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        TrainerSubscription sub = getOrCreate(trainer);
        if (sub.getStatus() != SubscriptionStatus.PENDENTE || sub.getGatewaySubscriptionId() == null) {
            throw new IllegalArgumentException("Não há cobrança em aberto para pagar.");
        }
        handleEvent(new GatewayEvent("demo_" + UUID.randomUUID(), GatewayEvent.Type.PAYMENT_PAID,
                sub.getGatewaySubscriptionId(), null, LocalDate.now(BILLING_ZONE)));
        return toDto(subscriptionRepository.findById(sub.getId()).orElseThrow(), trainer);
    }

    // ── Pacote extra de IA ──────────────────────────────────────────────────

    /**
     * Cria a cobrança avulsa de um pacote de IA; os créditos entram quando o
     * pagamento confirma. Com um pacote já aguardando pagamento, devolve o mesmo
     * checkout em vez de abrir outra cobrança.
     */
    public BillingOverviewDTO buyAiPack(String trainerEmail) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        if (trainer.getCompanyId() != null) {
            throw new IllegalArgumentException("Sua empresa já cobre as fichas com IA.");
        }
        TrainerSubscription sub = getOrCreate(trainer);
        boolean sameGateway = gateway.name().equals(sub.getGateway());
        if (sub.getAiPackPaymentId() != null && sameGateway) {
            return toDto(sub, trainer);
        }
        if (sub.getGatewayCustomerId() == null || !sameGateway) {
            sub.setGatewayCustomerId(gateway.createCustomer(trainer));
            sub.setGateway(gateway.name());
        }
        // shortcut: dois cliques simultâneos podem criar duas cobranças e só a última fica gravada;
        // o webhook da outra cai no log de "cobrança desconhecida". Travar a linha se isso aparecer.
        PaymentGateway.GatewayCharge charge = gateway.createCharge(sub.getGatewayCustomerId(), AI_PACK_PRICE_CENTS,
                "Kinetic – pacote extra de " + AI_PACK_CREDITS + " fichas com IA", LocalDate.now(BILLING_ZONE),
                sub.getId().toString());
        sub.setAiPackPaymentId(charge.id());
        sub.setAiPackCheckoutUrl(charge.checkoutUrl());
        return toDto(save(sub), trainer);
    }

    /** Só no modo demo: simula o pagamento do pacote de IA em aberto. */
    public BillingOverviewDTO confirmDemoAiPack(String trainerEmail) {
        requireDemo();
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        TrainerSubscription sub = getOrCreate(trainer);
        if (sub.getAiPackPaymentId() == null) {
            throw new IllegalArgumentException("Não há pacote de IA aguardando pagamento.");
        }
        handleEvent(new GatewayEvent("demo_" + UUID.randomUUID(), GatewayEvent.Type.PAYMENT_PAID,
                null, sub.getAiPackPaymentId(), LocalDate.now(BILLING_ZONE)));
        return toDto(subscriptionRepository.findById(sub.getId()).orElseThrow(), trainer);
    }

    /** Gasta 1 geração extra, depois que uma prévia que precisou dela foi gravada. */
    public void consumeAiExtraCredit(User trainer) {
        if (subscriptionRepository.consumeAiExtraCredit(trainer.getId()) == 0) {
            log.warn("Geração extra de IA sem saldo para o personal {} (gerações simultâneas).", trainer.getId());
        }
    }

    // ── Eventos do gateway ──────────────────────────────────────────────────

    /** Aplica um evento do gateway (webhook ou demo). Reenvios do mesmo evento são ignorados. */
    @Transactional
    public void handleEvent(GatewayEvent event) {
        if (event.type() == GatewayEvent.Type.IGNORED
                || (event.subscriptionId() == null && event.paymentId() == null)) {
            return;
        }
        if (event.eventId() != null && subscriptionRepository.registerWebhookEvent(event.eventId()) == 0) {
            return;
        }
        if (event.subscriptionId() == null) {
            if (event.type() == GatewayEvent.Type.PAYMENT_PAID) {
                creditAiPack(event.paymentId());
            }
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

    /** Pagamento do pacote de IA: soma os créditos. Cobrança já creditada some do registro e é ignorada. */
    private void creditAiPack(String paymentId) {
        TrainerSubscription sub = subscriptionRepository.findByAiPackPaymentId(paymentId).orElse(null);
        if (sub == null) {
            // Normal no 2º aviso da mesma cobrança (confirmado → recebido); fora isso, conferir no gateway.
            log.info("Pagamento avulso {} sem pacote de IA pendente; ignorado.", paymentId);
            return;
        }
        sub.setAiExtraCredits(sub.getAiExtraCredits() + AI_PACK_CREDITS);
        sub.setAiPackPaymentId(null);
        sub.setAiPackCheckoutUrl(null);
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
        throw new PlanLimitExceededException(
                "Seu plano permite até " + limit + " alunos ativos. Assine ou mude de plano para adicionar mais.");
    }

    // ── Cota de IA ──────────────────────────────────────────────────────────

    /**
     * Barra uma nova geração de prévia por IA quando a cota do personal acabou.
     * Chamado antes da chamada à IA; só gerações bem-sucedidas são gravadas e contam.
     *
     * @return true quando a cota acabou e a geração vai gastar um crédito extra:
     *         quem chama deve chamar {@link #consumeAiExtraCredit} depois de gravar
     */
    public boolean assertCanGenerateAi(User trainer) {
        Instant now = Instant.now();
        Instant hourAgo = now.minus(Duration.ofHours(1));
        if (countAiSince(trainer, hourAgo) >= AI_HOURLY_CAP) {
            // Libera quando a geração mais antiga da janela completa 1 hora.
            LocalDateTime oldest = aiPlanGenerationRepository.findOldestCreatedAtSince(
                    trainer.getId(), LocalDateTime.ofInstant(hourAgo, ZoneId.systemDefault()));
            String when = oldest == null ? "em alguns minutos"
                    : "às " + HOUR_MINUTE.format(oldest.atZone(ZoneId.systemDefault()).plusHours(1).toInstant());
            throw new AiQuotaExceededException("Você atingiu o limite de " + AI_HOURLY_CAP
                    + " gerações de IA por hora. Você pode gerar de novo " + when + ".");
        }

        TrainerSubscription sub = getOrCreate(trainer);
        AiAllowance allowance = aiAllowance(sub, trainer, now);
        if (allowance.limit() == null || countAiSince(trainer, allowance.periodStart()) < allowance.limit()) {
            return false;
        }
        if (trainer.getCompanyId() == null && sub.getAiExtraCredits() > 0) {
            return true;
        }
        if (allowance.free()) {
            throw new AiQuotaExceededException("Você usou as " + allowance.limit()
                    + " gerações de IA do plano Grátis neste mês. A cota renova em "
                    + DAY_MONTH.format(allowance.resetsAt()) + ". Para ter mais agora, assine um plano ou compre um pacote extra.");
        }
        if (allowance.trial()) {
            throw new AiQuotaExceededException("Você usou as " + allowance.limit()
                    + " gerações de IA do teste grátis. Assine um plano ou compre um pacote extra.");
        }
        throw new AiQuotaExceededException("Você usou as " + allowance.limit()
                + " gerações de IA do seu plano neste período"
                + (allowance.resetsAt() != null ? ". A cota renova em " + DAY_MONTH.format(allowance.resetsAt()) : "")
                + ". Para ter mais agora, compre um pacote extra ou mude de plano.");
    }

    /**
     * @param limit       gerações permitidas no período; nulo = sem cota
     * @param periodStart desde quando as gerações contam
     * @param resetsAt    quando a cota renova; nulo quando é um total único (teste)
     * @param trial       cota do teste grátis (total único) e não do plano
     * @param free        cota do plano Grátis (mês do calendário)
     */
    private record AiAllowance(Integer limit, Instant periodStart, Instant resetsAt, boolean trial, boolean free) {}

    private AiAllowance aiAllowance(TrainerSubscription sub, User trainer, Instant now) {
        if (trainer.getCompanyId() != null) {
            return new AiAllowance(null, now.minus(Duration.ofDays(30)), null, false, false);
        }
        boolean periodValid = sub.getCurrentPeriodEnd() != null && sub.getCurrentPeriodEnd().isAfter(now);
        Integer planAi = sub.getPlan() != null ? sub.getPlan().getAiGenerationsPerMonth() : null;

        if (planAi != null && planCovered(sub, now)) {
            // A cota acompanha o ciclo de cobrança: renova junto com o período pago.
            Instant start = periodValid
                    ? sub.getCurrentPeriodEnd().atZone(BILLING_ZONE).minusMonths(1).toInstant()
                    : now.minus(Duration.ofDays(30));
            return new AiAllowance(planAi, start, periodValid ? sub.getCurrentPeriodEnd() : null, false, false);
        }
        if (trialActive(sub, now)) {
            return new AiAllowance(TRIAL_AI_GENERATIONS, sub.getCreatedAt(), null, true, false);
        }
        // Grátis: cota por mês do calendário, contando só o que veio depois do teste/plano pago,
        // para as gerações do teste não comerem a cota do primeiro mês grátis.
        LocalDate thisMonth = LocalDate.now(BILLING_ZONE).withDayOfMonth(1);
        Instant start = thisMonth.atStartOfDay(BILLING_ZONE).toInstant();
        Instant freeSince = freeSince(sub);
        if (freeSince.isAfter(start)) start = freeSince;
        return new AiAllowance(BillingPlan.FREE.getAiGenerationsPerMonth(), start,
                thisMonth.plusMonths(1).atStartOfDay(BILLING_ZONE).toInstant(), false, true);
    }

    private long countAiSince(User trainer, Instant since) {
        // ai_plan_generations.created_at é gravado no fuso do servidor (LocalDateTime.now()).
        return aiPlanGenerationRepository.countByTrainerIdAndCreatedAtGreaterThanEqual(
                trainer.getId(), LocalDateTime.ofInstant(since, ZoneId.systemDefault()));
    }

    // ── Internos ────────────────────────────────────────────────────────────

    /** Alunos ativos permitidos agora; {@link Integer#MAX_VALUE} = ilimitado. */
    private int studentLimit(TrainerSubscription sub, Instant now) {
        if (sub.getPlan() != null && planCovered(sub, now)) {
            return sub.getPlan().getMaxStudents() == null ? Integer.MAX_VALUE : sub.getPlan().getMaxStudents();
        }
        return trialActive(sub, now) ? TRIAL_MAX_STUDENTS : FREE_MAX_STUDENTS;
    }

    /**
     * Até quando o plano pago vale; nulo = nunca pagou. ATIVA ganha uma folga para o
     * boleto/Pix da renovação compensar; ATRASADA e CANCELADA valem só o período pago —
     * parar de pagar sem cancelar não mantém o plano.
     */
    private static Instant planCoveredUntil(TrainerSubscription sub) {
        if (sub.getCurrentPeriodEnd() == null) {
            return null;
        }
        return sub.getStatus() == SubscriptionStatus.ATIVA
                ? sub.getCurrentPeriodEnd().plus(RENEWAL_GRACE) : sub.getCurrentPeriodEnd();
    }

    private static boolean planCovered(TrainerSubscription sub, Instant now) {
        Instant until = planCoveredUntil(sub);
        return until != null && until.isAfter(now);
    }

    /** Teste grátis valendo (escolher um plano e ainda não pagar não encerra o teste). */
    private static boolean trialActive(TrainerSubscription sub, Instant now) {
        return sub.getTrialEndsAt().isAfter(now)
                && (sub.getStatus() == SubscriptionStatus.TRIAL || sub.getStatus() == SubscriptionStatus.PENDENTE);
    }

    /** Desde quando o personal está no Grátis: fim do teste ou do plano pago, o que veio depois. */
    private static Instant freeSince(TrainerSubscription sub) {
        Instant paidUntil = planCoveredUntil(sub);
        return paidUntil != null && paidUntil.isAfter(sub.getTrialEndsAt()) ? paidUntil : sub.getTrialEndsAt();
    }

    // ── Carteira congelada ──────────────────────────────────────────────────

    /**
     * Situação da carteira no plano Grátis.
     *
     * @param chooseUntil prazo para escolher quem fica ativo (nulo fora do prazo ou dentro do limite)
     * @param frozen      alunos congelados: o personal vê o histórico, mas não edita nada
     */
    private record Portfolio(Instant chooseUntil, Set<UUID> frozen) {
        static final Portfolio OK = new Portfolio(null, Set.of());
    }

    /**
     * Sem plano pago (nem teste), quem passa do limite do Grátis fica congelado: depois
     * de {@link #CHOOSE_ACTIVE_DAYS} dias para o personal escolher, ficam ativos os
     * escolhidos e, completando o limite, os que treinaram por último. O aluno não
     * perde nada no app; só o personal deixa de prescrever/editar até assinar.
     */
    private Portfolio portfolio(TrainerSubscription sub, User trainer, Instant now) {
        if (trainer.getCompanyId() != null || planCovered(sub, now) || trialActive(sub, now)) {
            return Portfolio.OK;
        }
        List<TrainerClient> links = trainerClientRepository
                .findByTrainerAndStatusFetchStudent(trainer.getId(), TrainerLinkStatus.ATIVO).stream()
                .filter(l -> l.getSource() != TrainerLinkSource.COMPANY)
                .toList();
        if (links.size() <= FREE_MAX_STUDENTS) {
            return Portfolio.OK;
        }
        Instant chooseUntil = freeSince(sub).plus(Duration.ofDays(CHOOSE_ACTIVE_DAYS));
        if (now.isBefore(chooseUntil)) {
            return new Portfolio(chooseUntil, Set.of());
        }

        // Desempate estável (vínculo mais antigo primeiro): quem fica ativo não pode mudar sozinho de um dia
        // para o outro, senão o congelamento vira rodízio.
        List<UUID> ranked = links.stream()
                .sorted(Comparator.comparing((TrainerClient l) -> !l.isKeptOnDowngrade())
                        .thenComparing(TrainerClient::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(l -> l.getStudent().getId())
                .toList();
        return new Portfolio(null, Set.copyOf(ranked.subList(FREE_MAX_STUDENTS, ranked.size())));
    }

    /** Alunos congelados da carteira do personal (vazio quando não há excedente). */
    public Set<UUID> frozenStudentIds(User trainer) {
        return subscriptionRepository.findByTrainerId(trainer.getId())
                .map(sub -> portfolio(sub, trainer, Instant.now()).frozen())
                .orElse(Set.of());
    }

    /** Barra a edição de um aluno congelado (402, como os demais limites de plano). */
    public void assertNotFrozen(User trainer, UUID studentId) {
        if (frozenStudentIds(trainer).contains(studentId)) {
            throw new PlanLimitExceededException("Este aluno está congelado: o plano Grátis permite "
                    + FREE_MAX_STUDENTS + " alunos ativos. Assine um plano ou escolha-o como ativo em Meu plano.");
        }
    }

    /**
     * O personal escolhe quem continua ativo no plano Grátis (até o limite). Dentro do
     * prazo de escolha pode mudar à vontade; depois, só a cada {@link #ACTIVE_SWAP_COOLDOWN_DAYS}
     * dias, para a troca não virar rodízio. Assinar um plano descongela todos.
     */
    @Transactional
    public BillingOverviewDTO chooseActiveStudents(String trainerEmail, List<UUID> studentIds) {
        User trainer = userRepository.getByEmailOrThrow(trainerEmail);
        Set<UUID> chosen = Set.copyOf(studentIds);
        if (chosen.size() > FREE_MAX_STUDENTS) {
            throw new IllegalArgumentException("Escolha até " + FREE_MAX_STUDENTS + " alunos.");
        }
        TrainerSubscription sub = getOrCreate(trainer);
        Instant now = Instant.now();
        Portfolio current = portfolio(sub, trainer, now);
        boolean frozenPhase = current.chooseUntil() == null && !current.frozen().isEmpty();
        if (frozenPhase && sub.getActiveChosenAt() != null) {
            Instant nextSwap = sub.getActiveChosenAt().plus(Duration.ofDays(ACTIVE_SWAP_COOLDOWN_DAYS));
            if (now.isBefore(nextSwap)) {
                throw new IllegalArgumentException("Você poderá trocar os alunos ativos de novo em "
                        + DAY_MONTH.format(nextSwap) + ". Para editar todos agora, assine um plano.");
            }
        }
        List<TrainerClient> links = trainerClientRepository
                .findByTrainerAndStatusFetchStudent(trainer.getId(), TrainerLinkStatus.ATIVO);
        Set<UUID> own = new HashSet<>();
        for (TrainerClient l : links) {
            own.add(l.getStudent().getId());
            l.setKeptOnDowngrade(chosen.contains(l.getStudent().getId()));
        }
        if (!own.containsAll(chosen)) {
            throw new EntityNotFoundException("Aluno não encontrado.");
        }
        trainerClientRepository.saveAll(links);
        if (frozenPhase) {
            sub.setActiveChosenAt(now);
            save(sub);
        }
        trainerEventService.publishAfterCommit(trainer.getId(), "billing", null);
        return toDto(sub, trainer);
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
        if (plan == BillingPlan.FREE) {
            throw new IllegalArgumentException("O plano Grátis já vale sem assinatura.");
        }
        return plan;
    }

    private void requireDemo() {
        if (!"DEMO".equals(gateway.name())) {
            throw new EntityNotFoundException("Recurso indisponível.");
        }
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
        Portfolio portfolio = portfolio(sub, trainer, now);
        return new BillingOverviewDTO(
                gateway.name(),
                sub.getStatus().name(),
                sub.getPlan() != null ? sub.getPlan().name() : null,
                sub.getPlan() != null ? sub.getPlan().getDisplayName() : null,
                limit == Integer.MAX_VALUE ? null : limit,
                active,
                exempt || active < limit,
                sub.getTrialEndsAt(),
                sub.getCurrentPeriodEnd(),
                sub.getCanceledAt(),
                sub.getCheckoutUrl(),
                countAiSince(trainer, ai.periodStart()),
                ai.limit(),
                ai.resetsAt(),
                sub.getAiExtraCredits(),
                new BillingOverviewDTO.AiPackDTO(AI_PACK_CREDITS, AI_PACK_PRICE_CENTS),
                sub.getAiPackCheckoutUrl(),
                portfolio.chooseUntil(),
                portfolio.frozen().size(),
                plans);
    }
}
