import { useNavigate } from 'react-router-dom';
import { UserCog, UserPlus, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PeriodTabs from '../../components/PeriodTabs';
import {
  EmptyCard,
  QuickActions,
  SectionCard,
  StatGrid,
  StatGridSkeleton,
  StatTile,
} from '../../components/stat-primitives';
import { InstructorBarChart, VolumeLineChart } from '../../components/empresa-charts';
import { getAnalytics } from '../../services/empresaService';
import useEmpresaAnalytics from './useEmpresaAnalytics';

const nf = new Intl.NumberFormat('pt-BR');

export default function EmpresaHomePage() {
  const navigate = useNavigate();
  const { period, setPeriod, data, loading, error } = useEmpresaAnalytics(
    getAnalytics,
    'Não foi possível carregar os dados da unidade.',
  );

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Visão Geral"
        subtitle="Panorama da unidade: retenção e desempenho"
        wideActions
        actions={<PeriodTabs value={period} onChange={setPeriod} />}
      />

      <div className="max-w-[1160px] w-full mx-auto px-4 md:px-8 pt-5 md:pt-8 pb-12 md:pb-16 flex flex-col gap-5 md:gap-6">
        {loading ? (
          <StatGridSkeleton />
        ) : error || !data ? (
          <EmptyCard>{error ?? 'Sem dados disponíveis.'}</EmptyCard>
        ) : (
          <>
            <StatGrid>
              <StatTile
                label="Personais ativos"
                value={nf.format(data.personaisAtivos)}
                detail="funcionários da unidade"
              />
              <StatTile
                label="Alunos ativos"
                value={nf.format(data.alunosAtivos)}
                detail="vínculos corporativos ativos"
              />
              <StatTile
                label="Vinculados no período"
                value={nf.format(data.alunosVinculadosNoPeriodo)}
                detail="novos vínculos"
              />
              <StatTile
                label="Retenção"
                value={`${Math.round(data.retentionRate * 100)}%`}
                detail="ativos / vinculados no período"
              />
            </StatGrid>

            <QuickActions
              actions={[
                { label: 'Vincular Personal', icon: UserCog, onClick: () => navigate('/empresa/funcionarios') },
                {
                  label: 'Vincular Aluno',
                  icon: UserPlus,
                  onClick: () => navigate('/empresa/clientes'),
                  variant: 'secondary',
                },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
              <SectionCard icon={TrendingUp} title="Volume de Treinos na Unidade" subtitle="Sessões dos alunos por dia">
                <div className="flex-1 min-h-[180px] md:min-h-[240px] flex items-center justify-center">
                  <VolumeLineChart series={data.volumeSeries} />
                </div>
              </SectionCard>

              <SectionCard title="Desempenho por Instrutor" subtitle="Alunos ativos sob cada personal">
                <div className="flex-1 min-h-[160px] md:min-h-[220px] flex items-center justify-center">
                  <InstructorBarChart data={data.desempenhoPorInstrutor} />
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
