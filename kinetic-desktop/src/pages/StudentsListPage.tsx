import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ChevronRight, MessageCircle, Plus, Search, Snowflake, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getEngagement,
  getStudentsMonthlyStats,
  getToday,
  listInviteCodes,
  listStudents,
} from '../services/trainerService';
import { qk, queryClient, refreshTrainerData } from '../services/queryClient';
import InviteStudentModal from '../components/InviteStudentModal';
import KineticLogo from '../components/KineticLogo';
import PhoneDialog from '../components/PhoneDialog';
import { usePersonalPhone } from '../layouts/PhoneGate';
import { maskCellPhone } from '../utils/whatsapp';
import StudentsTable, { type StudentRow } from '../components/personal/StudentsTable';
import PendingInvites from '../components/personal/PendingInvites';
import RiskAlerts from '../components/personal/RiskAlerts';
import TodayInbox from '../components/personal/TodayInbox';
import { formatDate, getBilling } from '../services/billingService';
import { StudentsEmpty, StudentsError, StudentsSkeleton } from '../components/personal/ListStates';
import { SPRING_PILL } from '../components/motion/primitives';
import { adherenceTone, toneRank } from '../components/personal/adherence';
import type {
  MonthlyStatsResponseDTO,
  StudentEngagement,
  TrainerInviteCode,
  TrainerLink,
} from '../types';

type Filter = 'all' | 'low' | 'mid' | 'ok';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'low', label: 'Atenção' },
  { id: 'mid', label: 'Regular' },
  { id: 'ok', label: 'Em dia' },
];

/** undefined = carregando; null = falhou. */
type StatsMap = Record<string, MonthlyStatsResponseDTO | null | undefined>;

const byStudent = (list: StudentEngagement[]) =>
  Object.fromEntries(list.map((e) => [e.studentId, e])) as Record<string, StudentEngagement>;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Madrugada ainda é "boa noite" (00:30 com "bom dia" soa errado).
const greetingFor = (hour: number) =>
  hour < 5 ? 'Boa noite' : hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

