import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Eraser, Inbox, Plus, UserX } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import DateRangeFilter from '../../../components/DateRangeFilter';
import Pager from '../../../components/Pager';
import KineticSelect from '../../../components/KineticSelect';
import { TagChip } from '../../../components/StatusBadge';
import { EmptyCard, SectionCard, StatGrid, StatGridSkeleton, StatTile } from '../../../components/stat-primitives';
import { MobileList, MobileListItem } from '../../../components/MobileList';
import FormDialog, { formInputClass, formLabelClass } from '../../../components/personal/FormDialog';
import ConfirmDialog from '../../../components/personal/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { completeDataRequest, getAuditLgpd, listDataRequests, openDataRequest } from '../../../services/auditService';
import type { AuditLgpd, DataRequest, DataRequestKind, Page } from '../../../types';
import { dateTimeLabel, fullDate, isoDaysAgo, todayIso } from '../../../utils/dates';
import { errorMessage } from '../../../utils/errors';
import { partyLabel, REQUEST_KIND_LABEL, ROLE_LABEL } from './auditLabels';

const nf = new Intl.NumberFormat('pt-BR');
const KIND_OPTIONS = (Object.keys(REQUEST_KIND_LABEL) as DataRequestKind[]).map((k) => ({
  value: k,
  label: REQUEST_KIND_LABEL[k],
}));
const EMPTY_FORM = { kind: 'ACESSO' as DataRequestKind, email: '', receivedAt: todayIso(), note: '' };

