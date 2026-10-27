import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AnalyticsPage from '../empresa/AnalyticsPage';
import FeedbacksPage from '../empresa/FeedbacksPage';
import { EmptyCard } from '../../components/stat-primitives';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getUnitAnalytics,
  listUnitClientes,
  listUnitFeedbacks,
  listUnitFuncionarios,
} from '../../services/donoService';
import type { EmpresaStudentLink, StatsPeriodId, UserAdmin } from '../../types';

type Tab = 'analytics' | 'funcionarios' | 'clientes' | 'feedbacks';

const TABS: { id: Tab; label: string }[] = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'funcionarios', label: 'Funcionários' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'feedbacks', label: 'Feedbacks' },
];

/** O dono acompanha uma filial (somente leitura): o dia a dia é da própria filial. */
export default function UnitDetailPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<Tab>('analytics');

  const loadAnalytics = useCallback((period: StatsPeriodId) => getUnitAnalytics(id, period), [id]);
  const loadFeedbacks = useCallback(() => listUnitFeedbacks(id), [id]);

  return (
    <div className="flex flex-col min-h-full">
      <div className="max-w-[1160px] w-full mx-auto px-4 md:px-8 pt-6 md:pt-8 flex flex-wrap items-center gap-3">
        <Link to="/dono/filiais" className="inline-flex items-center gap-1.5 text-xs font-semibold text-k-text-dim hover:text-k-text">
          <ArrowLeft className="w-3.5 h-3.5" /> Filiais
        </Link>
        <div role="tablist" className="ml-auto flex gap-1 rounded-lg border border-k-ghost bg-k-surface1 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors ${
                tab === t.id ? 'bg-k-surface3 text-k-text' : 'text-k-text-muted hover:text-k-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'analytics' && <AnalyticsPage load={loadAnalytics} subtitle="Retenção, volume e desempenho da filial" />}
      {tab === 'feedbacks' && <FeedbacksPage load={loadFeedbacks} />}
      {tab === 'funcionarios' && <FuncionariosTable unitId={id} />}
      {tab === 'clientes' && <ClientesTable unitId={id} />}
    </div>
  );
}

function useList<T>(load: () => Promise<T[]>) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    load()
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [load]);
  return { rows, error };
}

function Shell({ loading, error, empty, children }: { loading: boolean; error: boolean; empty: boolean; children: React.ReactNode }) {
  return (
    <div className="max-w-[1160px] w-full mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-12 md:pb-16">
      {loading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : error ? (
        <EmptyCard>Não foi possível carregar.</EmptyCard>
      ) : empty ? (
        <EmptyCard>Nada por aqui ainda.</EmptyCard>
      ) : (
        <div className="rounded-xl border border-white/[0.08] overflow-hidden overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

function FuncionariosTable({ unitId }: { unitId: string }) {
  const load = useCallback(() => listUnitFuncionarios(unitId), [unitId]);
  const { rows, error } = useList<UserAdmin>(load);
  return (
    <Shell loading={!rows && !error} error={error} empty={rows?.length === 0}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Personal</TableHead>
            <TableHead className="max-md:hidden">E-mail</TableHead>
            <TableHead>Situação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows?.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-bold">
                {f.nome}
                <span className="block text-xs font-normal text-k-text-muted md:hidden">{f.email}</span>
              </TableCell>
              <TableCell className="text-k-text-dim max-md:hidden">{f.email}</TableCell>
              <TableCell className="text-xs">{f.companyId ? 'Funcionário' : 'Convite pendente'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Shell>
  );
}

function ClientesTable({ unitId }: { unitId: string }) {
  const load = useCallback(() => listUnitClientes(unitId), [unitId]);
  const { rows, error } = useList<EmpresaStudentLink>(load);
  return (
    <Shell loading={!rows && !error} error={error} empty={rows?.length === 0}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aluno</TableHead>
            <TableHead>Personal</TableHead>
            <TableHead className="max-md:hidden">Desde</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows?.map((c) => (
            <TableRow key={c.linkId}>
              <TableCell className="font-bold">{c.student.nome}</TableCell>
              <TableCell className="text-k-text-dim">{c.trainer.nome}</TableCell>
              <TableCell className="text-k-text-dim max-md:hidden">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Shell>
  );
}
