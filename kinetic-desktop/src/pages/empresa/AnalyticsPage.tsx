import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import PeriodTabs from '../../components/PeriodTabs';
import { EmptyCard, StatTile } from '../../components/stat-primitives';
import { InstructorBarChart, VolumeLineChart } from '../../components/empresa-charts';
import { Skeleton } from '@/components/ui/skeleton';
import { getAnalytics } from '../../services/empresaService';
import type { EmpresaAnalytics, StatsPeriodId } from '../../types';

const nf = new Intl.NumberFormat('pt-BR');

interface Props {
  /** Fonte dos dados: a própria filial (padrão) ou uma filial/rede vista pelo dono. */
  load?: (period: StatsPeriodId) => Promise<EmpresaAnalytics>;
  title?: string;
  subtitle?: string;
}

export default function AnalyticsPage({
  load = getAnalytics,
  title = 'Analytics',
  subtitle = 'Retenção, volume e desempenho da unidade',
}: Props) {
  const [period, setPeriod] = useState<StatsPeriodId>('month');
  const [data, setData] = useState<EmpresaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load(period)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError('Não foi possível carregar as analytics.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period, load]);

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<PeriodTabs value={period} onChange={setPeriod} />}
      />

      <div className="max-w-[1160px] w-full mx-auto px-8 pt-8 pb-16 flex flex-col gap-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : error || !data ? (
          <EmptyCard>{error ?? 'Sem dados disponíveis.'}</EmptyCard>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatTile
                label="Sessões no período"
                value={nf.format(data.sessoesNoPeriodo)}
                detail="treinos registrados na unidade"
              />
              <StatTile
                label="Retenção"
                value={`${Math.round(data.retentionRate * 100)}%`}
                detail="ativos / vinculados no período"
              />
              <StatTile
                label="Alunos ativos"
                value={nf.format(data.alunosAtivos)}
                detail="vínculos corporativos ativos"
              />
            </div>

            <div className="p-5 rounded-xl border border-white/[0.08] flex flex-col">
              <div className="mb-4">
                <h3 className="text-[15px] font-semibold">Volume de Treinos na Unidade</h3>
                <p className="text-xs text-k-text-muted mt-0.5">Sessões dos alunos por dia no período</p>
              </div>
              <div className="flex-1 min-h-[260px] flex items-center justify-center">
                <VolumeLineChart series={data.volumeSeries} />
              </div>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.08] flex flex-col">
              <div className="mb-4">
                <h3 className="text-[15px] font-semibold">Desempenho por Instrutor</h3>
                <p className="text-xs text-k-text-muted mt-0.5">Alunos ativos sob cada personal</p>
              </div>
              <div className="flex-1 min-h-[240px] flex items-center justify-center">
                <InstructorBarChart data={data.desempenhoPorInstrutor} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
