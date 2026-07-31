import { useEffect, useState } from 'react';
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
import {
  Sparkles,
  Award,
  BarChart3,
  Scale,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type {
  PlanEvolutionResponseDTO,
  StatsPeriodId,
  StatsSummaryResponseDTO,
} from '../types';
import { DeltaChip, EmptyCard, MetricRow, StatTile } from './stat-primitives';

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

const CHART = {
  mark: '#00e5ff',
  grid: 'rgba(255,255,255,0.06)',
  tick: 'rgba(245, 246, 247, 0.36)',
} as const;

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const formatKg = (v: number): string => `${nf.format(v)} kg`;
const formatShortDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const tooltipStyle = {
  background: '#1c1b1b',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f5f6f7',
  padding: '8px 12px',
};

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
    <div className="flex-1 overflow-y-auto min-h-0 bg-k-bg">
      <div className="max-w-5xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
        
        {/* Period selection */}
        <div className="flex items-center justify-between border-b border-k-ghost/40 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-k-primary" />
            <span className="text-xs font-bold text-k-text-dim uppercase tracking-wider">Período de Análise</span>
          </div>
          <div className="flex gap-1.5 bg-k-surface1 border border-k-ghost p-1 rounded-xl">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  p.id === period
                    ? 'bg-k-primary-dim text-k-primary shadow-[inset_0_0_0_1px_rgba(0,229,255,0.15)]'
                    : 'text-k-text-muted hover:text-k-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-k-text-muted">
            <RefreshCw className="w-8 h-8 animate-spin text-k-primary" />
            <p className="text-sm font-medium">Processando métricas e treinos...</p>
          </div>
        ) : error || !stats ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-k-surface1 border border-k-ghost rounded-2xl gap-3">
            <AlertCircle className="w-8 h-8 text-k-error" />
            <p className="text-sm font-bold text-k-text">{error ?? 'Sem dados disponíveis.'}</p>
          </div>
        ) : (
          <>
            {/* Stat Tiles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatTile
                label="Aderência no ciclo"
                value={`${stats.efficiencyPercentage}%`}
                detail={`${stats.completedSessions} de ${stats.targetSessions} treinos planejados`}
                icon={<Award className="w-4.5 h-4.5" />}
              />
              <StatTile
                label="Tonelagem total"
                value={`${nf.format(stats.volume.total)} kg`}
                icon={<BarChart3 className="w-4.5 h-4.5" />}
                chip={
                  stats.volume.total > 0 ? (
                    <DeltaChip
                      delta={stats.volume.deltaPercentage}
                      good={stats.volume.deltaPercentage >= 0}
                      suffix="%"
                    />
                  ) : undefined
                }
                detail="variação vs. período anterior"
              />
              <StatTile
                label="Peso corporal"
                value={stats.weight.current > 0 ? formatKg(stats.weight.current) : '—'}
                icon={<Scale className="w-4.5 h-4.5" />}
                chip={
                  stats.weight.history.length > 1 ? (
                    <DeltaChip delta={stats.weight.delta} good={null} suffix=" kg" />
                  ) : undefined
                }
                detail={stats.weight.history.length > 1 ? "variação no período atual" : "única aferição registrada"}
              />
            </div>

            {/* Smart IA insight box */}
            {stats.insight?.body && (
              <div className="flex items-start gap-4 p-4.5 rounded-2xl bg-k-primary-dim/40 border border-k-primary-soft shadow-[0_0_15px_rgba(0,229,255,0.03)]">
                <div className="w-9 h-9 rounded-xl bg-k-primary/10 border border-k-primary-soft flex items-center justify-center text-k-primary shrink-0">
                  <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-extrabold tracking-widest text-k-primary uppercase bg-k-primary-dim px-2.5 py-0.5 rounded-full border border-k-primary-soft">
                    {stats.insight.tag}
                  </span>
                  <p className="text-xs text-k-text-dim mt-2 leading-relaxed font-medium">
                    {stats.insight.body}
                  </p>
                </div>
              </div>
            )}

            {/* Two Column Charts Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Muscle group volume chart */}
              <div className="p-5 rounded-2xl bg-k-surface1/60 border border-k-ghost flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold tracking-tight">Volume por Grupo Muscular</h3>
                  <p className="text-xs text-k-text-muted mt-0.5">Distribuição de carga acumulada (kg)</p>
                </div>
                
                <div className="flex-1 min-h-[220px]">
                  {volumeData.length === 0 || noWorkouts ? (
                    <div className="h-full flex items-center justify-center">
                      <EmptyCard>{emptyMessage}</EmptyCard>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(220, volumeData.length * 40 + 20)}>
                      <BarChart data={volumeData} layout="vertical" margin={{ top: 10, right: 30, bottom: 5, left: 0 }}>
                        <CartesianGrid horizontal={false} stroke={CHART.grid} />
                        <XAxis
                          type="number"
                          tick={{ fill: CHART.tick, fontSize: 10, fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) => nf.format(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={95}
                          tick={{ fill: '#f5f6f7', fontSize: 11, fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          contentStyle={tooltipStyle}
                          formatter={(value) => [formatKg(Number(value)), 'Volume']}
                        />
                        <Bar dataKey="volume" fill={CHART.mark} barSize={16} radius={[0, 4, 4, 0]}>
                          <LabelList
                            dataKey="volume"
                            position="right"
                            formatter={(v: any) => nf.format(Number(v))}
                            style={{ fill: 'rgba(245, 246, 247, 0.62)', fontSize: 10, fontWeight: 'bold' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Weight evolution chart */}
              <div className="p-5 rounded-2xl bg-k-surface1/60 border border-k-ghost flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold tracking-tight">Evolução do Peso</h3>
                  <p className="text-xs text-k-text-muted mt-0.5">Histórico de aferições corporais no período</p>
                </div>
                
                <div className="flex-1 min-h-[220px]">
                  {weightData.length < 2 ? (
                    <div className="h-full flex items-center justify-center">
                      <EmptyCard>
                        {weightData.length === 1
                          ? `Apenas uma pesagem registrada. A curva de evolução exige pelo menos dois registros.`
                          : `Nenhum peso corporal foi lançado por ${studentFirstName} neste período.`}
                      </EmptyCard>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={weightData} margin={{ top: 15, right: 15, bottom: 5, left: -20 }}>
                        <CartesianGrid vertical={false} stroke={CHART.grid} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: CHART.tick, fontSize: 10, fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={['auto', 'auto']}
                          tick={{ fill: CHART.tick, fontSize: 10, fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) => nf.format(v)}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value) => [formatKg(Number(value)), 'Peso']}
                        />
                        <Line
                          type="monotone"
                          dataKey="peso"
                          stroke={CHART.mark}
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          dot={{ r: 4, fill: CHART.mark, stroke: '#131313', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: CHART.mark, stroke: '#131313', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Ciclo actual vs. anterior section */}
            <div className="p-5 rounded-2xl bg-k-surface1/60 border border-k-ghost">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold tracking-tight">Ciclo de Treino Atual vs. Anterior</h3>
                <p className="text-xs text-k-text-muted mt-0.5">
                  Análise comparativa desde a última regeneração da ficha
                  {evolution?.goal ? ` (Meta do aluno: ${evolution.goal})` : ''}
                </p>
              </div>

              {!evolution?.available ? (
                <EmptyCard>
                  A ficha deste aluno ainda não passou por nenhuma atualização ou regeneração — sem ciclo anterior para comparação.
                </EmptyCard>
              ) : !evolution.currentCycleStarted ? (
                <EmptyCard>
                  O novo ciclo de treinos foi gerado, mas {studentFirstName} ainda não registrou sessões para iniciar a comparação.
                </EmptyCard>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <MetricRow label="Peso Corporal" metric={evolution.weight} unit="kg" />
                    <MetricRow label="Volume de Carga" metric={evolution.volume} unit="kg" />
                    <MetricRow label="Aderência ao Plano" metric={evolution.adherence} unit="%" />
                  </div>
                  
                  {/* Sessions details */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-k-surface2/30 border border-k-ghost/40 mt-1">
                    <span className="text-xs font-bold text-k-text-dim">Treinos Concluídos</span>
                    <span className="text-xs text-k-text-dim">
                      <span className="text-k-text-muted mr-1">Ciclo anterior:</span>
                      <strong className="text-k-text-muted font-bold">{evolution.previousCompletedSessions}</strong>
                      <span className="mx-2 text-k-ghost-hi">/</span>
                      <span className="text-k-text-muted mr-1">Atual:</span>
                      <strong className="text-k-primary font-black text-sm">{evolution.currentCompletedSessions}</strong>
                    </span>
                  </div>

                  {evolution.insight?.body && (
                    <div className="mt-3 p-3.5 bg-k-surface2/40 border border-k-ghost/50 rounded-xl flex gap-3 text-xs leading-relaxed text-k-text-dim">
                      <div className="w-1.5 h-1.5 rounded-full bg-k-primary mt-1.5 shrink-0" />
                      <p>{evolution.insight.body}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
