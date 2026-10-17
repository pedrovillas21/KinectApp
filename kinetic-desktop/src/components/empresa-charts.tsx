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
import { EmptyCard } from './stat-primitives';
import type { EmpresaAnalytics } from '../types';

const CHART = {
  mark: '#00a5b8', // série validada (dataviz) para dark
  grid: 'rgba(255,255,255,0.06)',
  tick: 'rgba(245, 246, 247, 0.36)',
} as const;

const tooltipStyle = {
  background: '#1c1b1b',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f5f6f7',
  padding: '8px 12px',
} as const;

const nf = new Intl.NumberFormat('pt-BR');

const shortDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Volume de treinos da unidade (sessões por dia). Série única. */
export function VolumeLineChart({ series }: { series: EmpresaAnalytics['volumeSeries'] }) {
  if (series.length === 0) {
    return <EmptyCard>Nenhuma sessão de treino registrada pelos alunos no período.</EmptyCard>;
  }
  const data = series.map((p) => ({ date: shortDate(p.date), sessoes: p.sessions }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 15, right: 15, bottom: 5, left: -20 }}>
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis
          dataKey="date"
          tick={{ fill: CHART.tick, fontSize: 10, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: CHART.tick, fontSize: 10, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [nf.format(Number(v)), 'Sessões']} />
        <Line
          type="monotone"
          dataKey="sessoes"
          stroke={CHART.mark}
          strokeWidth={2.5}
          strokeLinecap="round"
          dot={{ r: 3, fill: CHART.mark, stroke: '#131313', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: CHART.mark, stroke: '#131313', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Nº de alunos ativos por instrutor. Barras horizontais, série única. */
export function InstructorBarChart({ data }: { data: EmpresaAnalytics['desempenhoPorInstrutor'] }) {
  if (data.length === 0) {
    return <EmptyCard>Nenhum instrutor com alunos ativos ainda.</EmptyCard>;
  }
  const rows = data.map((d) => ({ name: d.trainerName, alunos: d.activeStudents }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 44 + 20)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 10, right: 30, bottom: 5, left: 0 }}>
        <CartesianGrid horizontal={false} stroke={CHART.grid} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: CHART.tick, fontSize: 10, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fill: '#f5f6f7', fontSize: 11, fontWeight: 700 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          contentStyle={tooltipStyle}
          formatter={(v) => [nf.format(Number(v)), 'Alunos ativos']}
        />
        <Bar dataKey="alunos" fill={CHART.mark} barSize={16} radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="alunos"
            position="right"
            style={{ fill: 'rgba(245, 246, 247, 0.62)', fontSize: 10, fontWeight: 'bold' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
