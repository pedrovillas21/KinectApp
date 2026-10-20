import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Check,
  CreditCard,
  FlaskConical,
  LineChart,
  MessageCircle,
  Plus,
  Smartphone,
  Wallet,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
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
import { qk, queryClient } from '../services/queryClient';
import type { BillingOverview, BillingPlanOption } from '../types';

/** Abre a página de pagamento: rota do painel (demo) ou página do gateway em nova aba. */
function openCheckout(url: string, navigate: (to: string) => void) {
  if (url.startsWith('/')) navigate(url);
  else window.open(url, '_blank', 'noopener,noreferrer');
}

export default function BillingPage() {
  const navigate = useNavigate();
  const billingQ = useQuery({ queryKey: qk.billing, queryFn: getBilling });
  const billing = billingQ.data ?? null;
  const loadError = billingQ.isError && !billing;
  const setBilling = (next: BillingOverview) => queryClient.setQueryData(qk.billing, next);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const load = () => void billingQ.refetch();

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

  const priced = (billing?.plans ?? []).filter((p) => !p.comingSoon && p.priceCents !== null && p.maxStudents);
  const upcoming = (billing?.plans ?? []).filter((p) => p.comingSoon);
  const currentIdx = paying ? priced.findIndex((p) => p.code === billing?.plan) : -1;
  // Destaque: o próximo degrau de quem já assina; para quem não assina, o menor plano que comporta a carteira.
  const recommended =
    currentIdx >= 0
      ? priced[currentIdx + 1]
      : priced.find((p) => (p.maxStudents ?? 0) >= (billing?.activeStudents ?? 0));
  const cheapestPerStudent = priced.reduce<BillingPlanOption | undefined>(
    (best, p) => (!best || perStudent(p) < perStudent(best) ? p : best),
    undefined,
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-8">
        <span className="text-sm text-k-text-muted">Meu plano</span>
        {billing?.gatewayMode === 'DEMO' && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-k-warn">
            <FlaskConical className="h-3.5 w-3.5" />
            Modo demonstração · nenhuma cobrança real
          </span>
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-14 px-8 pb-20 pt-14">
          {loadError ? (
            <div className="rounded-xl border border-dashed border-white/[0.14] p-10 text-center">
              <p className="text-k-text-dim">Não foi possível carregar seu plano.</p>
              <button
                type="button"
                onClick={load}
                className="mt-4 h-9 rounded-lg border border-white/[0.12] px-4 text-[13px] hover:bg-white/[0.06]"
              >
                Tentar de novo
              </button>
            </div>
          ) : !billing ? (
            <div role="status" aria-label="Carregando plano" className="k-skeleton h-[420px] rounded-xl bg-k-surface1" />
          ) : (
            <>
              <section className="flex flex-col items-center gap-4 text-center">
                <span className="font-mono text-xs tracking-[0.08em] text-k-primary">PLANOS KINETIC</span>
                <h1 className="max-w-[760px] text-[40px] font-semibold leading-[46px] tracking-[-0.03em]">
                  Atenda mais alunos com o mesmo tempo de trabalho
                </h1>
                <p className="max-w-[600px] text-base leading-relaxed text-k-text-dim">
                  Painel do personal, app grátis para os seus alunos e fichas geradas com IA que você revisa e
                  aprova. Pague pelo tamanho da sua carteira e troque de plano quando ela crescer.
                </p>
              </section>

              <CurrentPlan
                billing={billing}
                onPay={() => billing.checkoutUrl && openCheckout(billing.checkoutUrl, navigate)}
                onCancel={() => setCancelOpen(true)}
              />

              <section aria-label="Planos" className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
                {priced.map((plan) => (
                  <PlanColumn
                    key={plan.code}
                    plan={plan}
                    billing={billing}
                    paying={paying}
                    recommended={plan.code === recommended?.code}
                    bestValue={plan.code === cheapestPerStudent?.code && priced.length > 1}
                    busy={busyPlan === plan.code}
                    disabled={!!busyPlan}
                    onChoose={() => void handleChoose(plan)}
                  />
                ))}
              </section>

              <section aria-labelledby="inclui" className="flex flex-col gap-5">
                <h2 id="inclui" className="text-xl font-semibold tracking-[-0.01em]">
                  Todos os planos incluem
                </h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] border-t border-white/[0.08]">
                  {INCLUDED.map(({ icon: Icon, title, body }) => (
                    <div key={title} className="flex gap-3.5 border-b border-white/[0.08] py-5 pr-5">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-k-primary" strokeWidth={1.7} />
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{title}</span>
                        <span className="text-[13px] leading-relaxed text-k-text-dim">{body}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {upcoming.map((plan) => (
                <section
                  key={plan.code}
                  aria-label={plan.name}
                  className="flex flex-wrap items-center gap-6 rounded-xl border border-white/[0.08] bg-[#171717] p-7"
                >
                  <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-[17px] font-semibold">{plan.name}</h2>
                      <span className="rounded-full border border-white/[0.14] px-2 py-0.5 text-xs text-k-text-dim">
                        Em breve
                      </span>
                    </div>
                    <p className="text-k-text-dim">
                      Para estúdios e equipes com vários personais: carteira compartilhada e gestão de equipe, com
                      preço sob consulta.
                    </p>
                  </div>
                </section>
              ))}

              {priced.length > 1 && (
                <section aria-labelledby="comparar" className="flex flex-col gap-5">
                  <h2 id="comparar" className="text-xl font-semibold tracking-[-0.01em]">
                    Compare os planos
                  </h2>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                    <table className="w-full min-w-[720px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th scope="col" className="px-5 py-3.5 text-left">
                            <span className="sr-only">Recurso</span>
                          </th>
                          {priced.map((p) => (
                            <th
                              key={p.code}
                              scope="col"
                              className={`px-5 py-3.5 text-right font-semibold ${
                                p.code === billing.plan && paying ? 'text-k-primary' : ''
                              }`}
                            >
                              {p.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] border-t border-white/[0.06] text-right font-mono">
                        <CompareRow label="Alunos ativos" plans={priced} value={(p) => String(p.maxStudents)} />
                        <CompareRow
                          label="Fichas com IA por mês"
                          plans={priced}
                          value={(p) => (p.aiGenerationsPerMonth === null ? '—' : String(p.aiGenerationsPerMonth))}
                        />
                        <CompareRow label="Custo por aluno" plans={priced} value={(p) => formatBRL(perStudent(p))} />
                        <CompareRow label="App do aluno, alertas, relatórios e financeiro" plans={priced} value={() => '✓'} />
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <section aria-labelledby="faq" className="flex flex-wrap gap-10">
                <h2 id="faq" className="flex-[1_1_240px] text-xl font-semibold tracking-[-0.01em]">
                  Perguntas frequentes
                </h2>
                <div className="flex flex-[3_1_560px] flex-col border-t border-white/[0.08]">
                  {FAQ.map(({ q, a }, i) => (
                    <details key={q} open={i === 0} className="group border-b border-white/[0.08] py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                        {q}
                        <Plus className="h-4 w-4 shrink-0 text-k-text-muted transition-transform group-open:rotate-45" />
                      </summary>
                      <p className="mt-2.5 leading-relaxed text-k-text-dim">{a}</p>
                    </details>
                  ))}
                </div>
              </section>

              <p className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-k-text-muted">
                <span>Pix · boleto · cartão</span>
                <span aria-hidden="true">·</span>
                <span>Cobrança mensal</span>
                <span aria-hidden="true">·</span>
                <span>Cancele pelo próprio painel</span>
              </p>
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

const perStudent = (p: BillingPlanOption) => Math.round((p.priceCents ?? 0) / (p.maxStudents || 1));

const INCLUDED: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Smartphone, title: 'App grátis para os alunos', body: 'Seus alunos treinam, registram cargas e acompanham a evolução sem pagar nada.' },
  { icon: Wand2, title: 'Fichas com IA, revisadas por você', body: 'A IA monta o rascunho a partir da anamnese; você ajusta e publica.' },
  { icon: AlertTriangle, title: 'Alertas de risco de abandono', body: 'Saiba quem parou de treinar antes que o aluno cancele com você.' },
  { icon: LineChart, title: 'Relatório de evolução', body: 'Carga, aderência e medidas por ciclo, prontos para mostrar ao aluno.' },
  { icon: Wallet, title: 'Financeiro da carteira', body: 'Mensalidades e cobranças dos seus alunos no mesmo painel.' },
  { icon: MessageCircle, title: 'Contato pelo WhatsApp', body: 'Um clique para falar com o aluno que precisa de atenção.' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'O que conta como aluno ativo?',
    a: 'Todo aluno com vínculo ativo com você. Convites ainda não aceitos e alunos desvinculados não contam no limite.',
  },
  {
    q: 'Posso trocar de plano depois?',
    a: 'Sim, direto por esta tela. Para quem já assina, o novo valor entra nas próximas cobranças.',
  },
  {
    q: 'O que acontece se a carteira passar do limite?',
    a: 'Os alunos atuais continuam normalmente; para adicionar alunos novos, é só mudar para um plano maior.',
  },
  { q: 'Quais as formas de pagamento?', a: 'Pix, boleto ou cartão, com cobrança mensal.' },
  {
    q: 'Como cancelo?',
    a: 'Pelo próprio painel, no resumo do seu plano acima. O plano continua valendo até o fim do período já pago.',
  },
];

function CompareRow({
  label,
  plans,
  value,
}: {
  label: string;
  plans: BillingPlanOption[];
  value: (p: BillingPlanOption) => string;
}) {
  return (
    <tr>
      <th scope="row" className="px-5 py-3.5 text-left font-sans font-normal">
        {label}
      </th>
      {plans.map((p) => (
        <td key={p.code} className={`px-5 py-3.5 ${value(p) === '✓' ? 'text-k-primary' : ''}`}>
          {value(p) === '✓' ? <span aria-label="Incluso">✓</span> : value(p)}
        </td>
      ))}
    </tr>
  );
}

/** Situação atual: status, uso e as ações da assinatura (pagar, cancelar). */
function CurrentPlan({
  billing,
  onPay,
  onCancel,
}: {
  billing: BillingOverview;
  onPay: () => void;
  onCancel: () => void;
}) {
  const trialDays = daysUntil(billing.trialEndsAt);
  let title: string;
  let detail: string;
  let alert = false;
  switch (billing.status) {
    case 'TRIAL':
      title = trialDays > 0 ? 'Teste grátis' : 'Teste grátis encerrado';
      detail =
        trialDays > 0
          ? `Termina em ${trialDays} ${trialDays === 1 ? 'dia' : 'dias'} (${formatDate(billing.trialEndsAt)}).`
          : 'Assine um plano para continuar adicionando alunos.';
      alert = trialDays <= 3;
      break;
    case 'PENDENTE':
      title = `Plano ${billing.planName} aguardando pagamento`;
      detail = 'O plano passa a valer assim que o pagamento for confirmado.';
      alert = true;
      break;
    case 'ATIVA':
      title = `Plano ${billing.planName}`;
      detail = billing.currentPeriodEnd ? `Renova em ${formatDate(billing.currentPeriodEnd)}.` : 'Assinatura ativa.';
      break;
    case 'ATRASADA':
      title = `Plano ${billing.planName} · pagamento atrasado`;
      detail = 'Regularize a cobrança para não perder o plano. O boleto/Pix foi enviado por e-mail.';
      alert = true;
      break;
    default:
      title = 'Assinatura cancelada';
      detail =
        billing.currentPeriodEnd && daysUntil(billing.currentPeriodEnd) > 0
          ? `Seu plano ${billing.planName} vale até ${formatDate(billing.currentPeriodEnd)}.`
          : 'Assine um plano para voltar a adicionar alunos.';
      alert = true;
  }
  const canCancel = billing.status === 'PENDENTE' || billing.status === 'ATIVA' || billing.status === 'ATRASADA';

  return (
    <section
      aria-label="Seu plano"
      className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-[minmax(260px,1.2fr)_1fr_1fr]"
    >
      <div className="flex flex-col gap-1.5 bg-k-bg p-5">
        <span className="text-xs text-k-text-muted">Você está no</span>
        <span className={`flex items-center gap-2 text-lg font-semibold ${alert ? 'text-k-warn' : ''}`}>
          {alert && <AlertTriangle className="h-4 w-4" />}
          {title}
        </span>
        <span className="text-[13px] text-k-text-dim">{detail}</span>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {billing.status === 'PENDENTE' && billing.checkoutUrl && (
            <button
              type="button"
              onClick={onPay}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-k-primary px-3.5 text-[13px] font-semibold text-k-on-primary hover:bg-[#7df1ff]"
            >
              <CreditCard className="h-4 w-4" />
              Pagar agora
            </button>
          )}
          {canCancel && (
            <button type="button" onClick={onCancel} className="text-[13px] text-k-text-muted hover:text-k-alert">
              Cancelar assinatura
            </button>
          )}
        </div>
      </div>
      <Usage label="Alunos ativos" used={billing.activeStudents} limit={billing.studentLimit} />
      {billing.aiGenerationsLimit !== null ? (
        <Usage
          label={`Fichas com IA${billing.aiResetsAt ? ` · renova em ${formatDate(billing.aiResetsAt)}` : ''}`}
          used={billing.aiGenerationsUsed}
          limit={billing.aiGenerationsLimit}
        />
      ) : (
        <div className="bg-k-bg" />
      )}
    </section>
  );
}

function Usage({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 100;
  return (
    <div className="flex flex-col justify-center gap-2.5 bg-k-bg p-5">
      <span className="text-xs text-k-text-muted">{label}</span>
      <span className="font-mono text-2xl font-medium">
        {used}
        <span className="text-base text-k-text-muted"> / {limit}</span>
      </span>
      <span className="block h-1 rounded-full bg-white/[0.08]">
        <span
          className={`block h-1 rounded-full ${pct >= 100 ? 'bg-k-alert' : pct >= 90 ? 'bg-k-warn' : 'bg-k-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}

function PlanColumn({
  plan,
  billing,
  paying,
  recommended,
  bestValue,
  busy,
  disabled,
  onChoose,
}: {
  plan: BillingPlanOption;
  billing: BillingOverview;
  paying: boolean;
  recommended: boolean;
  bestValue: boolean;
  busy: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  const isCurrent = billing.plan === plan.code && billing.status !== 'TRIAL';
  const tooSmall = plan.maxStudents !== null && plan.maxStudents < billing.activeStudents;
  const upgrade = paying && !isCurrent && (plan.priceCents ?? 0) > (billing.plans.find((p) => p.code === billing.plan)?.priceCents ?? 0);

  let label: string;
  if (isCurrent && paying) label = 'Plano atual';
  else if (isCurrent && billing.status === 'PENDENTE') label = 'Pagar este plano';
  else if (paying) label = upgrade ? `Fazer upgrade para ${plan.name}` : `Mudar para ${plan.name}`;
  else label = `Assinar ${plan.name}`;

  const blocked = (isCurrent && paying) || tooSmall || disabled;
  const primary = recommended && !blocked;

  return (
    <article
      className={`flex flex-col gap-5 rounded-xl border p-6 ${
        isCurrent ? 'border-k-primary bg-[#1a1a1a] shadow-[0_0_0_4px_rgba(0,229,255,0.06)]' : 'border-white/[0.08]'
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[17px] font-semibold">{plan.name}</h2>
          {isCurrent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-k-primary px-2 py-0.5 text-xs font-semibold text-k-on-primary">
              <Check className="h-3 w-3" /> Seu plano
            </span>
          ) : bestValue ? (
            <span className="font-mono text-[11px] text-k-success">MENOR CUSTO/ALUNO</span>
          ) : null}
        </div>
        <span className="text-[13px] text-k-text-muted">Até {plan.maxStudents} alunos ativos</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="flex items-baseline gap-1">
          <span className="font-mono text-[34px] font-medium leading-[40px] tracking-[-0.02em]">
            {formatBRL(plan.priceCents ?? 0)}
          </span>
          <span className="text-k-text-muted">/mês</span>
        </span>
        <span className="font-mono text-xs text-k-text-muted">{formatBRL(perStudent(plan))} por aluno</span>
      </div>
      <button
        type="button"
        onClick={onChoose}
        disabled={blocked}
        title={tooSmall ? `Sua carteira tem ${billing.activeStudents} alunos ativos.` : undefined}
        className={`h-11 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-white/[0.06] disabled:text-k-text-muted ${
          primary
            ? 'bg-k-primary text-k-on-primary hover:bg-[#7df1ff]'
            : 'border border-white/[0.14] text-k-text hover:bg-white/[0.06]'
        }`}
      >
        {busy ? 'Aguarde…' : tooSmall ? 'Carteira maior que o plano' : label}
      </button>
      <ul className="flex flex-col gap-3 border-t border-white/[0.07] pt-5">
        <li className="flex gap-2.5">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-k-primary" />
          <span>
            Até <span className="font-mono">{plan.maxStudents}</span> alunos ativos
          </span>
        </li>
        {plan.aiGenerationsPerMonth !== null && (
          <li className="flex gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-k-primary" />
            <span>
              <span className="font-mono">{plan.aiGenerationsPerMonth}</span> fichas com IA por mês
            </span>
          </li>
        )}
      </ul>
    </article>
  );
}
