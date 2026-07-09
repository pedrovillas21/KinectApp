import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getStudentPlanEvolution,
  getStudentStats,
} from '../services/trainerService';
import { KINETIC } from '../theme/kinetic';
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

// Cor de marca dos gráficos: passo mais escuro do ciano Kinetic, validado
// pela skill dataviz para a superfície #131313 (o #00E5FF puro fica acima da
// banda de luminosidade para marcas em dark — reservado aos acentos de UI).
const CHART = {
  mark: '#00A5B8',
  grid: '#262626',
  tick: KINETIC.textMuted,
} as const;

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const formatKg = (v: number): string => `${nf.format(v)} kg`;
const formatShortDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const tooltipStyle: CSSProperties = {
  background: KINETIC.surface2,
  border: `1px solid ${KINETIC.ghostHi}`,
  borderRadius: 10,
  fontSize: 12.5,
  color: KINETIC.text,
};

/** Placeholder padrão Kinetic para cards sem dados (aluno recém-vinculado). */
function EmptyCard({ children }: { children: ReactNode }) {
  return <div style={st.emptyCard}>{children}</div>;
}

/** Chip de variação: sinal + cor por direção×benefício (status, não série). */
function DeltaChip({ delta, good, suffix }: { delta: number; good?: boolean | null; suffix: string }) {
  const sign = delta > 0 ? '+' : '';
  const color =
    delta === 0 || good == null
      ? KINETIC.textDim
      : good
        ? KINETIC.success
        : KINETIC.warn;
  const arrow = delta === 0 ? '·' : delta > 0 ? '▲' : '▼';
  return (
    <span style={{ ...st.deltaChip, color }}>
      {arrow} {sign}
      {nf.format(delta)}
      {suffix}
    </span>
  );
}

function StatTile({
  label,
  value,
  detail,
  chip,
}: {
  label: string;
  value: string;
  detail?: string;
  chip?: ReactNode;
}) {
  return (
    <div style={st.tile}>
      <span style={st.tileLabel}>{label}</span>
      <span style={st.tileValue}>{value}</span>
      <span style={st.tileDetail}>
        {detail}
        {chip}
      </span>
    </div>
  );
}

function MetricRow({ label, metric, unit }: { label: string; metric: MetricDeltaDTO | null; unit: string }) {
  if (!metric) return null;
  return (
    <div style={st.metricRow}>
      <span style={st.metricLabel}>{label}</span>
      <span style={st.metricValues}>
        {nf.format(metric.previous)} → <strong style={{ color: KINETIC.text }}>{nf.format(metric.current)}</strong>{' '}
        {unit}
      </span>
      <DeltaChip delta={metric.delta} good={metric.good} suffix={unit === '%' ? '%' : ` ${unit}`} />
    </div>
  );
}

