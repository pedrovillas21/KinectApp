import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Building2,
  UserCog,
  Users,
  UserPlus,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  ScrollText,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PeriodTabs from '../../components/PeriodTabs';
import { EmptyCard, StatTile } from '../../components/stat-primitives';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getMetrics } from '../../services/rootService';
import type { RootMetrics, StatsPeriodId } from '../../types';

const nf = new Intl.NumberFormat('pt-BR');

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
};

const shortDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function RootHomePage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<StatsPeriodId>('month');
  const [metrics, setMetrics] = useState<RootMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMetrics(period)
      .then((m) => !cancelled && setMetrics(m))
      .catch(() => !cancelled && setError('Não foi possível carregar as métricas.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period]);

  const growthData = (metrics?.growth ?? []).map((p) => ({ date: shortDate(p.date), contas: p.count }));

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Visão Geral"
        subtitle="Panorama macro da plataforma"
        icon={<TrendingUp className="w-5 h-5" />}
        actions={<PeriodTabs value={period} onChange={setPeriod} />}
      />

      <div className="max-w-6xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
        {/* KPIs */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : error || !metrics ? (
          <EmptyCard>{error ?? 'Sem dados disponíveis.'}</EmptyCard>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile
                label="Empresas"
                value={nf.format(metrics.totalCompanies)}
                icon={<Building2 className="w-4.5 h-4.5" />}
                detail="total na plataforma"
              />
              <StatTile
                label="Personais"
                value={nf.format(metrics.totalPersonais)}
                icon={<UserCog className="w-4.5 h-4.5" />}
                detail="total na plataforma"
              />
              <StatTile
                label="Alunos"
                value={nf.format(metrics.totalAlunos)}
                icon={<Users className="w-4.5 h-4.5" />}
                detail="total na plataforma"
              />
              <StatTile
                label="Novos no período"
                value={nf.format(metrics.newUsersInPeriod)}
                icon={<UserPlus className="w-4.5 h-4.5" />}
                detail="contas criadas"
              />
            </div>

            {/* Atalhos de clique único */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/root/empresas')}>
                <Building2 className="w-4 h-4" /> Nova Empresa
              </Button>
              <Button onClick={() => navigate('/root/personais')} variant="secondary">
                <UserCog className="w-4 h-4" /> Novo Personal
              </Button>
              <Button onClick={() => navigate('/root/usuarios')} variant="outline">
                <ShieldCheck className="w-4 h-4" /> Ir para Compliance
              </Button>
            </div>

            {/* Crescimento de contas (série real, barata) */}
            <div className="p-5 rounded-2xl bg-k-surface1/60 border border-k-ghost flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold tracking-tight">Crescimento de Contas</h3>
                <p className="text-xs text-k-text-muted mt-0.5">Novas contas por dia no período</p>
              </div>
              <div className="flex-1 min-h-[240px]">
                {growthData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <EmptyCard>Nenhuma conta criada no período selecionado.</EmptyCard>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={growthData} margin={{ top: 15, right: 15, bottom: 5, left: -20 }}>
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
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value) => [nf.format(Number(value)), 'Contas']}
                      />
                      <Line
                        type="monotone"
                        dataKey="contas"
                        stroke={CHART.mark}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        dot={{ r: 3, fill: CHART.mark, stroke: '#131313', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: CHART.mark, stroke: '#131313', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Placeholders "no caro" */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-k-surface1/60 border border-k-ghost flex flex-col">
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-k-text-muted" />
                  <h3 className="text-sm font-extrabold tracking-tight">Faturamento macro</h3>
                </div>
                <EmptyCard>Métricas de faturamento chegam em uma próxima entrega.</EmptyCard>
              </div>
              <div className="p-5 rounded-2xl bg-k-surface1/60 border border-k-ghost flex flex-col">
                <div className="mb-4 flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-k-text-muted" />
                  <h3 className="text-sm font-extrabold tracking-tight">Auditoria recente</h3>
                </div>
                <EmptyCard>Os logs de auditoria serão exibidos aqui em breve.</EmptyCard>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
