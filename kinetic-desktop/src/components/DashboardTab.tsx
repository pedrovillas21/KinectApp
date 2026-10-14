import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Minus,
  RefreshCw,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { getStudentPlanEvolution, getStudentStats } from '../services/trainerService';
import {
  CountUp,
  EASE_OUT,
  ProgressRing,
  SPRING_PILL,
  riseItem,
  staggerContainer,
} from './motion/primitives';
import type {
  MetricDeltaDTO,
  PlanEvolutionResponseDTO,
  StatsPeriodId,
  StatsSummaryResponseDTO,
} from '../types';

interface Props {
  studentId: string;
  studentFirstName: string;
  /** Avisa o pai da meta do aluno (vem da evolução do plano) para o cabeçalho. */
  onGoal?: (goal: string | null) => void;
}

const PERIODS: { id: StatsPeriodId; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'q', label: 'Trimestre' },
  { id: 'year', label: 'Ano' },
];

const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfDelta = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${nfDelta.format(Math.abs(v))}`;

/** PUSH/PULL/PERNAS/CORE → Push/Pull/Pernas/Core. */
const groupLabel = (g: string) => g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();

const formatShortDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const TILE = 'rounded-[20px] border border-k-ghost bg-k-surface1 transition-[translate,border-color] duration-300 hover:-translate-y-[3px] hover:border-white/[0.16]';

const tooltipStyle = {
  background: '#2a2a2a',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#f5f6f7',
  padding: '6px 10px',
};

export default function DashboardTab({ studentId, studentFirstName, onGoal }: Props) {
  const [period, setPeriod] = useState<StatsPeriodId>('month');
  const [stats, setStats] = useState<StatsSummaryResponseDTO | null>(null);
  const [evolution, setEvolution] = useState<PlanEvolutionResponseDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [evoLoading, setEvoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Troca de aluno: zera tudo para mostrar o esqueleto, não dados do anterior.
  useEffect(() => {
    setStats(null);
    setEvolution(null);
  }, [studentId]);

  // Estatísticas do período. Ao trocar de período os dados antigos ficam na
  // tela (esmaecidos) e os números animam até os novos — sem "pulo".
  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    setError(null);
    getStudentStats(studentId, period)
      .then((summary) => {
        if (!cancelled) setStats(summary);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar as estatísticas deste aluno.');
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, period, reloadKey]);

  // Evolução do ciclo não depende do período.
  useEffect(() => {
    let cancelled = false;
    setEvoLoading(true);
    getStudentPlanEvolution(studentId)
      .then((evo) => {
        if (cancelled) return;
        setEvolution(evo);
        onGoal?.(evo.goal);
      })
      .catch(() => {
        if (!cancelled) setEvolution(null);
      })
      .finally(() => {
        if (!cancelled) setEvoLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // onGoal é um setState do pai (estável); não precisa refazer a busca por ele.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, reloadKey]);

  const refreshing = statsLoading && stats !== null;

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-8 py-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-tight font-stretch-semi-expanded">
            Desempenho
          </h2>
          <p className="mt-0.5 text-[13px] text-k-text-muted">
            Dados registrados por {studentFirstName} no app Kinetic
          </p>
        </div>
        <div
          role="group"
          aria-label="Período de análise"
          className="flex rounded-[14px] border border-k-ghost bg-k-surface1 p-1"
        >
          {PERIODS.map((p) => {
            const active = p.id === period;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPeriod(p.id)}
                className={`relative h-[38px] w-[92px] rounded-[10px] text-[13px] font-semibold transition-colors ${
                  active ? 'text-k-primary' : 'text-k-text-muted hover:text-k-text'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="dashboard-period-pill"
                    transition={SPRING_PILL}
                    className="absolute inset-0 rounded-[10px] bg-k-primary/[0.12] shadow-[inset_0_0_0_1px_rgba(0,229,255,0.28)]"
                  />
                )}
                <span className="relative">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && stats && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-k-alert/25 bg-k-alert/[0.08] px-4 py-3 text-[13px] text-k-alert"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Não foi possível atualizar o período.
          </span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="font-semibold underline-offset-2 hover:underline"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {!stats && error ? (
        <ErrorCard message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : !stats ? (
        <DashboardSkeleton />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          aria-busy={refreshing}
          className={`flex flex-col gap-5 transition-opacity duration-300 ${refreshing ? 'opacity-60' : ''}`}
        >
          <KpiRow stats={stats} />
          <Insight stats={stats} />
          <Charts stats={stats} firstName={studentFirstName} />
          <CycleComparison
            evolution={evolution}
            loading={evoLoading}
            firstName={studentFirstName}
          />
        </motion.div>
      )}
    </div>
  );
}

