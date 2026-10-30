import { useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, IdCard, LayoutDashboard, LogOut, Wallet, type LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import KineticLogo from '../components/KineticLogo';
import Avatar from '../components/Avatar';
import { aiTotalLimit, getBilling } from '../services/billingService';
import { daysUntil } from '../utils/dates';
import { getMyTrainerProfile } from '../services/trainerProfileService';
import { qk } from '../services/queryClient';
import { draftKey, updateAiDraft, useAiDrafts, type AiDraft } from '../components/personal/ai/aiDraftStore';
import type { BillingOverview } from '../types';
import MobileNav, { InstallAppButton } from './MobileNav';

const NAV: { label: string; shortLabel?: string; to: string; icon: LucideIcon }[] = [
  { label: 'Visão geral', shortLabel: 'Início', to: '/students', icon: LayoutDashboard },
  { label: 'Financeiro', to: '/financeiro', icon: Wallet },
  { label: 'Meu plano', to: '/assinatura', icon: CreditCard },
  { label: 'Meu perfil', to: '/perfil', icon: IdCard },
];

/**
 * Moldura das telas do personal: barra lateral fixa (marca, navegação, uso do
 * plano, conta) + conteúdo. Cada tela continua dona do próprio scroll.
 * No celular a barra lateral vira barra inferior + gaveta (MobileNav).
 */
export default function PersonalShell() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-k-bg text-k-text md:flex-row">
      <aside className="hidden w-[232px] shrink-0 flex-col gap-6 border-r border-white/[0.07] bg-[#161616] px-3 py-5 md:flex">
        <SidebarContent />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet />
      </div>

      <MobileNav tabs={TABS} drawer={<SidebarContent />} />
    </div>
  );
}

const TABS = NAV.map(({ label, shortLabel, to, icon }) => ({ label: shortLabel ?? label, to, icon }));

/** Marca, navegação, fichas com IA em andamento, uso do plano e conta: barra lateral e gaveta do celular. */
function SidebarContent() {
  const { currentUser, signOut } = useAuth();
  const { data: profile } = useQuery({ queryKey: qk.profile, queryFn: getMyTrainerProfile });

  return (
    <>
      <Link to="/students" aria-label="Kinetic, visão geral" className="px-2.5 py-1">
        <KineticLogo size={19} />
      </Link>

      <nav aria-label="Principal" className="flex flex-col gap-0.5">
        {NAV.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors ${
                isActive ? 'bg-white/[0.06] text-k-text' : 'text-k-text-dim hover:bg-white/[0.04] hover:text-k-text'
              }`
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <AiDraftsNav ownerId={currentUser?.id} />

      <div className="mt-auto flex flex-col gap-3">
        <InstallAppButton />
        <PlanUsage />
        <div className="flex items-center gap-2.5 px-1.5">
          <Avatar key={profile?.avatarUrl ?? 'none'} name={currentUser?.nome ?? ''} avatarUrl={profile?.avatarUrl} size={32} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium">{currentUser?.nome}</p>
            <p className="truncate text-xs text-k-text-muted">{currentUser?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Sair"
            title="Sair"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-k-text-muted transition-colors hover:bg-white/[0.06] hover:text-k-alert"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

/** Situação da assinatura em uma linha; `alert` destaca o que pede ação. */
function planStatus(b: BillingOverview): { text: string; alert: boolean } {
  const trialDays = daysUntil(b.trialEndsAt);
  switch (b.status) {
    case 'TRIAL':
      return { text: trialDays > 0 ? `Teste grátis · ${trialDays}d` : 'Plano Grátis', alert: trialDays > 0 && trialDays <= 3 };
    case 'PENDENTE':
      return { text: 'Pagamento pendente', alert: true };
    case 'ATRASADA':
      return { text: 'Pagamento atrasado', alert: true };
    case 'ATIVA':
      return { text: `Plano ${b.planName}`, alert: false };
    default:
      return daysUntil(b.currentPeriodEnd) > 0
        ? { text: `Plano ${b.planName} · cancelado`, alert: false }
        : { text: 'Plano Grátis', alert: false };
  }
}

/** `limit` null = ilimitado (barra vazia). */
function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit === null ? 0 : limit > 0 ? Math.min(100, (used / limit) * 100) : 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-k-text-muted">
        <span>{label}</span>
        <span className="font-mono text-k-text-soft">
          {used} / {limit ?? '∞'}
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.08]">
        <div className={`h-1 rounded-full ${pct >= 90 ? 'bg-k-warn' : 'bg-k-primary'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Uso do plano: mesma chave de cache da tela "Meu plano". */
function PlanUsage() {
  const { data: billing } = useQuery({ queryKey: qk.billing, queryFn: getBilling });
  if (!billing) return null;
  const status = planStatus(billing);
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-white/[0.07] p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className={`truncate text-[13px] font-semibold ${status.alert ? 'text-k-warn' : ''}`}>{status.text}</span>
        <Link to="/assinatura" className="shrink-0 text-xs text-k-primary hover:underline">
          Ver planos
        </Link>
      </div>
      <Meter label="Alunos ativos" used={billing.activeStudents} limit={billing.studentLimit} />
      {billing.aiGenerationsLimit !== null && (
        <Meter label="Fichas com IA" used={billing.aiGenerationsUsed} limit={aiTotalLimit(billing)} />
      )}
    </div>
  );
}

const draftStatus = (d: AiDraft): string => {
  if (d.step === 'generating') return 'Gerando prévia…';
  if (d.approving) return 'Enviando…';
  if (d.preview && (d.step === 'preview' || d.step === 'edit')) {
    const done = d.reviewed.filter(Boolean).length;
    return `Prévia · ${done} de ${d.plans.length} ${d.plans.length === 1 ? 'revisada' : 'revisadas'}`;
  }
  return d.error ? 'Falhou · tente de novo' : 'Pedido em edição';
};

/**
 * Fichas com IA em andamento (aiDraftStore): sair da tela não perde o rascunho, e daqui
 * o personal volta para ele. Fechar a janela com prévia pendente pede confirmação.
 */
function AiDraftsNav({ ownerId }: { ownerId: string | undefined }) {
  const drafts = useAiDrafts(ownerId);
  const pending = drafts.some((d) => d.preview || d.step === 'generating');

  useEffect(() => {
    if (!pending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [pending]);

  if (drafts.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-k-text-muted">Em andamento</span>
      {drafts.map((d) => {
        const generating = d.step === 'generating';
        return (
          <NavLink
            key={d.studentId}
            to={`/students/${d.studentId}?aba=treinos`}
            // Reabre o fluxo se o personal tinha voltado para a lista durante a geração.
            onClick={() => updateAiDraft(draftKey(ownerId ?? '', d.studentId), { minimized: false })}
            className="flex items-center gap-2.5 rounded-lg border border-k-primary/20 bg-k-primary/[0.05] px-2.5 py-2 transition-colors hover:bg-k-primary/[0.09]"
          >
            {generating ? (
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-k-primary/25 border-t-k-primary motion-reduce:animate-none"
              />
            ) : (
              <span aria-hidden="true" className={`mx-0.5 h-2 w-2 shrink-0 rounded-full ${d.error ? 'bg-k-alert' : 'bg-k-primary'}`} />
            )}
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[13px] font-semibold text-k-text">Ficha · {d.studentName}</span>
              <span className="truncate text-[11.5px] text-k-text-muted">{draftStatus(d)}</span>
            </span>
          </NavLink>
        );
      })}
    </div>
  );
}
