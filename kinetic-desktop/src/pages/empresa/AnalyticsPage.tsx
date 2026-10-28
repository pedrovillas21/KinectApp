import PageHeader from '../../components/PageHeader';
import PeriodTabs from '../../components/PeriodTabs';
import { EmptyCard, SectionCard, StatGrid, StatGridSkeleton, StatTile } from '../../components/stat-primitives';
import { InstructorBarChart, VolumeLineChart } from '../../components/empresa-charts';
import { getAnalytics } from '../../services/empresaService';
import type { EmpresaAnalytics, StatsPeriodId } from '../../types';
import useEmpresaAnalytics from './useEmpresaAnalytics';

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
  const { period, setPeriod, data, loading, error } = useEmpresaAnalytics(
    load,
    'Não foi possível carregar as analytics.',
  );

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title={title}
        subtitle={subtitle}
        wideActions
        actions={<PeriodTabs value={period} onChange={setPeriod} />}
      />

      <div className="max-w-[1160px] w-full mx-auto px-4 md:px-8 pt-5 md:pt-8 pb-12 md:pb-16 flex flex-col gap-5 md:gap-6">
        {loading ? (
          <StatGridSkeleton cols={3} />
        ) : error || !data ? (
          <EmptyCard>{error ?? 'Sem dados disponíveis.'}</EmptyCard>
        ) : (
          <>
            <StatGrid cols={3}>
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
            </StatGrid>

            <SectionCard title="Volume de Treinos na Unidade" subtitle="Sessões dos alunos por dia no período">
              <div className="flex-1 min-h-[180px] md:min-h-[260px] flex items-center justify-center">
                <VolumeLineChart series={data.volumeSeries} />
              </div>
            </SectionCard>

            <SectionCard title="Desempenho por Instrutor" subtitle="Alunos ativos sob cada personal">
              <div className="flex-1 min-h-[160px] md:min-h-[240px] flex items-center justify-center">
                <InstructorBarChart data={data.desempenhoPorInstrutor} />
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