// ─── Indicadores ─────────────────────────────────────────────────────────────

function KpiRow({ stats }: { stats: StatsSummaryResponseDTO }) {
  const hasPlan = stats.targetSessions > 0;
  const { weight, volume } = stats;

  const weightFoot =
    weight.history.length > 1 ? (
      <>
        <DeltaPill value={weight.delta} suffix=" kg" good={null} />
        <span className="text-[12.5px] text-k-text-muted">no período</span>
      </>
    ) : (
      <span className="text-[12.5px] text-k-text-muted">
        {weight.history.length === 1
          ? 'Uma pesagem no período'
          : weight.current > 0
            ? 'Último peso informado no perfil'
            : 'Nenhuma pesagem registrada'}
      </span>
    );

  return (
    <section aria-label="Indicadores do período" className="grid gap-4 md:grid-cols-3">
      <motion.div variants={riseItem} className={`${TILE} flex items-center gap-[18px] p-5`}>
        <ProgressRing value={stats.efficiencyPercentage} size={96} stroke={9} glow>
          <CountUp
            value={stats.efficiencyPercentage}
            format={(v) => `${Math.round(v)}%`}
            className="font-display text-2xl font-extrabold tabular-nums font-stretch-semi-expanded"
          />
        </ProgressRing>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] font-medium text-k-text-dim">Aderência ao plano</span>
          {hasPlan ? (
            <>
              <span className="flex items-baseline gap-1.5">
                <CountUp
                  value={stats.completedSessions}
                  format={(v) => nf0.format(Math.round(v))}
                  className="font-display text-[30px] font-extrabold leading-tight tabular-nums"
                />
                <span className="text-sm font-semibold text-k-text-muted">
                  de {nf0.format(stats.targetSessions)}
                </span>
              </span>
              <span className="text-[12.5px] text-k-text-muted">treinos planejados concluídos</span>
            </>
          ) : (
            <span className="text-[12.5px] text-k-text-muted">
              Aluno sem frequência semanal definida
            </span>
          )}
        </div>
      </motion.div>

      <motion.div variants={riseItem} className={`${TILE} flex flex-col gap-3 p-5`}>
        <TileHeader label="Tonelagem total" icon={<BarChart3 className="h-[18px] w-[18px]" />} />
        <span className="flex items-baseline gap-1.5">
          <CountUp
            value={volume.total}
            format={(v) => nf0.format(Math.round(v))}
            className="font-display text-[34px] font-extrabold leading-tight tabular-nums font-stretch-semi-expanded"
          />
          <span className="text-base font-semibold text-k-text-muted">kg</span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {volume.total > 0 ? (
            <>
              <DeltaPill
                value={volume.deltaPercentage}
                suffix="%"
                good={volume.deltaPercentage >= 0}
              />
              <span className="text-[12.5px] text-k-text-muted">vs. período anterior</span>
            </>
          ) : (
            <span className="text-[12.5px] text-k-text-muted">Nenhum treino no período</span>
          )}
        </span>
      </motion.div>

      <motion.div variants={riseItem} className={`${TILE} flex flex-col gap-3 p-5`}>
        <TileHeader label="Peso corporal" icon={<Scale className="h-[18px] w-[18px]" />} />
        <span className="flex items-baseline gap-1.5">
          {weight.current > 0 ? (
            <>
              <CountUp
                value={weight.current}
                format={(v) => nf1.format(v)}
                className="font-display text-[34px] font-extrabold leading-tight tabular-nums font-stretch-semi-expanded"
              />
              <span className="text-base font-semibold text-k-text-muted">kg</span>
            </>
          ) : (
            <span className="font-display text-[34px] font-extrabold leading-tight text-k-text-muted">—</span>
          )}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {weightFoot}
          {stats.needsWeightUpdate && (
            <span className="inline-flex h-6 items-center rounded-full bg-k-warn/[0.12] px-2 text-xs font-bold text-k-warn">
              Pesagem pendente
            </span>
          )}
        </span>
      </motion.div>
    </section>
  );
}

