import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog, UserPlus, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PeriodTabs from '../../components/PeriodTabs';
import { EmptyCard, StatTile } from '../../components/stat-primitives';
import { InstructorBarChart, VolumeLineChart } from '../../components/empresa-charts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAnalytics } from '../../services/empresaService';
import type { EmpresaAnalytics, StatsPeriodId } from '../../types';

const nf = new Intl.NumberFormat('pt-BR');

export default function EmpresaHomePage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<StatsPeriodId>('month');
  const [data, setData] = useState<EmpresaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAnalytics(period)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError('Não foi possível carregar os dados da unidade.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Visão Geral"
        subtitle="Panorama da unidade: retenção e desempenho"
        actions={<PeriodTabs value={period} onChange={setPeriod} />}
      />

      <div className="max-w-[1160px] w-full mx-auto px-8 pt-8 pb-16 flex flex-col gap-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : error || !data ? (
          <EmptyCard>{error ?? 'Sem dados disponíveis.'}</EmptyCard>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/empresa/funcionarios')}>
                <UserCog className="w-4 h-4" /> Vincular Personal
              </Button>
              <Button onClick={() => navigate('/empresa/clientes')} variant="secondary">
                <UserPlus className="w-4 h-4" /> Vincular Aluno
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border border-white/[0.08] flex flex-col">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-k-primary" />
                  <div>
                    <h3 className="text-[15px] font-semibold">Volume de Treinos na Unidade</h3>
                    <p className="text-xs text-k-text-muted mt-0.5">Sessões dos alunos por dia</p>
                  </div>
                </div>
                <div className="flex-1 min-h-[240px] flex items-center justify-center">
                  <VolumeLineChart series={data.volumeSeries} />
                </div>
              </div>

              <div className="p-5 rounded-xl border border-white/[0.08] flex flex-col">
                <div className="mb-4">
                  <h3 className="text-[15px] font-semibold">Desempenho por Instrutor</h3>
                  <p className="text-xs text-k-text-muted mt-0.5">Alunos ativos sob cada personal</p>
                </div>
                <div className="flex-1 min-h-[220px] flex items-center justify-center">
                  <InstructorBarChart data={data.desempenhoPorInstrutor} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
