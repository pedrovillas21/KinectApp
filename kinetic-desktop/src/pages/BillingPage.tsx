import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Check, CreditCard, FlaskConical, Sparkles, Wand2 } from 'lucide-react';
import {
  billingErrorMessage,
  cancelSubscription,
  daysUntil,
  formatBRL,
  formatDate,
  getBilling,
  subscribePlan,
} from '../services/billingService';
import ConfirmDialog from '../components/personal/ConfirmDialog';
import { EASE_OUT, riseItem, staggerContainer } from '../components/motion/primitives';
import type { BillingOverview, BillingPlanOption } from '../types';

/** Abre a página de pagamento: rota do painel (demo) ou página do gateway em nova aba. */
function openCheckout(url: string, navigate: (to: string) => void) {
  if (url.startsWith('/')) navigate(url);
  else window.open(url, '_blank', 'noopener,noreferrer');
}

export default function BillingPage() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const load = () => {
    setLoadError(false);
    getBilling()
      .then(setBilling)
      .catch(() => setLoadError(true));
  };

  useEffect(load, []);

  const paying = billing?.status === 'ATIVA' || billing?.status === 'ATRASADA';

  const handleChoose = async (plan: BillingPlanOption) => {
    if (busyPlan) return;
    setBusyPlan(plan.code);
    try {
      const next = await subscribePlan(plan.code);
      setBilling(next);
      if (paying) {
        toast.success(`Plano alterado para ${plan.name}`, {
          description: 'O novo valor entra nas próximas cobranças.',
        });
      } else if (next.checkoutUrl) {
        openCheckout(next.checkoutUrl, navigate);
      }
    } catch (err) {
      toast.error(billingErrorMessage(err, 'Não foi possível escolher o plano. Tente novamente.'));
    } finally {
      setBusyPlan(null);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      setBilling(await cancelSubscription());
      toast.success('Assinatura cancelada');
      setCancelOpen(false);
    } catch (err) {
      toast.error(billingErrorMessage(err, 'Não foi possível cancelar. Tente novamente.'));
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-k-bg text-k-text">
      <header className="z-30 flex shrink-0 items-center gap-3.5 border-b border-k-ghost bg-k-bg/85 px-8 py-3.5 backdrop-blur-[14px]">
        <Link
          to="/students"
          aria-label="Voltar para alunos"
          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
        >
          <ArrowLeft className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-x-0.5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight font-stretch-semi-expanded">Meu plano</h1>
          <p className="text-[12.5px] text-k-text-muted">Assinatura do Kinetic e limite de alunos</p>
        </div>
        {billing?.gatewayMode === 'DEMO' && (
          <span className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-k-warn/10 px-3 text-[12.5px] font-semibold text-k-warn">
            <FlaskConical className="h-3.5 w-3.5" />
            Modo demonstração · nenhuma cobrança real
          </span>
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-8 pb-16 pt-10">
          {loadError ? (
            <div className="rounded-[18px] border border-dashed border-white/[0.14] p-10 text-center">
              <p className="text-k-text-dim">Não foi possível carregar seu plano.</p>
              <button
                type="button"
                onClick={load}
                className="mt-4 h-10 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold hover:bg-k-surface2"
              >
                Tentar de novo
              </button>
            </div>
          ) : !billing ? (
            <div role="status" aria-label="Carregando plano" className="k-skeleton h-40 rounded-[18px] bg-k-surface1" />
          ) : (
            <>
              <StatusCard
                billing={billing}
                onPay={() => billing.checkoutUrl && openCheckout(billing.checkoutUrl, navigate)}
                onCancel={() => setCancelOpen(true)}
              />

              <section aria-label="Planos" className="flex flex-col gap-4">
                <h2 className="font-display text-[22px] font-extrabold tracking-tight font-stretch-semi-expanded">
                  Planos
                </h2>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4"
                >
                  {billing.plans.map((plan) => (
                    <PlanCard
                      key={plan.code}
                      plan={plan}
                      billing={billing}
                      paying={paying}
                      busy={busyPlan === plan.code}
                      disabled={!!busyPlan}
                      onChoose={() => void handleChoose(plan)}
                    />
                  ))}
                </motion.div>
                <p className="text-[12.5px] text-k-text-muted">
                  Contam no plano os alunos com vínculo ativo. Pagamento mensal por Pix, boleto ou cartão.
                </p>
              </section>
            </>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar assinatura?"
        description={
          billing?.currentPeriodEnd
            ? `Não haverá novas cobranças. Seu plano continua valendo até ${formatDate(billing.currentPeriodEnd)}; depois disso você não poderá adicionar alunos novos (os atuais continuam na sua carteira).`
            : 'A cobrança em aberto será cancelada e você volta ao teste grátis.'
        }
        confirmLabel={canceling ? 'Cancelando…' : 'Cancelar assinatura'}
        destructive
        busy={canceling}
        onConfirm={() => void handleCancel()}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}

function StatusCard({
  billing,
  onPay,
  onCancel,
}: {
  billing: BillingOverview;
  onPay: () => void;
  onCancel: () => void;
}) {
  const trialDays = daysUntil(billing.trialEndsAt);
  const usage = billing.studentLimit > 0 ? Math.min(100, (billing.activeStudents / billing.studentLimit) * 100) : 100;

  let title: string;
  let detail: string;
  let tone: 'primary' | 'warn' | 'alert' = 'primary';
  switch (billing.status) {
    case 'TRIAL':
      title = trialDays > 0 ? 'Teste grátis' : 'Teste grátis encerrado';
      detail =
        trialDays > 0
          ? `Termina em ${trialDays} ${trialDays === 1 ? 'dia' : 'dias'} (${formatDate(billing.trialEndsAt)}). Até 5 alunos e 10 gerações de IA.`
          : 'Assine um plano para continuar adicionando alunos.';
      tone = trialDays > 0 ? 'primary' : 'alert';
      break;
    case 'PENDENTE':
      title = `Plano ${billing.planName} aguardando pagamento`;
      detail = 'O plano passa a valer assim que o pagamento for confirmado.';
      tone = 'warn';
      break;
    case 'ATIVA':
      title = `Plano ${billing.planName}`;
      detail = billing.currentPeriodEnd ? `Próxima cobrança em ${formatDate(billing.currentPeriodEnd)}.` : 'Assinatura ativa.';
      break;
    case 'ATRASADA':
      title = `Plano ${billing.planName} · pagamento atrasado`;
      detail = 'Regularize a cobrança para não perder o plano. Você recebeu o boleto/Pix por e-mail.';
      tone = 'alert';
      break;
    default:
      title = 'Assinatura cancelada';
      detail = billing.currentPeriodEnd && daysUntil(billing.currentPeriodEnd) > 0
        ? `Seu plano ${billing.planName} vale até ${formatDate(billing.currentPeriodEnd)}.`
        : 'Assine um plano para voltar a adicionar alunos.';
      tone = 'alert';
  }

  const toneClass =
    tone === 'alert' ? 'bg-k-alert/[0.12] text-k-alert' : tone === 'warn' ? 'bg-k-warn/[0.12] text-k-warn' : 'bg-k-primary-dim text-k-primary';
  const canCancel = billing.status === 'PENDENTE' || billing.status === 'ATIVA' || billing.status === 'ATRASADA';

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="flex flex-wrap items-center justify-between gap-6 rounded-[20px] border border-k-ghost bg-k-surface1 p-6"
    >
      <div className="flex min-w-0 items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${toneClass}`}>
          {tone === 'primary' ? <CreditCard className="h-[22px] w-[22px]" /> : <AlertTriangle className="h-[22px] w-[22px]" />}
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl font-extrabold tracking-tight">{title}</p>
          <p className="mt-1 text-sm text-k-text-dim">{detail}</p>
          <div className="mt-4 flex flex-wrap gap-x-10 gap-y-4">
            <UsageBar
              label={`${billing.activeStudents} de ${billing.studentLimit} alunos ativos`}
              percent={usage}
            />
            {billing.aiGenerationsLimit !== null && (
              <UsageBar
                label={`${billing.aiGenerationsUsed} de ${billing.aiGenerationsLimit} gerações de IA${
                  billing.aiResetsAt ? ` · renova em ${formatDate(billing.aiResetsAt)}` : ''
                }`}
                percent={
                  billing.aiGenerationsLimit > 0
                    ? Math.min(100, (billing.aiGenerationsUsed / billing.aiGenerationsLimit) * 100)
                    : 100
                }
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {billing.status === 'PENDENTE' && billing.checkoutUrl && (
          <button
            type="button"
            onClick={onPay}
            className="flex h-11 items-center gap-2 rounded-xl bg-k-primary px-5 text-sm font-bold text-k-on-primary"
          >
            <CreditCard className="h-4 w-4" />
            Pagar agora
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold text-k-text-dim transition-colors hover:border-k-alert/40 hover:text-k-alert"
          >
            Cancelar assinatura
          </button>
        )}
      </div>
    </motion.section>
  );
}

function UsageBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex w-[300px] max-w-full flex-col gap-1.5">
      <span className="text-[12.5px] text-k-text-muted">{label}</span>
      <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <motion.span
          className={`block h-full rounded-full ${percent >= 100 ? 'bg-k-alert' : 'bg-k-primary'}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: EASE_OUT }}
        />
      </span>
    </div>
  );
}

function PlanCard({
  plan,
  billing,
  paying,
  busy,
  disabled,
  onChoose,
}: {
  plan: BillingPlanOption;
  billing: BillingOverview;
  paying: boolean;
  busy: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  const isCurrent = billing.plan === plan.code && billing.status !== 'TRIAL';
  const tooSmall = plan.maxStudents !== null && plan.maxStudents < billing.activeStudents;

  let label: string;
  if (plan.comingSoon) label = 'Em breve';
  else if (isCurrent && paying) label = 'Plano atual';
  else if (isCurrent && billing.status === 'PENDENTE') label = 'Pagar este plano';
  else if (paying) label = 'Mudar para este';
  else label = 'Assinar';

  const blocked = plan.comingSoon || (isCurrent && paying) || tooSmall || disabled;

  return (
    <motion.div
      variants={riseItem}
      className={`flex flex-col gap-4 rounded-[18px] border p-5 ${
        isCurrent ? 'border-k-primary/50 bg-k-primary/[0.05]' : 'border-k-ghost bg-k-surface1'
      } ${plan.comingSoon ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-extrabold tracking-tight">{plan.name}</span>
        {isCurrent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-k-primary-dim px-2.5 py-1 text-[11.5px] font-semibold text-k-primary">
            <Check className="h-3 w-3" /> Seu plano
          </span>
        )}
        {plan.comingSoon && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11.5px] font-semibold text-k-text-dim">
            <Sparkles className="h-3 w-3" /> Em breve
          </span>
        )}
      </div>
      <div>
        {plan.priceCents !== null ? (
          <p className="flex items-baseline gap-1">
            <span className="font-display text-[30px] font-extrabold leading-none">{formatBRL(plan.priceCents)}</span>
            <span className="text-sm text-k-text-muted">/mês</span>
          </p>
        ) : (
          <p className="font-display text-[22px] font-extrabold leading-tight text-k-text-dim">Sob consulta</p>
        )}
        <p className="mt-2 text-sm text-k-text-dim">
          {plan.maxStudents !== null ? `Até ${plan.maxStudents} alunos ativos` : 'Equipes e estúdios com vários personais'}
        </p>
        {plan.maxStudents !== null && plan.priceCents !== null && (
          <p className="mt-0.5 text-[12.5px] text-k-text-muted">
            {formatBRL(Math.round(plan.priceCents / plan.maxStudents))} por aluno
          </p>
        )}
        {plan.aiGenerationsPerMonth !== null && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-k-text-dim">
            <Wand2 className="h-3.5 w-3.5 text-k-primary" />
            {plan.aiGenerationsPerMonth} fichas com IA por mês
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onChoose}
        disabled={blocked}
        title={tooSmall ? `Sua carteira tem ${billing.activeStudents} alunos ativos.` : undefined}
        className="mt-auto h-11 rounded-xl bg-k-primary text-sm font-bold text-k-on-primary transition-opacity disabled:cursor-not-allowed disabled:bg-k-surface2 disabled:text-k-text-muted"
      >
        {busy ? 'Aguarde…' : tooSmall && !plan.comingSoon ? 'Carteira maior que o plano' : label}
      </button>
    </motion.div>
  );
}