/** Dashboard básico do aluno: stats do período + evolução do ciclo (Fase 3). */
export default function DashboardTab({ studentId, studentFirstName }: Props) {
  const [period, setPeriod] = useState<StatsPeriodId>('month');
  const [stats, setStats] = useState<StatsSummaryResponseDTO | null>(null);
  const [evolution, setEvolution] = useState<PlanEvolutionResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getStudentStats(studentId, period),
      getStudentPlanEvolution(studentId),
    ])
      .then(([summary, evo]) => {
        if (cancelled) return;
        setStats(summary);
        setEvolution(evo);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Não foi possível carregar as estatísticas deste aluno.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, period]);

  const volumeData =
    stats?.volume.byMuscleGroup
      .filter((g) => !g.isRest && g.volume > 0)
      .map((g) => ({ name: g.muscleGroup, volume: g.volume })) ?? [];

  const weightData =
    stats?.weight.history.map((p) => ({
      date: formatShortDate(p.date),
      peso: p.weight,
    })) ?? [];

  const noWorkouts = (stats?.completedSessions ?? 0) === 0;
  const emptyMessage = `Nenhum treino registrado por ${studentFirstName} no período selecionado.`;

  return (
    <div style={st.scroll}>
      <div style={st.inner}>
        {/* Filtros numa única linha acima dos gráficos */}
        <div style={st.filterRow}>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              style={{ ...st.periodBtn, ...(p.id === period ? st.periodBtnActive : {}) }}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={st.muted}>Carregando estatísticas…</p>
        ) : error || !stats ? (
          <EmptyCard>{error ?? 'Sem dados.'}</EmptyCard>
        ) : (
          <>
            {/* Stat tiles */}
            <div style={st.tilesRow}>
              <StatTile
                label="Aderência no período"
                value={`${stats.efficiencyPercentage}%`}
                detail={`${stats.completedSessions} de ${stats.targetSessions} treinos`}
              />
              <StatTile
                label="Volume total"
                value={`${nf.format(stats.volume.total)} kg`}
                chip={
                  stats.volume.total > 0 ? (
                    <DeltaChip
                      delta={stats.volume.deltaPercentage}
                      good={stats.volume.deltaPercentage >= 0}
                      suffix="%"
                    />
                  ) : undefined
                }
              />
              <StatTile
                label="Peso atual"
                value={stats.weight.current > 0 ? formatKg(stats.weight.current) : '—'}
                chip={
                  stats.weight.history.length > 1 ? (
                    <DeltaChip delta={stats.weight.delta} good={null} suffix=" kg" />
                  ) : undefined
                }
              />
            </div>

            {/* Insight do motor de regras */}
            {stats.insight?.body && (
              <div style={st.insightCard}>
                <span style={st.insightTag}>{stats.insight.tag}</span>
                <p style={st.insightBody}>{stats.insight.body}</p>
              </div>
            )}

            {/* Volume por grupo muscular */}
            <section style={st.card}>
              <h3 style={st.cardTitle}>Volume por grupo muscular</h3>
              <p style={st.cardSub}>Tonelagem (kg) no período</p>
              {volumeData.length === 0 || noWorkouts ? (
                <EmptyCard>{emptyMessage}</EmptyCard>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(180, volumeData.length * 40 + 30)}>
                  <BarChart data={volumeData} layout="vertical" margin={{ top: 4, right: 56, bottom: 0, left: 8 }}>
                    <CartesianGrid horizontal={false} stroke={CHART.grid} strokeWidth={1} />
                    <XAxis
                      type="number"
                      tick={{ fill: CHART.tick, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => nf.format(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fill: KINETIC.textDim, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={tooltipStyle}
                      formatter={(value) => [formatKg(Number(value)), 'Volume']}
                    />
                    <Bar dataKey="volume" fill={CHART.mark} barSize={18} radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="volume"
                        position="right"
                        formatter={(v: ReactNode) => nf.format(Number(v))}
                        style={{ fill: KINETIC.textDim, fontSize: 11 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Evolução de peso */}
            <section style={st.card}>
              <h3 style={st.cardTitle}>Evolução de peso</h3>
              <p style={st.cardSub}>
                Registros no período{stats.weight.unit ? ` (${stats.weight.unit})` : ''}
              </p>
              {weightData.length < 2 ? (
                <EmptyCard>
                  {weightData.length === 1
                    ? `Apenas um registro de peso de ${studentFirstName} no período — a linha aparece a partir do segundo.`
                    : `Nenhum registro de peso de ${studentFirstName} no período selecionado.`}
                </EmptyCard>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={weightData} margin={{ top: 12, right: 24, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke={CHART.grid} strokeWidth={1} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: CHART.tick, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: CHART.tick, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => nf.format(v)}
                      width={44}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [formatKg(Number(value)), 'Peso']}
                    />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke={CHART.mark}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      // Anel de 2px na cor da superfície: o ponto segue legível cruzando a linha.
                      dot={{ r: 4, fill: CHART.mark, stroke: KINETIC.bg, strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: CHART.mark, stroke: KINETIC.bg, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Evolução do ciclo (plan-evolution) */}
            <section style={st.card}>
              <h3 style={st.cardTitle}>Ciclo atual vs. anterior</h3>
              <p style={st.cardSub}>
                Comparação desde a última regeneração da ficha
                {evolution?.goal ? ` — objetivo: ${evolution.goal}` : ''}
              </p>
              {!evolution?.available ? (
                <EmptyCard>
                  A ficha de {studentFirstName} ainda não foi regenerada — sem ciclo anterior para comparar.
                </EmptyCard>
              ) : !evolution.currentCycleStarted ? (
                <EmptyCard>
                  O ciclo atual de {studentFirstName} ainda não tem treinos registrados.
                </EmptyCard>
              ) : (
                <div style={st.metricList}>
                  <MetricRow label="Peso" metric={evolution.weight} unit="kg" />
                  <MetricRow label="Volume" metric={evolution.volume} unit="kg" />
                  <MetricRow label="Aderência" metric={evolution.adherence} unit="%" />
                  <div style={st.metricRow}>
                    <span style={st.metricLabel}>Treinos concluídos</span>
                    <span style={st.metricValues}>
                      {evolution.previousCompletedSessions} →{' '}
                      <strong style={{ color: KINETIC.text }}>
                        {evolution.currentCompletedSessions}
                      </strong>
                    </span>
                  </div>
                  {evolution.insight?.body && (
                    <p style={st.metricInsight}>{evolution.insight.body}</p>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  scroll: { flex: 1, minHeight: 0, overflowY: 'auto' },
  inner: {
    width: '100%',
    maxWidth: 920,
    margin: '0 auto',
    padding: '20px 28px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  filterRow: { display: 'flex', gap: 8 },
  periodBtn: {
    padding: '7px 16px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: KINETIC.textMuted,
    background: KINETIC.surface1,
    border: `1px solid ${KINETIC.ghost}`,
  },
  periodBtnActive: {
    color: KINETIC.primary,
    background: KINETIC.primaryDim,
    border: `1px solid ${KINETIC.primarySoft}`,
  },
  tilesRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12,
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '16px 18px',
    borderRadius: 14,
    background: KINETIC.surface1,
    border: `1px solid ${KINETIC.ghost}`,
  },
  tileLabel: { fontSize: 12, color: KINETIC.textMuted, fontWeight: 600 },
  tileValue: { fontSize: 26, fontWeight: 700, color: KINETIC.text, letterSpacing: -0.5 },
  tileDetail: {
    fontSize: 12,
    color: KINETIC.textDim,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  deltaChip: { fontSize: 12, fontWeight: 700 },
  insightCard: {
    padding: '12px 16px',
    borderRadius: 12,
    background: KINETIC.primaryDim,
    border: `1px solid ${KINETIC.primarySoft}`,
  },
  insightTag: {
    fontSize: 10.5,
    fontWeight: 800,
    color: KINETIC.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  insightBody: { fontSize: 13, color: KINETIC.textDim, marginTop: 4, lineHeight: 1.5 },
  card: {
    padding: '18px 20px',
    borderRadius: 14,
    background: KINETIC.surface1,
    border: `1px solid ${KINETIC.ghost}`,
  },
  cardTitle: { fontSize: 15, fontWeight: 800, letterSpacing: -0.2 },
  cardSub: { fontSize: 12, color: KINETIC.textMuted, marginTop: 2, marginBottom: 14 },
  emptyCard: {
    padding: '32px 20px',
    textAlign: 'center',
    color: KINETIC.textMuted,
    fontSize: 13,
    lineHeight: 1.5,
    opacity: 0.85,
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
  },
  muted: { color: KINETIC.textMuted, fontSize: 13 },
  metricList: { display: 'flex', flexDirection: 'column', gap: 10 },
  metricRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.02)',
  },
  metricLabel: { width: 150, fontSize: 13, fontWeight: 600, color: KINETIC.textDim },
  metricValues: { flex: 1, fontSize: 13, color: KINETIC.textDim },
  metricInsight: {
    fontSize: 12.5,
    color: KINETIC.textMuted,
    lineHeight: 1.5,
    padding: '4px 12px 0',
  },
};
