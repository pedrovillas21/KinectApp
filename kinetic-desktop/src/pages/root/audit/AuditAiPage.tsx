import { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import DateRangeFilter from '../../../components/DateRangeFilter';
import Pager from '../../../components/Pager';
import { TagChip } from '../../../components/StatusBadge';
import { EmptyCard, SectionCard, StatGrid, StatGridSkeleton, StatTile } from '../../../components/stat-primitives';
import { MobileList, MobileListItem } from '../../../components/MobileList';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAuditAi } from '../../../services/auditService';
import type { AuditAi, AuditAiApproval } from '../../../types';
import { dateTimeLabel, isoDaysAgo, todayIso } from '../../../utils/dates';
import { errorMessage } from '../../../utils/errors';
import { partyLabel } from './auditLabels';

const nf = new Intl.NumberFormat('pt-BR');
const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

const trainerLabel = (a: AuditAiApproval) =>
  `${partyLabel(a.trainer, a.trainer.name ? `${a.trainer.name} (conta excluída)` : '[conta excluída]')}${
    a.trainerCref ? ` · CREF ${a.trainerCref}` : ''
  }`;
const studentLabel = (a: AuditAiApproval) => partyLabel(a.student, '[aluno excluído]');

/**
 * Fichas aprovadas por IA: quem aprovou, quando e para quem. Só metadados; o pedido e a
 * resposta da IA têm condições médicas e não saem do backend.
 */
export default function AuditAiPage() {
  const [range, setRange] = useState({ from: isoDaysAgo(30), to: todayIso() });
  const [pageNumber, setPageNumber] = useState(0);
  const [data, setData] = useState<AuditAi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAuditAi({ from: range.from, to: range.to, page: pageNumber, size: 20 })
      .then((d) => !cancelled && setData(d))
      .catch((err: unknown) => !cancelled && setError(errorMessage(err, 'Não foi possível carregar as fichas.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range, pageNumber]);

  const approvals = data?.approvals.content ?? [];

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Fichas por IA"
        subtitle="Aprovações de fichas geradas por IA: o registro de quem assumiu a prescrição"
        wideActions
        actions={
          <DateRangeFilter
            from={range.from}
            to={range.to}
            onChange={(r) => {
              setRange(r);
              setPageNumber(0);
            }}
          />
        }
      />

      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 px-4 pb-12 pt-6 md:gap-6 md:px-8 md:pb-16 md:pt-8">
        {loading && !data ? (
          <StatGridSkeleton cols={3} />
        ) : error ? (
          <EmptyCard>{error}</EmptyCard>
        ) : data ? (
          <>
            <StatGrid cols={3}>
              <StatTile label="Prévias geradas" value={nf.format(data.previews)} detail="no período" />
              <StatTile label="Aprovadas" value={nf.format(data.approved)} detail="das prévias do período" />
              <StatTile
                label="Taxa de aprovação"
                value={data.previews === 0 ? '—' : pct.format(data.approved / data.previews)}
                detail="aprovadas ÷ prévias"
              />
            </StatGrid>

            <SectionCard title="Aprovações" subtitle="Pedido e resposta da IA ficam de fora: contêm condições médicas">
              {approvals.length === 0 ? (
                <EmptyCard>Nenhuma ficha aprovada no período.</EmptyCard>
              ) : (
                <>
                  <MobileList>
                    {approvals.map((a) => (
                      <MobileListItem
                        key={a.id}
                        title={studentLabel(a)}
                        subtitle={trainerLabel(a)}
                        meta={
                          <>
                            <span>{dateTimeLabel(a.approvedAt)}</span>
                            {a.model && <span className="font-mono">{a.model}</span>}
                            {a.replacedCurrent && <TagChip>Substituiu a ficha atual</TagChip>}
                          </>
                        }
                      />
                    ))}
                  </MobileList>
                  <div className="overflow-hidden overflow-x-auto rounded-xl border border-white/[0.08] max-md:hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aprovada em</TableHead>
                          <TableHead>Personal</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Ficha atual</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvals.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="whitespace-nowrap text-xs tabular-nums text-k-text-dim">
                              {dateTimeLabel(a.approvedAt)}
                            </TableCell>
                            <TableCell className="text-xs">{trainerLabel(a)}</TableCell>
                            <TableCell className="text-xs text-k-text-dim">{studentLabel(a)}</TableCell>
                            <TableCell className="font-mono text-xs text-k-text-dim">{a.model ?? '—'}</TableCell>
                            <TableCell className="text-xs text-k-text-dim">
                              {a.replacedCurrent ? 'Substituída' : 'Mantida'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Pager page={data.approvals} onChange={setPageNumber} />
                </>
              )}
            </SectionCard>
          </>
        ) : null}
      </div>
    </div>
  );
}
