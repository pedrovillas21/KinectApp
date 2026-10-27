import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  BarChart3,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { getStudentPlanEvolution, getStudentStats } from '../services/trainerService';
import { qk } from '../services/queryClient';
import {
  CountUp,
  EASE_OUT,
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

const TILE = 'rounded-xl border border-white/[0.08]';

const tooltipStyle = {
  background: '#2a2a2a',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#f5f6f7',
  padding: '6px 10px',
};

export default function DashboardTab({ studentId, studentFirstName }: Props) {
  const [period, setPeriod] = useState<StatsPeriodId>('month');
  // Ao trocar de período os dados antigos ficam na tela (esmaecidos) e os
  // números animam até os novos; ao trocar de aluno, esqueleto (nada do anterior).
  const statsQ = useQuery({
    queryKey: qk.studentStats(studentId, period),
    queryFn: () => getStudentStats(studentId, period),
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[2] === studentId ? prev : undefined),
  });
  // Evolução do ciclo não depende do período.
  const evolutionQ = useQuery({
    queryKey: qk.planEvolution(studentId),
    queryFn: () => getStudentPlanEvolution(studentId),
  });
  const stats = statsQ.data ?? null;
  const evolution = evolutionQ.data ?? null;
  const evoLoading = evolutionQ.isPending;
  const error = statsQ.isError ? 'Não foi possível carregar as estatísticas deste aluno.' : null;
  const retry = () => void statsQ.refetch();

  const refreshing = statsQ.isPlaceholderData;

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-4 md:px-8 pb-12 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold">Desempenho</h2>
          <p className="mt-0.5 text-[13px] text-k-text-muted">
            Dados registrados por {studentFirstName} no app Kinetic
          </p>
        </div>
        <div
          role="group"
          aria-label="Período de análise"
          className="flex gap-0.5 rounded-lg border border-white/[0.08] p-0.5 max-sm:w-full"
        >
          {PERIODS.map((p) => {
            const active = p.id === period;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPeriod(p.id)}
                className={`relative h-8 rounded-md px-3.5 text-[13px] transition-colors max-sm:flex-1 ${
                  active ? 'text-k-text' : 'text-k-text-dim hover:text-k-text'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="dashboard-period-pill"
                    transition={SPRING_PILL}
                    className="absolute inset-0 rounded-md bg-white/[0.08]"
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
            onClick={retry}
            className="font-semibold underline-offset-2 hover:underline"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {!stats && error ? (
        <ErrorCard message={error} onRetry={retry} />
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
        <DeltaPill value={weight.delta} suffix=" kg" good={null} /> no período
      </>
    ) : weight.history.length === 1 ? (
      'Uma pesagem no período'
    ) : weight.current > 0 ? (
      'Último peso informado no perfil'
    ) : (
      'Nenhuma pesagem registrada'
    );

  return (
    <motion.section
      variants={riseItem}
      aria-label="Indicadores do período"
      className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-3"
    >
      <KpiCell
        label="Aderência ao plano"
        value={hasPlan ? nf0.format(stats.efficiencyPercentage) : '—'}
        unit={hasPlan ? '%' : undefined}
        progress={hasPlan ? stats.efficiencyPercentage : undefined}
        foot={
          hasPlan ? (
            <>
              <span className="font-mono text-k-text-soft">{nf0.format(stats.completedSessions)}</span> de{' '}
              <span className="font-mono">{nf0.format(stats.targetSessions)}</span> treinos planejados
            </>
          ) : (
            'Aluno sem frequência semanal definida'
          )
        }
      />
      <KpiCell
        label="Tonelagem total"
        value={nf0.format(volume.total)}
        unit="kg"
        foot={
          volume.total > 0 ? (
            <>
              <DeltaPill value={volume.deltaPercentage} suffix="%" good={volume.deltaPercentage >= 0} /> vs. período
              anterior
            </>
          ) : (
            'Nenhum treino no período'
          )
        }
      />
      <KpiCell
        label="Peso corporal"
        value={weight.current > 0 ? nf1.format(weight.current) : '—'}
        unit={weight.current > 0 ? 'kg' : undefined}
        foot={
          <>
            {weightFoot}
            {stats.needsWeightUpdate && <span className="text-k-warn"> · pesagem pendente</span>}
          </>
        }
      />
    </motion.section>
  );
}

function KpiCell({
  label,
  value,
  unit,
  foot,
  progress,
}: {
  label: string;
  value: string;
  unit?: string;
  foot: ReactNode;
  progress?: number;
}) {
  return (
    <div className="flex flex-col gap-2.5 bg-k-bg p-4 md:p-5">
      <span className="text-[13px] text-k-text-muted">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-mono text-[26px] font-medium leading-[30px] tabular-nums md:text-[30px] md:leading-[34px]">{value}</span>
        {unit && <span className="font-mono text-k-text-muted">{unit}</span>}
      </span>
      {progress !== undefined && (
        <span className="block h-1 rounded-full bg-white/[0.08]">
          <span
            className="block h-1 rounded-full bg-k-primary transition-[width] duration-700"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </span>
      )}
      <span className="text-xs text-k-text-muted">{foot}</span>
    </div>
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
  // Seta + sinal: a direção não depende só da cor.
  const tone =
    good === null || value === 0 ? 'text-k-text-soft' : good ? 'text-k-success' : 'text-[#ff8a8a]';
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : '=';
  return (
    <span className={`whitespace-nowrap font-mono ${tone}`}>
      {arrow} {signed(value)}
      {suffix}
    </span>
  );
}

// ─── Destaque (insight do motor de regras) ───────────────────────────────────

function Insight({ stats }: { stats: StatsSummaryResponseDTO }) {
  if (!stats.insight?.body) return null;
  return (
    <motion.div variants={riseItem} className="flex flex-col gap-1.5 rounded-xl border border-white/[0.08] px-5 py-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-k-text-muted">{stats.insight.tag}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={stats.insight.body}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-[15px] leading-relaxed"
        >
          {stats.insight.body}
        </motion.p>
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
      <motion.section variants={riseItem} className={`${TILE} flex flex-col gap-[18px] p-4 sm:p-[22px]`}>
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
                  className="-mx-1.5 grid grid-cols-[64px_minmax(0,1fr)_76px_44px] items-center gap-2.5 sm:grid-cols-[72px_minmax(0,1fr)_92px_48px] sm:gap-3 rounded-[10px] px-1.5 py-[5px] transition-colors hover:bg-white/[0.035]"
                >
                  <span className="truncate text-[13px] font-semibold text-k-text-soft" title={g.muscleGroup}>
                    {groupLabel(g.muscleGroup)}
                  </span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
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
                    className="text-right font-mono text-[13px] tabular-nums"
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

      <motion.section variants={riseItem} className={`${TILE} flex flex-col gap-3.5 p-4 sm:p-[22px]`}>
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
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-0.5 text-xs text-k-text-muted">{subtitle}</p>
    </div>
  );
}

function CompactEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-white/10 px-5 py-8 text-center text-[13px] leading-relaxed text-k-text-muted">
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
    <motion.section variants={riseItem} className={`${TILE} flex flex-col`}>
      <div className="border-b border-white/[0.07] px-5 py-3.5">
        <CardTitle title="Ciclo atual vs. anterior" subtitle={subtitle} />
      </div>

      {loading && !evolution ? (
        <div className="k-skeleton m-5 h-[160px] rounded-lg bg-[#181818]" />
      ) : !evolution?.available ? (
        <div className="p-5">
          <CompactEmpty>
            A ficha de {firstName} ainda não foi atualizada nem regenerada, então não há ciclo anterior para
            comparar.
          </CompactEmpty>
        </div>
      ) : !started ? (
        <div className="p-5">
          <CompactEmpty>O novo ciclo foi gerado, mas {firstName} ainda não registrou sessões nele.</CompactEmpty>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse text-[13px]">
              <thead>
                <tr className="text-xs text-k-text-muted">
                  <th scope="col" className="px-4 py-2.5 text-left font-medium md:px-5">Métrica</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Anterior</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Atual</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                <CycleRow label="Aderência ao plano" metric={evolution.adherence} format={(v) => `${nf0.format(v)}%`} deltaSuffix=" p.p." />
                <CycleRow label="Volume de carga" metric={evolution.volume} format={(v) => `${nf0.format(v)} kg`} deltaSuffix=" kg" />
                <CycleRow
                  label="Treinos concluídos"
                  metric={{
                    previous: evolution.previousCompletedSessions,
                    current: evolution.currentCompletedSessions,
                    delta: evolution.currentCompletedSessions - evolution.previousCompletedSessions,
                    good: evolution.currentCompletedSessions >= evolution.previousCompletedSessions,
                  }}
                  format={(v) => nf0.format(v)}
                  deltaSuffix=""
                />
                <CycleRow label="Peso corporal" metric={evolution.weight} format={(v) => `${nf1.format(v)} kg`} deltaSuffix=" kg" />
              </tbody>
            </table>
          </div>
          {evolution.insight?.body && (
            <div className="flex items-start gap-2.5 border-t border-white/[0.07] px-5 py-3.5">
              {allGood ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-k-success" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-k-warn" />
              )}
              <p className="text-[13px] leading-relaxed text-k-text-soft">{evolution.insight.body}</p>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}

function CycleRow({
  label,
  metric,
  format,
  deltaSuffix,
}: {
  label: string;
  metric: Pick<MetricDeltaDTO, 'previous' | 'current' | 'delta' | 'good'> | null;
  format: (v: number) => string;
  deltaSuffix: string;
}) {
  if (!metric) return null;
  return (
    <tr>
      <th scope="row" className="px-4 py-3 text-left font-normal md:px-5">{label}</th>
      <td className="px-3 py-3 text-right font-mono text-k-text-muted">{format(metric.previous)}</td>
      <td className="px-3 py-3 text-right font-mono">{format(metric.current)}</td>
      <td className="px-5 py-3 text-right">
        <DeltaPill value={metric.delta} suffix={deltaSuffix} good={metric.good} />
      </td>
    </tr>
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
            className="k-skeleton h-[136px] rounded-xl border border-white/[0.06] bg-k-surface1"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <div className="k-skeleton h-[78px] rounded-xl bg-k-primary/[0.04]" />
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="k-skeleton h-[300px] rounded-xl border border-white/[0.06] bg-k-surface1"
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
      className="flex flex-col items-center gap-4 rounded-xl border border-k-alert/25 bg-k-surface1 px-6 py-12 text-center"
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
