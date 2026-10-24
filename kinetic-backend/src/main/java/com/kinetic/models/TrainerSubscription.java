package com.kinetic.models;

import com.kinetic.enums.BillingPlan;
import com.kinetic.enums.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** Assinatura do personal no Kinetic (uma por personal). */
@Entity
@Table(name = "trainer_subscriptions")
@Getter
@Setter
@NoArgsConstructor
public class TrainerSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id", nullable = false, unique = true)
    private User trainer;

    /** Plano escolhido; nulo enquanto o personal está só no teste grátis. */
    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private BillingPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SubscriptionStatus status;

    @Column(name = "trial_ends_at", nullable = false)
    private Instant trialEndsAt;

    /** Até quando o último pagamento cobre. */
    @Column(name = "current_period_end")
    private Instant currentPeriodEnd;

    @Column(name = "canceled_at")
    private Instant canceledAt;

    /** "DEMO" ou "ASAAS": de qual gateway são os ids abaixo. */
    @Column(length = 16)
    private String gateway;

    @Column(name = "gateway_customer_id", length = 64)
    private String gatewayCustomerId;

    @Column(name = "gateway_subscription_id", length = 64, unique = true)
    private String gatewaySubscriptionId;

    /** Página de pagamento da cobrança em aberto (some quando o pagamento confirma). */
    @Column(name = "checkout_url", length = 512)
    private String checkoutUrl;

    /** Gerações de IA compradas em pacote e ainda não usadas (não expiram). */
    @Column(name = "ai_extra_credits", nullable = false)
    private int aiExtraCredits;

    /** Cobrança avulsa do pacote de IA aguardando pagamento (some quando confirma). */
    @Column(name = "ai_pack_payment_id", length = 64, unique = true)
    private String aiPackPaymentId;

    @Column(name = "ai_pack_checkout_url", length = 512)
    private String aiPackCheckoutUrl;

    /** Última troca de alunos ativos com a carteira já congelada. */
    @Column(name = "active_chosen_at")
    private Instant activeChosenAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