/** Prazo de um pedido aberto: vencido, vencendo (≤ 3 dias) ou no prazo. */
function dueChip(r: DataRequest) {
  if (r.status === 'CONCLUIDO') {
    return <TagChip>Concluído{r.completedAt ? ` em ${fullDate(r.completedAt)}` : ''}</TagChip>;
  }
  const today = todayIso();
  if (r.dueAt < today) {
    return <span className="rounded-full bg-k-alert/[0.12] px-2.5 py-1 text-[11.5px] font-semibold text-k-alert">Vencido em {fullDate(r.dueAt)}</span>;
  }
  const soon = r.dueAt <= isoDaysAgo(-3);
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
        soon ? 'bg-k-warn/[0.12] text-k-warn' : 'bg-white/[0.06] text-k-text-dim'
      }`}
    >
      Vence em {fullDate(r.dueAt)}
    </span>
  );
}

const subjectLabel = (r: DataRequest) => (r.subject ? partyLabel(r.subject, '[titular excluído]') : '[titular excluído]');

/**
 * Painel LGPD: exclusões de conta, aceite dos termos, última limpeza dos prazos e os pedidos
 * de titulares com o prazo de 15 dias (art. 19, II). Sem nenhuma coluna pessoal das contas excluídas.
 */
export default function AuditLgpdPage() {
  const [range, setRange] = useState({ from: isoDaysAgo(30), to: todayIso() });
  const [accountsPage, setAccountsPage] = useState(0);
  const [summary, setSummary] = useState<AuditLgpd | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [requestsPage, setRequestsPage] = useState(0);
  const [requests, setRequests] = useState<Page<DataRequest> | null>(null);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toComplete, setToComplete] = useState<DataRequest | null>(null);

  const loadSummary = useCallback(async () => {
    setSummaryError(null);
    try {
      setSummary(await getAuditLgpd({ from: range.from, to: range.to, page: accountsPage, size: 10 }));
    } catch (err: unknown) {
      setSummaryError(errorMessage(err, 'Não foi possível carregar o resumo LGPD.'));
    }
  }, [range, accountsPage]);

  const loadRequests = useCallback(async () => {
    setRequestsError(null);
    try {
      setRequests(await listDataRequests({ page: requestsPage, size: 10 }));
    } catch (err: unknown) {
      setRequestsError(errorMessage(err, 'Não foi possível carregar os pedidos.'));
    }
  }, [requestsPage]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const submitRequest = async () => {
    setSaving(true);
    try {
      await openDataRequest({
        kind: form.kind,
        email: form.email.trim(),
        receivedAt: form.receivedAt || undefined,
        note: form.note.trim() || undefined,
      });
      toast.success('Pedido registrado. O prazo de resposta é de 15 dias.');
      setFormOpen(false);
      setForm(EMPTY_FORM);
      setRequestsPage(0);
      await Promise.all([loadRequests(), loadSummary()]);
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Não foi possível registrar o pedido.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmComplete = async () => {
    if (!toComplete) return;
    setSaving(true);
    try {
      await completeDataRequest(toComplete.id);
      toast.success('Pedido concluído.');
      setToComplete(null);
      await Promise.all([loadRequests(), loadSummary()]);
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Não foi possível concluir o pedido.'));
    } finally {
      setSaving(false);
    }
  };

  const deletions = summary ? summary.deletions.byTitular + summary.deletions.byAdmin : 0;
  const accounts = summary?.deletedAccounts;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="LGPD"
        subtitle="Exclusões de conta, aceite dos termos, limpeza dos prazos e pedidos de titulares"
        wideActions
        actions={
          <DateRangeFilter
            from={range.from}
            to={range.to}
            onChange={(r) => {
              setRange(r);
              setAccountsPage(0);
            }}
          />
        }
      />

      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 px-4 pb-12 pt-6 md:gap-6 md:px-8 md:pb-16 md:pt-8">
        {summaryError ? (
          <EmptyCard>{summaryError}</EmptyCard>
        ) : !summary ? (
          <StatGridSkeleton />
        ) : (
          <StatGrid>
            <StatTile
              label="Exclusões no período"
              value={nf.format(deletions)}
              detail={`${nf.format(summary.deletions.byTitular)} pelo titular · ${nf.format(summary.deletions.byAdmin)} pelo ROOT`}
            />
            <StatTile label="Contas bloqueadas excluídas" value={nf.format(summary.deletions.blocked)} detail="e-mail e CPF não voltam" />
            <StatTile
              label="Termos pendentes"
              value={nf.format(summary.terms.pending)}
              detail={`versão ${summary.terms.currentVersion} · ${nf.format(summary.terms.accepted)} aceitaram`}
            />
            <StatTile
              label="Pedidos vencendo"
              value={nf.format(summary.requests.dueSoon + summary.requests.overdue)}
              detail={`${nf.format(summary.requests.overdue)} vencido(s) · ${nf.format(summary.requests.open)} aberto(s)`}
            />
          </StatGrid>
        )}

        <SectionCard title="Pedidos de titulares" subtitle="Acesso, correção, eliminação… Resposta em até 15 dias (LGPD art. 19, II)" icon={Inbox}>
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setFormOpen(true)} className="max-sm:w-full">
              <Plus /> Novo pedido
            </Button>
          </div>
          {requestsError ? (
            <EmptyCard>{requestsError}</EmptyCard>
          ) : !requests ? null : requests.content.length === 0 ? (
            <EmptyCard>Nenhum pedido registrado.</EmptyCard>
          ) : (
            <>
              <MobileList>
                {requests.content.map((r) => (
                  <MobileListItem
                    key={r.id}
                    title={REQUEST_KIND_LABEL[r.kind]}
                    subtitle={`${subjectLabel(r)} · recebido em ${fullDate(r.receivedAt)}`}
                    meta={
                      <>
                        {dueChip(r)}
                        {r.note && <span className="w-full text-k-text-dim">{r.note}</span>}
                      </>
                    }
                    actionsLabel={`Ações do pedido de ${subjectLabel(r)}`}
                    actions={
                      r.status === 'ABERTO'
                        ? [{ label: 'Concluir', icon: CheckCircle2, onClick: () => setToComplete(r) }]
                        : undefined
                    }
                  />
                ))}
              </MobileList>
              <div className="overflow-hidden overflow-x-auto rounded-xl border border-white/[0.08] max-md:hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Titular</TableHead>
                      <TableHead>Recebido</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.content.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs font-semibold">{REQUEST_KIND_LABEL[r.kind]}</TableCell>
                        <TableCell className="text-xs text-k-text-dim">{subjectLabel(r)}</TableCell>
                        <TableCell className="text-xs tabular-nums text-k-text-dim">{fullDate(r.receivedAt)}</TableCell>
                        <TableCell>{dueChip(r)}</TableCell>
                        <TableCell className="max-w-[260px] whitespace-normal text-xs text-k-text-dim">{r.note ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          {r.status === 'ABERTO' && (
                            <Button variant="ghost" size="sm" onClick={() => setToComplete(r)}>
                              <CheckCircle2 /> Concluir
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pager page={requests} onChange={setRequestsPage} />
            </>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-[2fr_1fr]">
          <SectionCard title="Contas excluídas no período" subtitle="Sem dados pessoais: só papel, quem excluiu e os prazos" icon={UserX}>
            {!accounts ? null : accounts.content.length === 0 ? (
              <EmptyCard>Nenhuma conta excluída no período.</EmptyCard>
            ) : (
              <>
                <MobileList>
                  {accounts.content.map((a) => (
                    <MobileListItem
                      key={a.userId}
                      title={ROLE_LABEL[a.role] ?? a.role}
                      subtitle={`${a.deletedBy === 'TITULAR' ? 'Pelo titular' : `Pelo ROOT${a.deletedByAdmin ? `: ${partyLabel(a.deletedByAdmin)}` : ''}`} · ${dateTimeLabel(a.deletedAt)}`}
                      meta={
                        <>
                          {a.blocked && <TagChip>Bloqueada</TagChip>}
                          <span>guardada até {fullDate(a.retainUntil)}</span>
                        </>
                      }
                    />
                  ))}
                </MobileList>
                <div className="overflow-hidden overflow-x-auto rounded-xl border border-white/[0.08] max-md:hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Papel</TableHead>
                        <TableHead>Excluída por</TableHead>
                        <TableHead>Quando</TableHead>
                        <TableHead>Guardada até</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.content.map((a) => (
                        <TableRow key={a.userId}>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-2">
                              {ROLE_LABEL[a.role] ?? a.role}
                              {a.blocked && <TagChip>Bloqueada</TagChip>}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-k-text-dim">
                            {a.deletedBy === 'TITULAR' ? 'Titular' : partyLabel(a.deletedByAdmin) || 'ROOT'}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums text-k-text-dim">{dateTimeLabel(a.deletedAt)}</TableCell>
                          <TableCell className="text-xs tabular-nums text-k-text-dim">{fullDate(a.retainUntil)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pager page={accounts} onChange={setAccountsPage} />
              </>
            )}
          </SectionCard>

          <SectionCard title="Última limpeza" subtitle="Expurgo diário do que passou do prazo de guarda" icon={Eraser}>
            {!summary ? null : !summary.lastPurge ? (
              <EmptyCard>A limpeza diária ainda não rodou.</EmptyCard>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-mono text-lg tabular-nums">{dateTimeLabel(summary.lastPurge.at)}</p>
                <ul className="flex flex-col gap-1.5 text-xs text-k-text-dim">
                  {Object.entries(summary.lastPurge.counts ?? {}).map(([table, n]) => (
                    <li key={table} className="flex justify-between gap-3">
                      <span className="font-mono">{table}</span>
                      <span className="tabular-nums">{nf.format(Number(n))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <FormDialog
        open={formOpen}
        title="Novo pedido do titular"
        description="Registre o pedido recebido (e-mail, formulário, carta). O prazo de 15 dias conta da data de recebimento."
        submitLabel="Registrar pedido"
        busy={saving}
        submitDisabled={form.email.trim() === ''}
        onSubmit={() => void submitRequest()}
        onCancel={() => setFormOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="dsr-kind" className={formLabelClass}>
              Tipo de pedido
            </label>
            <KineticSelect
              id="dsr-kind"
              value={form.kind}
              onChange={(v) => setForm((f) => ({ ...f, kind: v as DataRequestKind }))}
              options={KIND_OPTIONS}
            />
          </div>
          <label className="flex flex-col gap-2">
            <span className={formLabelClass}>E-mail da conta do titular</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={formInputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={formLabelClass}>Recebido em</span>
            <input
              type="date"
              value={form.receivedAt}
              max={todayIso()}
              onChange={(e) => setForm((f) => ({ ...f, receivedAt: e.target.value }))}
              className={formInputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={formLabelClass}>
              Observação <span className="font-normal text-k-text-muted">(opcional)</span>
            </span>
            <textarea
              rows={2}
              maxLength={500}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full resize-none rounded-xl border border-white/10 bg-k-bg px-4 py-3 text-[15px] placeholder:text-k-text-muted focus:border-k-primary"
            />
          </label>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={toComplete !== null}
        title="Concluir pedido"
        description={
          <>
            Marque como concluído só depois de responder ao titular
            {toComplete ? (
              <>
                {' '}
                (<strong>{REQUEST_KIND_LABEL[toComplete.kind]}</strong> de {subjectLabel(toComplete)})
              </>
            ) : null}
            . O pedido fica guardado por 5 anos como prova do atendimento.
          </>
        }
        confirmLabel="Concluir"
        busy={saving}
        onConfirm={() => void confirmComplete()}
        onCancel={() => setToComplete(null)}
      />
    </div>
  );
}
