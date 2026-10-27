package com.kinetic.services;

import com.kinetic.billing.GatewayEvent;
import com.kinetic.billing.PaymentGateway;
import com.kinetic.enums.BillingPlan;
import com.kinetic.enums.SubscriptionStatus;
import com.kinetic.exceptions.AiQuotaExceededException;
import com.kinetic.exceptions.PlanLimitExceededException;
import com.kinetic.enums.TrainerLinkStatus;
import com.kinetic.models.TrainerClient;
import com.kinetic.models.TrainerSubscription;
import com.kinetic.models.User;
import com.kinetic.repositories.AiPlanGenerationRepository;
import com.kinetic.repositories.TrainerClientRepository;
import com.kinetic.repositories.TrainerSubscriptionRepository;
import com.kinetic.repositories.UserRepository;
import com.kinetic.security.RateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Plano Grátis como piso, Pro ilimitado e pacote extra de IA. */
class BillingServiceTest {

    private final TrainerSubscriptionRepository subs = mock(TrainerSubscriptionRepository.class);
    private final TrainerClientRepository clients = mock(TrainerClientRepository.class);
    private final AiPlanGenerationRepository generations = mock(AiPlanGenerationRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final RateLimiter rateLimiter = mock(RateLimiter.class);
    private final BillingService service = new BillingService(subs, clients, generations,
            users, mock(PaymentGateway.class), mock(TrainerEventService.class), rateLimiter);

    private final User trainer = new User();
    private final TrainerSubscription sub = new TrainerSubscription();

    @BeforeEach
    void setUp() {
        trainer.setId(UUID.randomUUID());
        sub.setId(UUID.randomUUID());
        sub.setTrainer(trainer);
        sub.setStatus(SubscriptionStatus.TRIAL);
        sub.setCreatedAt(Instant.now().minus(Duration.ofDays(30)));
        sub.setTrialEndsAt(Instant.now().minus(Duration.ofDays(16)));
        when(subs.findByTrainerId(trainer.getId())).thenReturn(Optional.of(sub));
        when(subs.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private void activeStudents(long n) {
        when(clients.countByTrainerIdAndStatusAndSourceNot(any(), any(), any())).thenReturn(n);
    }

    private void aiUsed(long n) {
        when(generations.countByTrainerIdAndCreatedAtGreaterThanEqual(any(), any())).thenReturn(n);
    }

    @Test
    void expiredTrialFallsBackToFreeTier() {
        activeStudents(BillingPlan.FREE.getMaxStudents() - 1);
        assertDoesNotThrow(() -> service.assertCanAddStudent(trainer, false));

        activeStudents(BillingPlan.FREE.getMaxStudents());
        assertThrows(PlanLimitExceededException.class, () -> service.assertCanAddStudent(trainer, false));
    }

    @Test
    void proHasNoStudentLimit() {
        sub.setStatus(SubscriptionStatus.ATIVA);
        sub.setPlan(BillingPlan.PRO);
        sub.setCurrentPeriodEnd(Instant.now().plus(Duration.ofDays(10)));
        activeStudents(5_000);
        assertDoesNotThrow(() -> service.assertCanAddStudent(trainer, false));
    }

    @Test
    void freeTierHasMonthlyAiQuotaThenExtraCredits() {
        int quota = BillingPlan.FREE.getAiGenerationsPerMonth();
        aiUsed(quota - 1);
        assertFalse(service.assertCanGenerateAi(trainer));

        aiUsed(quota);
        assertThrows(AiQuotaExceededException.class, () -> service.assertCanGenerateAi(trainer));

        sub.setAiExtraCredits(1);
        assertTrue(service.assertCanGenerateAi(trainer));
    }

    @Test
    void planQuotaIsUsedBeforeExtraCredits() {
        sub.setStatus(SubscriptionStatus.ATIVA);
        sub.setPlan(BillingPlan.BASE);
        sub.setCurrentPeriodEnd(Instant.now().plus(Duration.ofDays(10)));
        sub.setAiExtraCredits(3);

        aiUsed(BillingPlan.BASE.getAiGenerationsPerMonth() - 1);
        assertFalse(service.assertCanGenerateAi(trainer));

        aiUsed(BillingPlan.BASE.getAiGenerationsPerMonth());
        assertTrue(service.assertCanGenerateAi(trainer));
    }

    @Test
    void hourlyCapCountsAttemptsAfterTheQuotaCheck() {
        sub.setStatus(SubscriptionStatus.ATIVA);
        sub.setPlan(BillingPlan.PRO);
        sub.setCurrentPeriodEnd(Instant.now().plus(Duration.ofDays(10)));
        aiUsed(40);
        String key = "ia-personal:" + trainer.getId();
        assertDoesNotThrow(() -> service.assertCanGenerateAi(trainer));
        verify(rateLimiter).acquire(key, BillingService.AI_HOURLY_CAP, Duration.ofHours(1).toMillis());

        // Teto da hora estourado: libera daqui a 20 min, mesmo com cota do plano sobrando.
        when(rateLimiter.acquire(anyString(), anyInt(), anyLong())).thenReturn(Duration.ofMinutes(20).toMillis());
        String before = inTwentyMinutes();
        AiQuotaExceededException e = assertThrows(AiQuotaExceededException.class,
                () -> service.assertCanGenerateAi(trainer));
        String after = inTwentyMinutes();
        assertTrue(e.getMessage().endsWith("Você pode gerar de novo às " + before + ".")
                || e.getMessage().endsWith("Você pode gerar de novo às " + after + "."), e.getMessage());
    }

    /** Hora de liberação no formato da mensagem; a virada de minuto durante o teste é aceita. */
    private static String inTwentyMinutes() {
        return java.time.ZonedDateTime.now(java.time.ZoneId.of("America/Sao_Paulo")).plusMinutes(20)
                .format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"));
    }

    @Test
    void quotaBlockDoesNotSpendHourlyAttempt() {
        aiUsed(BillingPlan.FREE.getAiGenerationsPerMonth());
        assertThrows(AiQuotaExceededException.class, () -> service.assertCanGenerateAi(trainer));
        verifyNoInteractions(rateLimiter);
    }

    private List<TrainerClient> links(int n) {
        List<TrainerClient> list = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            User s = new User();
            s.setId(UUID.randomUUID());
            TrainerClient l = new TrainerClient();
            l.setStudent(s);
            l.setStatus(TrainerLinkStatus.ATIVO);
            l.setCreatedAt(LocalDateTime.now().minusDays(100 - i)); // o índice 0 é o vínculo mais antigo
            list.add(l);
        }
        when(clients.findByTrainerAndStatusFetchStudent(trainer.getId(), TrainerLinkStatus.ATIVO)).thenReturn(list);
        return list;
    }

    private static UUID id(TrainerClient l) {
        return l.getStudent().getId();
    }

    @Test
    void overFreeLimitNothingFreezesDuringTheChoiceWindow() {
        sub.setTrialEndsAt(Instant.now().minus(Duration.ofDays(2)));
        links(6);
        assertTrue(service.frozenStudentIds(trainer).isEmpty());
    }

    @Test
    void afterTheWindowKeepsChosenThenOldestAndFreezesTheRest() {
        List<TrainerClient> l = links(6);
        l.get(4).setKeptOnDowngrade(true);
        l.get(5).setKeptOnDowngrade(true);

        // Ficam: os 2 escolhidos + o vínculo mais antigo (0). Congelam: 1, 2 e 3.
        assertEquals(Set.of(id(l.get(1)), id(l.get(2)), id(l.get(3))), service.frozenStudentIds(trainer));
        assertThrows(PlanLimitExceededException.class, () -> service.assertNotFrozen(trainer, id(l.get(1))));
        assertDoesNotThrow(() -> service.assertNotFrozen(trainer, id(l.get(5))));
    }

    @Test
    void overdueSubscriptionLosesThePlanAfterThePaidPeriod() {
        sub.setStatus(SubscriptionStatus.ATRASADA);
        sub.setPlan(BillingPlan.PRO);
        sub.setCurrentPeriodEnd(Instant.now().minus(Duration.ofDays(10)));
        List<TrainerClient> l = links(5);
        activeStudents(5);

        assertThrows(PlanLimitExceededException.class, () -> service.assertCanAddStudent(trainer, false));
        assertEquals(2, service.frozenStudentIds(trainer).size());
        assertFalse(service.frozenStudentIds(trainer).contains(id(l.get(0))));
    }

    @Test
    void paidPlanFreezesNobody() {
        sub.setStatus(SubscriptionStatus.ATIVA);
        sub.setPlan(BillingPlan.PRO);
        sub.setCurrentPeriodEnd(Instant.now().minus(Duration.ofDays(1))); // dentro da folga da renovação
        links(50);
        assertTrue(service.frozenStudentIds(trainer).isEmpty());
    }

    @Test
    void swappingActiveStudentsAfterTheWindowHasACooldown() {
        List<TrainerClient> l = links(5);
        when(subs.findByTrainerId(trainer.getId())).thenReturn(Optional.of(sub));
        trainer.setEmail("p@test.local");
        when(users.getByEmailOrThrow(trainer.getEmail())).thenReturn(trainer);

        assertDoesNotThrow(() -> service.chooseActiveStudents(trainer.getEmail(), List.of(id(l.get(3)))));
        assertThrows(IllegalArgumentException.class,
                () -> service.chooseActiveStudents(trainer.getEmail(), List.of(id(l.get(4)))));
    }

    @Test
    void paidAiPackAddsCreditsOnce() {
        sub.setAiPackPaymentId("pay_1");
        sub.setAiPackCheckoutUrl("https://pay");
        when(subs.registerWebhookEvent(anyString())).thenReturn(1);
        when(subs.findByAiPackPaymentId("pay_1")).thenReturn(Optional.of(sub));

        service.handleEvent(new GatewayEvent("evt_1", GatewayEvent.Type.PAYMENT_PAID, null, "pay_1", LocalDate.now()));
        assertEquals(BillingService.AI_PACK_CREDITS, sub.getAiExtraCredits());
        assertNull(sub.getAiPackPaymentId());

        // 2º aviso da mesma cobrança (outro evento): o pacote já não está pendente.
        when(subs.findByAiPackPaymentId("pay_1")).thenReturn(Optional.empty());
        service.handleEvent(new GatewayEvent("evt_2", GatewayEvent.Type.PAYMENT_PAID, null, "pay_1", LocalDate.now()));
        assertEquals(BillingService.AI_PACK_CREDITS, sub.getAiExtraCredits());
    }
}
