import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import DateRangeFilter from '../../../components/DateRangeFilter';
import Pager from '../../../components/Pager';
import { EmptyCard } from '../../../components/stat-primitives';
import { MobileList } from '../../../components/MobileList';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBillingGateway, listAuditEvents } from '../../../services/auditService';
import type { AuditAction, AuditCategory, AuditEvent, BillingGatewayInfo, Page } from '../../../types';
import { dateTimeLabel, isoDaysAgo, todayIso } from '../../../utils/dates';
import { errorMessage } from '../../../utils/errors';
import AuditEventItem from './AuditEventItem';
import { ACTION_LABEL, actionsOf, actorLabel, eventDetail, ROLE_LABEL, targetLabel } from './auditLabels';

type EventCategory = Exclude<AuditCategory, 'LGPD'>;

const CATEGORY_CONFIG: Record<EventCategory, { title: string; subtitle: string; empty: string }> = {
  ADMIN: {
    title: 'Ações administrativas',
    subtitle: 'O que ROOT, donos, filiais e personais fizeram em contas, filiais e vínculos',
    empty: 'Nenhuma ação administrativa no período.',
  },
  SECURITY: {
    title: 'Segurança',
    subtitle: 'Logins recusados, 2FA e troca ou recuperação de senha. Ficam 6 meses.',
    empty: 'Nenhum evento de segurança no período.',
  },
  HEALTH: {
    title: 'Dados de saúde',
    subtitle: 'Quem leu ou alterou avaliações, protocolo e anamnese. Leitura: 1 registro por hora por tipo de dado.',
    empty: 'Nenhum acesso a dado de saúde no período.',
  },
  BILLING: {
    title: 'Cobrança',
    subtitle: 'Mudanças de assinatura dos personais e créditos de IA',
    empty: 'Nenhuma mudança de cobrança no período.',
  },
};

const ALL = 'all';

/** Trilha de uma categoria, com filtro de ação e período. Uma página só para as quatro categorias. */
export default function AuditEventsPage({ category }: { category: EventCategory }) {
  const config = CATEGORY_CONFIG[category];
  const [action, setAction] = useState<AuditAction | typeof ALL>(ALL);
  const [range, setRange] = useState({ from: isoDaysAgo(30), to: todayIso() });
  const [pageNumber, setPageNumber] = useState(0);
  const [page, setPage] = useState<Page<AuditEvent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateway, setGateway] = useState<BillingGatewayInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listAuditEvents({
      category,
      action: action === ALL ? undefined : action,
      from: range.from,
      to: range.to,
      page: pageNumber,
      size: 20,
    })
      .then((p) => !cancelled && setPage(p))
      .catch((err: unknown) => !cancelled && setError(errorMessage(err, 'Não foi possível carregar a trilha.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, action, range, pageNumber]);

  useEffect(() => {
    if (category !== 'BILLING') return;
    getBillingGateway()
      .then(setGateway)
      .catch(() => setGateway(null));
  }, [category]);

  const events = page?.content ?? [];
  const showIp = category === 'SECURITY';

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        wideActions
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={action}
              onValueChange={(v) => {
                setAction(v as AuditAction | typeof ALL);
                setPageNumber(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-56" aria-label="Ação">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as ações</SelectItem>
                {actionsOf(category).map((a) => (
                  <SelectItem key={a} value={a}>
                    {ACTION_LABEL[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangeFilter
              from={range.from}
              to={range.to}
              onChange={(r) => {
                setRange(r);
                setPageNumber(0);
              }}
            />
          </div>
        }
      />

      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-4 px-4 pb-12 pt-6 md:px-8 md:pb-16 md:pt-8">
        {gateway?.demo && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-k-warn/20 bg-k-warn/[0.07] px-3.5 py-3 text-[13px] leading-normal"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-k-warn" />
            <p>
              <strong className="text-k-warn">Gateway em modo demonstração.</strong> Os pagamentos são simulados e nada
              é cobrado. Se este for o ambiente de produção, configure o gateway real (BILLING_GATEWAY) antes de
              aceitar assinaturas.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyCard>{error}</EmptyCard>
        ) : events.length === 0 ? (
          <EmptyCard>{config.empty}</EmptyCard>
        ) : (
          <div>
            <MobileList>
              {events.map((e) => (
                <AuditEventItem key={e.id} event={e} />
              ))}
            </MobileList>
            <div className="overflow-hidden overflow-x-auto rounded-xl border border-white/[0.08] max-md:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data e hora</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Detalhe</TableHead>
                    {showIp && <TableHead>IP</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-xs tabular-nums text-k-text-dim">
                        {dateTimeLabel(e.occurredAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{actorLabel(e)}</span>
                          {e.actorRole && (
                            <span className="text-[11px] text-k-text-muted">{ROLE_LABEL[e.actorRole] ?? e.actorRole}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{ACTION_LABEL[e.action]}</TableCell>
                      <TableCell className="text-xs text-k-text-dim">{targetLabel(e) || '—'}</TableCell>
                      <TableCell className="max-w-[320px] whitespace-normal text-xs text-k-text-dim">
                        {eventDetail(e)}
                        {e.reason && <p className="mt-0.5 italic text-k-text-soft">“{e.reason}”</p>}
                        {!eventDetail(e) && !e.reason && '—'}
                      </TableCell>
                      {showIp && <TableCell className="font-mono text-xs text-k-text-dim">{e.ip ?? '—'}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {page && <Pager page={page} onChange={setPageNumber} />}
          </div>
        )}
      </div>
    </div>
  );
}
