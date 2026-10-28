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
import { Building2, UserCog, ShieldCheck, CreditCard, ScrollText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PeriodTabs from '../../components/PeriodTabs';
import {
  ComingSoonCard,
  EmptyCard,
  QuickActions,
  SectionCard,
  StatGrid,
  StatGridSkeleton,
  StatTile,
} from '../../components/stat-primitives';
import { useIsMobile } from '../../utils/useIsMobile';
import { getMetrics } from '../../services/rootService';
import type { RootMetrics, StatsPeriodId } from '../../types';
import { dayMonth } from '../../utils/dates';
import { CHART, chartTooltipStyle } from '../../components/chart-theme';

const nf = new Intl.NumberFormat('pt-BR');

export default function RootHomePage() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
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

  const growthData = (metrics?.growth ?? []).map((p) => ({ date: dayMonth(p.date), contas: p.count }));

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Visão Geral"
        subtitle="Panorama macro da plataforma"
        wideActions
        actions={<PeriodTabs value={period} onChange={setPeriod} />}
      />

      <div className="max-w-[1160px] w-full mx-auto px-4 md:px-8 pt-5 md:pt-8 pb-12 md:pb-16 flex flex-col gap-5 md:gap-6">
        {/* KPIs */}
        {loading ? (
          <StatGridSkeleton />
        ) : error || !metrics ? (
          <EmptyCard>{error ?? 'Sem dados disponíveis.'}</EmptyCard>
        ) : (
          <>
            <StatGrid>
              <StatTile
                label="Empresas"
                value={nf.format(metrics.totalCompanies)}
                detail="total na plataforma"
              />
              <StatTile
                label="Personais"
                value={nf.format(metrics.totalPersonais)}
                detail="total na plataforma"
              />
              <StatTile
                label="Alunos"
                value={nf.format(metrics.totalAlunos)}
                detail="total na plataforma"
              />
              <StatTile
                label="Novos no período"
                value={nf.format(metrics.newUsersInPeriod)}
                detail="contas criadas"
              />
            </StatGrid>

            {/* Atalhos de clique único */}
            <QuickActions
              actions={[
                { label: 'Nova Empresa', icon: Building2, onClick: () => navigate('/root/empresas') },
                {
                  label: 'Novo Personal',
                  icon: UserCog,
                  onClick: () => navigate('/root/personais'),
                  variant: 'secondary',
                },
                {
                  label: 'Ir para Compliance',
                  short: 'Compliance',
                  icon: ShieldCheck,
                  onClick: () => navigate('/root/usuarios'),
                  variant: 'outline',
                },
              ]}
            />

            {/* Crescimento de contas (série real, barata) */}
            <SectionCard title="Crescimento de Contas" subtitle="Novas contas por dia no período">
              <div className="flex-1 min-h-[180px] md:min-h-[240px]">
                {growthData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <EmptyCard>Nenhuma conta criada no período selecionado.</EmptyCard>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={mobile ? 200 : 260}>
                    <LineChart
                      data={growthData}
                      margin={mobile ? { top: 10, right: 8, bottom: 0, left: -28 } : { top: 15, right: 15, bottom: 5, left: -20 }}
                    >
                      <CartesianGrid vertical={false} stroke={CHART.grid} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: CHART.tick, fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={mobile ? 24 : 5}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: CHART.tick, fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
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
            </SectionCard>

            {/* Placeholders "no caro" */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              <ComingSoonCard icon={CreditCard} title="Faturamento macro">
                Métricas de faturamento chegam em uma próxima entrega.
              </ComingSoonCard>
              <ComingSoonCard icon={ScrollText} title="Auditoria recente">
                Os logs de auditoria serão exibidos aqui em breve.
              </ComingSoonCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