function TileHeader({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <span className="flex items-center justify-between">
      <span className="text-[13px] font-medium text-k-text-dim">{label}</span>
      <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-k-primary-dim text-k-primary">
        {icon}
      </span>
    </span>
  );
}

function DeltaPill({
  value,
  suffix,
  good,
}: {
  value: number;
  suffix: string;
  /** null = neutro (a direção boa depende do objetivo e não foi informada). */
  good: boolean | null;
}) {
  const tone =
    good === null || value === 0
      ? 'bg-white/[0.08] text-k-text-soft'
      : good
        ? 'bg-k-success/[0.12] text-k-success'
        : 'bg-k-alert/[0.12] text-k-alert';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-bold ${tone}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {signed(value)}
      {suffix}
    </span>
  );
}

// ─── Destaque (insight do motor de regras) ───────────────────────────────────

function Insight({ stats }: { stats: StatsSummaryResponseDTO }) {
  if (!stats.insight?.body) return null;
  return (
    <motion.div
      variants={riseItem}
      className="flex items-start gap-4 rounded-[18px] border border-k-primary/[0.22] bg-k-primary/[0.06] px-5 py-[18px]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-k-primary/[0.12] text-k-primary">
        <Sparkles className="k-twinkle h-[19px] w-[19px]" />
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stats.insight.body}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="min-w-0"
        >
          <span className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-k-primary">
            {stats.insight.tag}
          </span>
          <p className="mt-1 text-sm leading-relaxed text-k-text-soft">{stats.insight.body}</p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Gráficos ────────────────────────────────────────────────────────────────

function Charts({ stats, firstName }: { stats: StatsSummaryResponseDTO; firstName: string }) {
  const volumeData = stats.volume.byMuscleGroup
    .filter((g) => !g.isRest && g.volume > 0)
    .sort((a, b) => b.volume - a.volume);
  const weightData = stats.weight.history.map((p) => ({
    date: formatShortDate(p.date),
    peso: p.weight,
  }));

  // Sem nenhum dado: um aviso compacto em vez de dois gráficos vazios.
  if (volumeData.length === 0 && weightData.length < 2) {
    return (
      <motion.div variants={riseItem} className={`${TILE} flex items-center gap-4 p-5`}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-k-surface2 text-k-text-muted">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-k-text-soft">
            Sem treinos nem pesagens suficientes neste período
          </p>
          <p className="mt-0.5 text-[12.5px] text-k-text-muted">
            Quando {firstName} registrar treinos ou o peso no app, os gráficos de volume e de
            evolução aparecem aqui.
          </p>
        </div>
      </motion.div>
    );
  }

  const maxVolume = volumeData[0]?.volume ?? 1;
  const top = volumeData[0];
  const share = top && stats.volume.total > 0 ? Math.round((top.volume / stats.volume.total) * 100) : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <motion.section variants={riseItem} className={`${TILE} flex flex-col gap-[18px] p-[22px]`}>
        <CardTitle title="Volume por grupo muscular" subtitle="Carga acumulada no período e variação" />
        {volumeData.length === 0 ? (
          <CompactEmpty>Nenhum treino registrado por {firstName} no período.</CompactEmpty>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              {volumeData.map((g, i) => (
                <motion.div
                  layout
                  key={g.muscleGroup}
                  className="-mx-1.5 grid grid-cols-[72px_minmax(0,1fr)_92px_48px] items-center gap-3 rounded-[10px] px-1.5 py-[5px] transition-colors hover:bg-white/[0.035]"
                >
                  <span className="truncate text-[13px] font-semibold text-k-text-soft" title={g.muscleGroup}>
                    {groupLabel(g.muscleGroup)}
                  </span>
                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: i === 0 ? '#00e5ff' : '#00a5b8' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(g.volume / maxVolume) * 100}%` }}
                      transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 + i * 0.06 }}
                    />
                  </div>
                  <CountUp
                    value={g.volume}
                    format={(v) => `${nf0.format(Math.round(v))} kg`}
                    className="text-right text-[13px] font-semibold tabular-nums"
                  />
                  <span
                    className={`text-right text-xs font-bold ${
                      g.deltaPercentage > 0
                        ? 'text-k-success'
                        : g.deltaPercentage < 0
                          ? 'text-k-alert'
                          : 'text-k-text-muted'
                    }`}
                  >
                    {signed(g.deltaPercentage)}%
                  </span>
                </motion.div>
              ))}
            </div>
            {top && (
              <p className="border-t border-white/[0.06] pt-3.5 text-[12.5px] text-k-text-muted">
                {groupLabel(top.muscleGroup)} concentra {share}% da carga total no período.
              </p>
            )}
          </>
        )}
      </motion.section>

      <motion.section variants={riseItem} className={`${TILE} flex flex-col gap-3.5 p-[22px]`}>
        <div className="flex items-start justify-between gap-3">
          <CardTitle title="Evolução do peso" subtitle="Pesagens registradas no período" />
          {weightData.length > 0 && (
            <span className="whitespace-nowrap text-xs text-k-text-muted">
              {weightData.length} {weightData.length === 1 ? 'pesagem' : 'pesagens'}
            </span>
          )}
        </div>
        {weightData.length < 2 ? (
          <CompactEmpty>
            {weightData.length === 1
              ? 'Só uma pesagem no período: a curva aparece a partir de duas.'
              : `Nenhuma pesagem registrada por ${firstName} neste período.`}
          </CompactEmpty>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData} margin={{ top: 16, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#8e8f90', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tick={{ fill: '#8e8f90', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(v: number) => nf1.format(v)}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(0,229,255,0.35)', strokeWidth: 1 }}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: '#8e8f90' }}
                  formatter={(value) => [`${nf1.format(Number(value))} kg`, 'Peso']}
                />
                <Area
                  type="monotone"
                  dataKey="peso"
                  stroke="#00e5ff"
                  strokeWidth={2.5}
                  fill="rgba(0,229,255,0.08)"
                  dot={{ r: 4, fill: '#00e5ff', stroke: '#1c1b1b', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#00e5ff', stroke: '#1c1b1b', strokeWidth: 2 }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.section>
    </div>
  );
}

function CardTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="font-display text-base font-bold font-stretch-semi-expanded">{title}</h3>
      <p className="mt-0.5 text-[12.5px] text-k-text-muted">{subtitle}</p>
    </div>
  );
}

function CompactEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-[13px] leading-relaxed text-k-text-muted">
      {children}
    </p>
  );
}

// ─── Ciclo atual vs. anterior ────────────────────────────────────────────────

function CycleComparison({
  evolution,
  loading,
  firstName,
}: {
  evolution: PlanEvolutionResponseDTO | null;
  loading: boolean;
  firstName: string;
}) {
  const started = !!evolution?.available && evolution.currentCycleStarted;
  const subtitle = [
    'Desde a última regeneração da ficha',
    evolution?.currentCycleStart ? `, em ${formatShortDate(evolution.currentCycleStart)}` : '',
    evolution?.goal ? ` · Meta: ${evolution.goal}` : '',
  ].join('');

  const metrics = [evolution?.weight, evolution?.volume, evolution?.adherence];
  const allGood = metrics.every((m) => !m || m.good);

  return (
    <motion.section variants={riseItem} className={`${TILE} flex flex-col gap-[18px] p-[22px]`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <CardTitle title="Ciclo atual vs. anterior" subtitle={subtitle} />
        {started && evolution && (
          <div className="flex h-9 items-center gap-2.5 rounded-xl bg-[#242424] px-3">
            <span className="text-[12.5px] text-k-text-dim">Treinos concluídos</span>
            <span className="text-[13px] font-semibold text-k-text-dim">
              {evolution.previousCompletedSessions}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-k-text-dim" aria-label="para" />
            <span className="font-display text-sm font-extrabold text-k-primary">
              {evolution.currentCompletedSessions}
            </span>
          </div>
        )}
      </div>

      {loading && !evolution ? (
        <div className="grid gap-3.5 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="k-skeleton h-[118px] rounded-2xl bg-[#181818]" />
          ))}
        </div>
      ) : !evolution?.available ? (
        <CompactEmpty>
          A ficha de {firstName} ainda não foi atualizada nem regenerada, então não há ciclo
          anterior para comparar.
        </CompactEmpty>
      ) : !evolution.currentCycleStarted ? (
        <CompactEmpty>
          O novo ciclo foi gerado, mas {firstName} ainda não registrou sessões nele.
        </CompactEmpty>
      ) : (
        <>
          <div className="grid gap-3.5 md:grid-cols-3">
            <CycleMetric
              label="Peso corporal"
              metric={evolution.weight}
              format={(v) => `${nf1.format(v)} kg`}
              deltaSuffix=" kg"
            />
            <CycleMetric
              label="Volume de carga"
              metric={evolution.volume}
              format={(v) => `${nf0.format(v)} kg`}
              deltaSuffix=" kg"
            />
            <CycleMetric
              label="Aderência ao plano"
              metric={evolution.adherence}
              format={(v) => `${nf0.format(v)}%`}
              deltaSuffix=" p.p."
            />
          </div>
          {evolution.insight?.body && (
            <div
              className={`flex items-start gap-3 rounded-[14px] border px-4 py-3.5 ${
                allGood
                  ? 'border-k-success/20 bg-k-success/[0.06]'
                  : 'border-k-warn/20 bg-k-warn/[0.06]'
              }`}
            >
              {allGood ? (
                <CheckCircle2 className="mt-px h-[18px] w-[18px] shrink-0 text-k-success" />
              ) : (
                <AlertTriangle className="mt-px h-[18px] w-[18px] shrink-0 text-k-warn" />
              )}
              <p className="text-[13.5px] leading-relaxed text-k-text-soft">{evolution.insight.body}</p>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}

function CycleMetric({
  label,
  metric,
  format,
  deltaSuffix,
}: {
  label: string;
  metric: MetricDeltaDTO | null;
  format: (v: number) => string;
  deltaSuffix: string;
}) {
  if (!metric) return null;
  const top = Math.max(Math.abs(metric.previous), Math.abs(metric.current)) || 1;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#181818] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-k-text-soft">{label}</span>
        <DeltaPill value={metric.delta} suffix={deltaSuffix} good={metric.good} />
      </div>
      <CompareBar
        label="Anterior"
        pct={(Math.abs(metric.previous) / top) * 100}
        text={format(metric.previous)}
        color="#6b6c6d"
      />
      <CompareBar
        label="Atual"
        pct={(Math.abs(metric.current) / top) * 100}
        text={format(metric.current)}
        color="#00e5ff"
        strong
        delay={0.15}
      />
    </div>
  );
}

function CompareBar({
  label,
  pct,
  text,
  color,
  strong = false,
  delay = 0,
}: {
  label: string;
  pct: number;
  text: string;
  color: string;
  strong?: boolean;
  delay?: number;
}) {
  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-2.5">
      <span className={`text-xs ${strong ? 'font-semibold text-k-text-soft' : 'text-k-text-muted'}`}>{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: EASE_OUT, delay: 0.3 + delay }}
        />
      </div>
      <span
        className={`text-right tabular-nums ${strong ? 'text-[13px] font-bold' : 'text-[12.5px] text-k-text-dim'}`}
      >
        {text}
      </span>
    </div>
  );
}

// ─── Estados ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Carregando estatísticas" className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="k-skeleton h-[136px] rounded-[20px] border border-white/[0.06] bg-k-surface1"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <div className="k-skeleton h-[78px] rounded-[18px] bg-k-primary/[0.04]" />
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="k-skeleton h-[300px] rounded-[20px] border border-white/[0.06] bg-k-surface1"
            style={{ animationDelay: `${(i + 3) * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-[20px] border border-k-alert/25 bg-k-surface1 px-6 py-12 text-center"
    >
      <AlertCircle className="h-8 w-8 text-k-alert" />
      <p className="text-sm font-semibold">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="group flex h-11 items-center gap-2 rounded-xl border border-white/[0.14] bg-k-surface1 px-4 text-sm font-semibold transition-colors hover:bg-k-surface2"
      >
        <RefreshCw className="h-4 w-4 text-k-primary transition-transform duration-500 group-hover:rotate-180" />
        Tentar novamente
      </button>
    </div>
  );
}