const todayLabel = (now: Date) => {
  const raw = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

export default function StudentsListPage() {
  const { currentUser } = useAuth();
  const { phone, setPhone } = usePersonalPhone();
  const [phoneOpen, setPhoneOpen] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const studentsQ = useQuery({ queryKey: qk.students, queryFn: listStudents });
  const statsQ = useQuery({ queryKey: qk.monthlyStats, queryFn: getStudentsMonthlyStats });
  // Secundários: falha em qualquer um só esconde a parte dele, não derruba a carteira.
  const inviteCodesQ = useQuery({ queryKey: qk.inviteCodes, queryFn: listInviteCodes });
  const billingQ = useQuery({ queryKey: qk.billing, queryFn: getBilling });
  const engagementQ = useQuery({ queryKey: qk.engagement, queryFn: getEngagement, select: byStudent });
  const todayQ = useQuery({ queryKey: qk.today, queryFn: getToday });

  const students = useMemo(() => studentsQ.data ?? [], [studentsQ.data]);
  const loading = studentsQ.isPending;
  const loadError = studentsQ.isError && !studentsQ.data;
  const inviteCodes = inviteCodesQ.data ?? [];
  const billing = billingQ.data;
  /** Painel de aderência por aluno; null = carregando. */
  const engagement = engagementQ.data ?? (engagementQ.isError ? {} : null);
  /** Caixa "Hoje"; null = carregando ou falhou (a seção some). */
  const today = todayQ.data ?? null;
  // undefined = carregando; null = falhou (o anel mostra "sem dado").
  const stats: StatsMap = useMemo(
    () =>
      statsQ.data ?? (statsQ.isError ? Object.fromEntries(students.map((l) => [l.peer.id, null])) : {}),
    [statsQ.data, statsQ.isError, students],
  );
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  // Relógio da saudação/data: atualiza com o painel aberto (virada de turno ou de dia).
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const rows: StudentRow[] = useMemo(
    () =>
      students
        .map((link) => {
          const s = stats[link.peer.id];
          return { link, stats: s, tone: adherenceTone(s) };
        })
        // Triagem: quem precisa de atenção primeiro (sort é estável).
        .sort((a, b) => toneRank(a.tone) - toneRank(b.tone)),
    [students, stats],
  );

  const statsReady = students.length > 0 && students.every((l) => stats[l.peer.id] !== undefined);

  const counts: Record<Filter, number> = {
    all: rows.length,
    low: rows.filter((r) => r.tone === 'low').length,
    mid: rows.filter((r) => r.tone === 'mid').length,
    ok: rows.filter((r) => r.tone === 'ok').length,
  };

  const riskCount = engagement
    ? students.filter((l) => {
        // Mesmo critério do painel "Precisam de um contato".
        const e = engagement[l.peer.id];
        return e?.risk === 'ALTO' && !e.pause && !l.frozen;
      }).length
    : null;
  const scrollToAlerts = () =>
    document.getElementById('alertas-de-risco')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const withPlan = rows.filter((r) => r.stats && r.stats.targetSessions > 0);
  const avgAdherence = withPlan.length
    ? withPlan.reduce((sum, r) => sum + (r.stats?.efficiency ?? 0), 0) / withPlan.length
    : null;

  const q = query.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (filter !== 'all' && r.tone !== filter) return false;
    if (!q) return true;
    return r.link.peer.nome.toLowerCase().includes(q) || r.link.peer.email.toLowerCase().includes(q);
  });

  const handleLinkCreated = (invite: TrainerInviteCode) => {
    queryClient.setQueryData<TrainerInviteCode[]>(qk.inviteCodes, (list = []) => [invite, ...list]);
  };

  const handleInviteCodeChange = (id: string, next: TrainerInviteCode | null) => {
    queryClient.setQueryData<TrainerInviteCode[]>(qk.inviteCodes, (list = []) =>
      next ? list.map((i) => (i.id === id ? next : i)) : list.filter((i) => i.id !== id),
    );
  };

  const handleInvited = (link: TrainerLink) => {
    toast.success(`Convite enviado para ${link.peer.nome}`, {
      description: 'O vínculo fica pendente até o aluno aceitar no app.',
    });
  };

  const firstName = currentUser?.nome.trim().split(/\s+/)[0] ?? '';

  const totalDone = withPlan.reduce((sum, r) => sum + (r.stats?.completedSessions ?? 0), 0);
  const totalTarget = withPlan.reduce((sum, r) => sum + (r.stats?.targetSessions ?? 0), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.07] px-4 md:h-[60px] md:gap-3 md:px-8">
        <span className="sm:hidden">
          <KineticLogo size={16} />
        </span>
        <span className="text-sm text-k-text-muted max-sm:hidden">Visão geral</span>
        <button
          type="button"
          onClick={() => setPhoneOpen(true)}
          title="Trocar meu WhatsApp"
          aria-label="Trocar meu WhatsApp"
          className="ml-auto flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 px-2.5 text-[13px] text-k-text-dim transition-colors hover:bg-white/[0.06] hover:text-k-text sm:px-3"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="font-mono max-sm:hidden">{phone ? maskCellPhone(phone) : 'Meu WhatsApp'}</span>
        </button>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-k-primary px-3 text-[13px] font-semibold text-k-on-primary transition-colors hover:bg-[#7df1ff] sm:px-3.5"
        >
          <UserPlus className="h-4 w-4" />
          Convidar<span className="max-sm:hidden"> aluno</span>
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pb-16 md:pt-9">
          <section className="flex flex-col gap-1 md:gap-1.5">
            <p className="font-mono text-[11px] uppercase md:text-xs tracking-[0.04em] text-k-text-muted">{todayLabel(now)}</p>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] md:text-[28px] md:leading-[34px]">
              {greetingFor(now.getHours())}
              {firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-k-text-dim">
              <HeroSummary
                ready={!loading && !loadError && (riskCount !== null || students.length === 0)}
                total={students.length}
                attention={riskCount ?? 0}
              />
            </p>
          </section>

          {/* Indicadores: uma faixa só, separados por linhas finas. */}
          <section
            aria-label="Resumo da carteira"
            className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] lg:grid-cols-4"
          >
            <Kpi
              label="Alunos ativos"
              short="Alunos ativos"
              value={loading ? null : students.length}
              unit={billing?.studentLimit != null ? `/ ${billing.studentLimit}` : undefined}
              foot={
                billing?.studentLimit != null
                  ? `${Math.max(0, billing.studentLimit - students.length)} vagas livres no plano`
                  : billing
                    ? 'Alunos ilimitados no seu plano'
                    : 'Vinculados à sua carteira'
              }
              onClick={() => setFilter('all')}
            />
            <Kpi
              label="Aderência média · mês"
              short="Aderência · mês"
              value={statsReady && avgAdherence !== null ? Math.round(avgAdherence) : null}
              unit="%"
              progress={statsReady && avgAdherence !== null ? avgAdherence : undefined}
              foot="Entre alunos com meta de frequência"
            />
            <Kpi
              label="Treinos concluídos · mês"
              short="Treinos · mês"
              value={statsReady ? totalDone : null}
              unit={statsReady ? `/ ${totalTarget}` : undefined}
              foot="Somando as fichas de todos os alunos"
            />
            <Kpi
              label="Precisam de atenção"
              short="Em risco"
              value={riskCount}
              dot={(riskCount ?? 0) > 0}
              foot="Risco alto: muito tempo sem treinar ou queda forte"
              onClick={(riskCount ?? 0) > 0 ? scrollToAlerts : undefined}
            />
          </section>

          {billing && (billing.chooseActiveUntil || billing.frozenStudents > 0) && (
            <Link
              to="/assinatura#carteira"
              className="flex items-center gap-3 rounded-xl border border-k-warn/30 bg-k-warn/[0.05] px-4 py-3.5 text-sm md:px-5 transition-colors hover:bg-k-warn/[0.09]"
            >
              <Snowflake className="h-4 w-4 shrink-0 text-k-warn" />
              <span className="flex-1">
                {billing.chooseActiveUntil
                  ? `Sua carteira passou do limite do plano Grátis. Escolha até ${formatDate(billing.chooseActiveUntil)} quais alunos continuam ativos.`
                  : `${billing.frozenStudents} ${billing.frozenStudents === 1 ? 'aluno congelado' : 'alunos congelados'}: você vê, mas não edita. Assine para liberar.`}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-k-text-muted" />
            </Link>
          )}

          {/* Fila: o que pede ação hoje */}
          {!loadError && today && <TodayInbox items={today} />}

          {/* Alertas de risco de abandono */}
          {!loading && !loadError && students.length > 0 && engagement && (
            <RiskAlerts students={students} engagement={engagement} trainerFirstName={firstName} />
          )}

          <section aria-labelledby="alunos-titulo" className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="alunos-titulo" className="text-[17px] font-semibold">
                Alunos
              </h2>
              {!loading && !loadError && (
                <span className="font-mono text-xs text-k-text-muted">
                  {visible.length === rows.length ? rows.length : `${visible.length} de ${rows.length}`}
                </span>
              )}
              <div role="group" aria-label="Filtrar alunos por aderência" className="-mx-1 flex w-full gap-0.5 overflow-x-auto sm:mx-0 sm:ml-3 sm:w-auto">
                {FILTERS.map((f) => {
                  const active = filter === f.id;
                  const count = f.id === 'all' || statsReady ? String(counts[f.id]) : '–';
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(f.id)}
                      className={`relative flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors ${
                        active ? 'text-k-text' : 'text-k-text-dim hover:text-k-text'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="students-filter-pill"
                          transition={SPRING_PILL}
                          className="absolute inset-0 rounded-md bg-white/[0.08]"
                        />
                      )}
                      <span className="relative">{f.label}</span>
                      {f.id !== 'all' && <span className="relative font-mono text-k-text-muted">{count}</span>}
                    </button>
                  );
                })}
              </div>
              <label className="relative flex flex-1 items-center sm:ml-auto sm:flex-none">
                <span className="sr-only">Buscar aluno</span>
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-k-text-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nome ou e-mail"
                  className="h-9 w-full rounded-lg sm:w-[260px] border border-white/10 bg-transparent pl-9 pr-3 text-[13px] transition-colors placeholder:text-k-text-muted focus:border-k-primary"
                />
              </label>
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                aria-label="Convidar aluno"
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[13px] text-k-text transition-colors hover:bg-white/[0.06]"
              >
                <Plus className="h-4 w-4" />
                <span className="max-sm:hidden">Convidar aluno</span>
              </button>
            </div>

            {loading ? (
              <StudentsSkeleton />
            ) : loadError ? (
              <StudentsError onRetry={() => void refreshTrainerData()} />
            ) : students.length === 0 ? (
              <StudentsEmpty onInvite={() => setInviteOpen(true)} />
            ) : visible.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/[0.12] p-10 text-center text-k-text-muted">
                Nenhum aluno encontrado com esse filtro.
              </p>
            ) : (
              <StudentsTable rows={visible} engagement={engagement} />
            )}
          </section>

          <PendingInvites
            invites={inviteCodes}
            onChange={handleInviteCodeChange}
            trainerFirstName={firstName}
          />
        </div>
      </main>

      <InviteStudentModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={handleInvited}
        onLinkCreated={handleLinkCreated}
        trainerFirstName={firstName}
      />
      <PhoneDialog open={phoneOpen} onOpenChange={setPhoneOpen} phone={phone} onSaved={setPhone} />
    </div>
  );
}

function HeroSummary({
  ready,
  total,
  attention,
}: {
  ready: boolean;
  total: number;
  attention: number;
}) {
  if (!ready) return <>Preparando o resumo da sua carteira…</>;
  if (total === 0) return <>Convide seus alunos para acompanhar os treinos deles por aqui.</>;

  if (attention > 0) {
    return (
      <>
        Você tem{' '}
        <strong className="font-semibold text-k-alert">{plural(attention, 'aluno', 'alunos')}</strong>{' '}
        precisando de atenção.
      </>
    );
  }
  return (
    <>
      Nenhum aluno em risco de abandono agora.
    </>
  );
}

/** Célula da faixa de indicadores; value null = carregando (traço). */
function Kpi({
  label,
  short,
  value,
  unit,
  foot,
  progress,
  dot,
  onClick,
}: {
  label: string;
  /** Rótulo do celular (meia largura). */
  short: string;
  value: number | null;
  unit?: string;
  foot: string;
  progress?: number;
  dot?: boolean;
  onClick?: () => void;
}) {
  const body: ReactNode = (
    <>
      <span className="truncate text-xs text-k-text-muted md:text-[13px]">
        <span className="md:hidden">{short}</span>
        <span className="max-md:hidden">{label}</span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-medium leading-7 tabular-nums md:text-[30px] md:leading-[34px]">
          {value === null ? '—' : value}
        </span>
        {unit && value !== null && <span className="font-mono text-k-text-muted">{unit}</span>}
        {dot && <span className="ml-1 h-2 w-2 self-center rounded-full bg-k-alert" aria-hidden="true" />}
      </span>
      {progress !== undefined && (
        <span className="block h-1 rounded-full bg-white/[0.08]">
          <span
            className="block h-1 rounded-full bg-k-primary transition-[width] duration-700"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </span>
      )}
      <span className="text-xs text-k-text-muted max-md:hidden">{foot}</span>
    </>
  );
  const className = 'flex flex-col gap-2 bg-k-bg p-4 text-left md:gap-2.5 md:p-5';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${className} transition-colors hover:bg-[#171717]`}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
