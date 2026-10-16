import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  Award,
  CreditCard,
  Wallet,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getEngagement,
  getStudentMonthlyStats,
  getToday,
  listInviteCodes,
  listStudents,
} from '../services/trainerService';
import InviteStudentModal from '../components/InviteStudentModal';
import PhoneDialog from '../components/PhoneDialog';
import { usePersonalPhone } from '../layouts/PhoneGate';
import { maskCellPhone } from '../utils/whatsapp';
import { initialsOf } from '../components/Avatar';
import StudentCard from '../components/personal/StudentCard';
import PendingInvites from '../components/personal/PendingInvites';
import RiskAlerts from '../components/personal/RiskAlerts';
import TodayInbox from '../components/personal/TodayInbox';
import { daysUntil, getBilling } from '../services/billingService';
import { StudentsEmpty, StudentsError, StudentsSkeleton } from '../components/personal/ListStates';
import {
  CountUp,
  EASE_OUT,
  SPRING_PILL,
  riseItem,
  staggerContainer,
} from '../components/motion/primitives';
import { adherenceTone, toneRank, type AdherenceTone } from '../components/personal/adherence';
import type {
  BillingOverview,
  MonthlyStatsResponseDTO,
  StudentEngagement,
  TodayItem,
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

interface Row {
  link: TrainerLink;
  stats: MonthlyStatsResponseDTO | null | undefined;
  tone: AdherenceTone | null;
}

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

/** "Nome do Meio Sobrenome" → "Nome Sobrenome". */
const shortName = (nome: string) => {
  const parts = nome.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0] ?? '';
};

export default function StudentsListPage() {
  const { currentUser, signOut } = useAuth();
  const { phone, setPhone } = usePersonalPhone();
  const [phoneOpen, setPhoneOpen] = useState(false);

  const [students, setStudents] = useState<TrainerLink[]>([]);
  const [stats, setStats] = useState<StatsMap>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<TrainerInviteCode[]>([]);
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  /** Painel de aderência por aluno; null = carregando. */
  const [engagement, setEngagement] = useState<Record<string, StudentEngagement> | null>(null);
  /** Caixa "Hoje"; null = carregando ou falhou (a seção some). */
  const [today, setToday] = useState<TodayItem[] | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  // Relógio da saudação/data: atualiza com o painel aberto (virada de turno ou de dia).
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    // Convites por link são secundários: falha aqui não derruba a carteira.
    listInviteCodes()
      .then(setInviteCodes)
      .catch(() => setInviteCodes([]));
    // Plano também é secundário: sem ele só some o selo do cabeçalho.
    getBilling()
      .then(setBilling)
      .catch(() => setBilling(null));
    // Alertas de risco: falha aqui só esconde os alertas, não derruba a carteira.
    setEngagement(null);
    getEngagement()
      .then((list) => setEngagement(Object.fromEntries(list.map((e) => [e.studentId, e]))))
      .catch(() => setEngagement({}));
    getToday()
      .then(setToday)
      .catch(() => setToday(null));
    let links: TrainerLink[];
    try {
      links = await listStudents();
    } catch {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setStudents(links);
    setStats({});
    setLoading(false);

    // Aderência chega depois: os cards aparecem já e o anel anima quando o
    // dado do mês chega. Falha individual não derruba a lista.
    const results = await Promise.allSettled(
      links.map((l) => getStudentMonthlyStats(l.peer.id)),
    );
    const next: StatsMap = {};
    results.forEach((r, i) => {
      next[links[i].peer.id] = r.status === 'fulfilled' ? r.value : null;
    });
    setStats(next);
  };

  useEffect(() => {
    void load();
  }, []);

  const rows: Row[] = useMemo(
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
    ? students.filter((l) => (engagement[l.peer.id]?.risk ?? 'OK') !== 'OK').length
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
    setInviteCodes((list) => [invite, ...list]);
  };

  const handleInviteCodeChange = (id: string, next: TrainerInviteCode | null) => {
    setInviteCodes((list) =>
      next ? list.map((i) => (i.id === id ? next : i)) : list.filter((i) => i.id !== id),
    );
  };

  const handleInvited = (link: TrainerLink) => {
    toast.success(`Convite enviado para ${link.peer.nome}`, {
      description: 'O vínculo fica pendente até o aluno aceitar no app.',
    });
  };

  const firstName = currentUser?.nome.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-k-bg text-k-text">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-k-ghost bg-k-bg/85 px-8 py-3.5 backdrop-blur-[14px]">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-k-primary text-k-on-primary"
          >
            <Activity className="h-5 w-5 stroke-[2.5]" />
          </motion.div>
          <div className="leading-tight">
            <p className="font-display text-lg font-extrabold tracking-tight font-stretch-expanded">
              Kinetic
            </p>
            <p className="text-xs text-k-text-muted">Painel do Personal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/financeiro"
            className="hidden h-11 items-center gap-2 rounded-xl border border-white/10 bg-k-surface1 px-3 text-[13px] font-semibold text-k-text-dim transition-colors hover:border-k-primary/45 hover:text-k-primary md:flex"
          >
            <Wallet className="h-4 w-4" />
            Financeiro
          </Link>
          {billing && <PlanChip billing={billing} />}
          <div className="hidden items-center gap-2.5 border-r border-k-ghost pr-4 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-k-surface2 font-display text-[13px] font-extrabold text-k-primary">
              {initialsOf(currentUser?.nome ?? '')}
            </div>
            <div className="leading-tight">
              <p className="text-[13.5px] font-semibold">{shortName(currentUser?.nome ?? '')}</p>
              <p className="text-xs text-k-text-muted">Personal Trainer</p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={() => setInviteOpen(true)}
            whileTap={{ scale: 0.97 }}
            className="flex h-11 items-center gap-2 rounded-xl bg-k-primary px-[18px] text-sm font-bold text-k-on-primary transition-shadow hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_10px_26px_-10px_rgba(0,229,255,0.8)]"
          >
            <UserPlus className="h-[18px] w-[18px]" />
            Convidar aluno
          </motion.button>
          <button
            type="button"
            onClick={() => setPhoneOpen(true)}
            aria-label="Trocar meu WhatsApp"
            title="Trocar meu WhatsApp"
            className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-k-surface1 px-3 text-sm font-semibold text-k-text-dim transition-colors hover:border-k-primary/45 hover:text-k-primary active:scale-95"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            <span className="hidden md:inline">{phone ? maskCellPhone(phone) : 'Meu WhatsApp'}</span>
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Sair"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim transition-colors hover:border-k-alert/45 hover:text-k-alert active:scale-95"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-8 pb-16 pt-10">
          {/* Saudação + resumo em uma frase */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className="flex flex-wrap items-end justify-between gap-6"
          >
            <div className="min-w-0">
              <p className="text-[13px] text-k-text-muted">{todayLabel(now)}</p>
              <h1 className="mt-1.5 font-display text-[40px] font-extrabold leading-[1.08] tracking-[-0.02em] font-stretch-semi-expanded">
                {greetingFor(now.getHours())}
                {firstName ? `, ${firstName}` : ''}
              </h1>
              <p className="mt-2.5 max-w-[640px] text-[15.5px] text-k-text-dim">
                <HeroSummary
                  ready={!loading && !loadError && (riskCount !== null || students.length === 0)}
                  total={students.length}
                  attention={riskCount ?? 0}
                />
              </p>
            </div>
            {(riskCount ?? 0) > 0 && (
              <button
                type="button"
                onClick={scrollToAlerts}
                className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
              >
                <AlertTriangle className="h-[17px] w-[17px] text-k-alert" />
                Ver quem precisa de atenção
              </button>
            )}
          </motion.section>

          {/* Caixa de entrada: o que pede ação hoje */}
          {!loadError && today && <TodayInbox items={today} />}

          {/* Indicadores da carteira */}
          <motion.section
            aria-label="Resumo da carteira"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4"
          >
            <KpiTile
              label="Alunos ativos"
              icon={<Users className="h-[18px] w-[18px]" />}
              value={loading ? null : students.length}
              foot="Vinculados à sua carteira"
              onClick={() => setFilter('all')}
            />
            <KpiTile
              label="Aderência média"
              icon={<Award className="h-[18px] w-[18px]" />}
              value={statsReady && avgAdherence !== null ? avgAdherence : null}
              suffix="%"
              foot="Média do mês entre alunos com meta"
              progress={statsReady && avgAdherence !== null ? avgAdherence : 0}
            />
            <KpiTile
              label="Precisam de atenção"
              icon={<AlertTriangle className="h-[18px] w-[18px]" />}
              tone="alert"
              value={riskCount}
              foot="Inativos, sem treinar ou com queda"
              onClick={scrollToAlerts}
            />
          </motion.section>

          {/* Alertas de risco de abandono */}
          {!loading && !loadError && students.length > 0 && engagement && (
            <RiskAlerts students={students} engagement={engagement} trainerFirstName={firstName} />
          )}

          {/* Lista */}
          <section aria-label="Lista de alunos" className="flex flex-col gap-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.25 }}
              className="flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-baseline gap-2.5">
                <h2 className="font-display text-[22px] font-extrabold tracking-tight font-stretch-semi-expanded">
                  Seus alunos
                </h2>
                {!loading && !loadError && (
                  <span className="text-[13px] text-k-text-muted">
                    {visible.length} de {rows.length}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="relative flex items-center">
                  <span className="sr-only">Buscar aluno</span>
                  <Search className="pointer-events-none absolute left-3.5 h-[17px] w-[17px] text-k-text-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nome ou e-mail"
                    className="h-11 w-[280px] max-w-full rounded-xl border border-white/10 bg-k-surface1 pl-10 pr-3.5 text-sm transition-[border-color,box-shadow] placeholder:text-k-text-muted focus:border-k-primary focus:shadow-[0_0_0_4px_rgba(0,229,255,0.12)]"
                  />
                </label>

                <div
                  role="group"
                  aria-label="Filtrar alunos por aderência"
                  className="flex gap-1 rounded-[14px] border border-k-ghost bg-k-surface1 p-1"
                >
                  {FILTERS.map((f) => {
                    const active = filter === f.id;
                    const count = f.id === 'all' || statsReady ? String(counts[f.id]) : '–';
                    return (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilter(f.id)}
                        className={`relative flex h-9 items-center gap-2 rounded-[10px] px-3 text-[13px] font-semibold transition-colors ${
                          active ? 'text-k-primary' : 'text-k-text-dim hover:text-k-text'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="students-filter-pill"
                            transition={SPRING_PILL}
                            className="absolute inset-0 rounded-[10px] bg-k-primary-dim shadow-[inset_0_0_0_1px_rgba(0,229,255,0.25)]"
                          />
                        )}
                        <span className="relative">{f.label}</span>
                        <span
                          className={`relative flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11.5px] ${
                            active ? 'bg-k-primary-soft' : 'bg-k-ghost'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {loading ? (
              <StudentsSkeleton />
            ) : loadError ? (
              <StudentsError onRetry={() => void load()} />
            ) : students.length === 0 ? (
              <StudentsEmpty onInvite={() => setInviteOpen(true)} />
            ) : (
              <>
                <AnimatePresence>
                  {visible.length === 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-[18px] border border-dashed border-white/[0.14] p-10 text-center text-k-text-muted"
                    >
                      Nenhum aluno encontrado com esse filtro.
                    </motion.p>
                  )}
                </AnimatePresence>
                <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  <AnimatePresence>
                    {visible.map((row, i) => (
                      <StudentCard
                        key={row.link.id}
                        link={row.link}
                        engagement={engagement?.[row.link.peer.id]}
                        stats={row.stats}
                        tone={row.tone}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                  <motion.button
                    layout
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 }}
                    className="group flex min-h-[152px] flex-col items-center justify-center gap-2.5 rounded-[18px] border-[1.5px] border-dashed border-white/[0.16] text-sm font-semibold text-k-text-dim transition-colors hover:border-k-primary hover:bg-k-primary/[0.06] hover:text-k-primary"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:rotate-90">
                      <Plus className="h-5 w-5" />
                    </span>
                    Convidar novo aluno
                  </motion.button>
                </motion.div>
              </>
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

/** Selo do plano no cabeçalho: leva para "Meu plano". */
function PlanChip({ billing }: { billing: BillingOverview }) {
  const trialDays = daysUntil(billing.trialEndsAt);
  let text: string;
  let alert = false;
  switch (billing.status) {
    case 'TRIAL':
      text = trialDays > 0 ? `Teste grátis · ${trialDays}d` : 'Teste encerrado';
      alert = trialDays <= 3;
      break;
    case 'PENDENTE':
      text = 'Pagamento pendente';
      alert = true;
      break;
    case 'ATIVA':
      text = `Plano ${billing.planName}`;
      break;
    case 'ATRASADA':
      text = 'Pagamento atrasado';
      alert = true;
      break;
    default:
      text = daysUntil(billing.currentPeriodEnd) > 0 ? `Plano ${billing.planName} · cancelado` : 'Sem plano';
      alert = true;
  }
  return (
    <Link
      to="/assinatura"
      title={`${billing.activeStudents} de ${billing.studentLimit} alunos ativos`}
      className={`hidden h-11 items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition-colors md:flex ${
        alert
          ? 'border-k-warn/35 bg-k-warn/10 text-k-warn hover:bg-k-warn/[0.16]'
          : 'border-white/10 bg-k-surface1 text-k-text-dim hover:border-k-primary/45 hover:text-k-primary'
      }`}
    >
      <CreditCard className="h-4 w-4" />
      {text}
      <span className="text-k-text-muted">
        {billing.activeStudents}/{billing.studentLimit}
      </span>
    </Link>
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

function KpiTile({
  label,
  icon,
  value,
  suffix,
  foot,
  tone = 'primary',
  progress,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  /** null = ainda carregando (mostra traço). */
  value: number | null;
  suffix?: string;
  foot: string;
  tone?: 'primary' | 'alert';
  /** 0–100: mostra uma barra de progresso abaixo do número. */
  progress?: number;
  onClick?: () => void;
}) {
  const iconTone =
    tone === 'alert' ? 'bg-k-alert/[0.12] text-k-alert' : 'bg-k-primary-dim text-k-primary';

  const body = (
    <>
      <span className="flex w-full items-center justify-between">
        <span className="text-[13px] font-medium text-k-text-dim">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[11px] ${iconTone}`}>
          {icon}
        </span>
      </span>
      <span className="flex items-baseline gap-0.5">
        {value === null ? (
          <span className="font-display text-[38px] font-extrabold leading-none text-k-text-muted">—</span>
        ) : (
          <CountUp
            value={value}
            format={(v) => String(Math.round(v))}
            className="font-display text-[38px] font-extrabold leading-none tabular-nums font-stretch-semi-expanded"
          />
        )}
        {suffix && value !== null && (
          <span className="font-display text-xl font-bold text-k-text-muted">{suffix}</span>
        )}
      </span>
      {progress !== undefined && (
        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <motion.span
            className="block h-full rounded-full bg-k-primary"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            transition={{ duration: 1.1, ease: EASE_OUT }}
          />
        </span>
      )}
      <span className="text-[12.5px] text-k-text-muted">{foot}</span>
    </>
  );

  const className =
    'flex flex-col gap-3.5 rounded-[18px] border border-k-ghost bg-k-surface1 p-5 text-left transition-[translate,border-color,background-color] duration-300 hover:-translate-y-[3px] hover:border-white/[0.16]';

  return onClick ? (
    <motion.button
      type="button"
      variants={riseItem}
      onClick={onClick}
      className={`${className} cursor-pointer hover:bg-[#202020]`}
    >
      {body}
    </motion.button>
  ) : (
    <motion.div variants={riseItem} className={className}>
      {body}
    </motion.div>
  );
}
