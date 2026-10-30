import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Lock, Search } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import { EmptyCard, SectionCard } from '../../../components/stat-primitives';
import { MobileList, MobileListItem } from '../../../components/MobileList';
import { formInputClass, formLabelClass } from '../../../components/personal/FormDialog';
import { REASON_MAX, REASON_MIN } from '../../../components/personal/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { searchAccessLogs } from '../../../services/auditService';
import type { AccessLogEntry, AccessLogResult } from '../../../types';
import { dateTimeLabel, isoDaysAgo, todayIso } from '../../../utils/dates';
import { errorMessage } from '../../../utils/errors';

const EVENT_LABEL: Record<AccessLogEntry['event'], string> = {
  LOGIN: 'Login',
  REFRESH: 'Renovação da sessão',
  ACCESS: 'Uso do app',
};

/**
 * Registros de acesso de uma conta (Marco Civil art. 15): IP e data/hora de uso, guardados
 * 6 meses sob sigilo. Cada consulta exige motivo e fica na trilha com o nome de quem consultou.
 */
export default function AuditAccessLogsPage() {
  const [email, setEmail] = useState('');
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(todayIso());
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AccessLogResult | null>(null);

  const reasonOk = reason.trim().length >= REASON_MIN;
  const canSubmit = email.trim() !== '' && from !== '' && to !== '' && reasonOk && !busy;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      setResult(await searchAccessLogs({ email: email.trim(), from, to, reason: reason.trim() }));
    } catch (err: unknown) {
      setResult(null);
      toast.error(errorMessage(err, 'Não foi possível consultar os registros.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Registros de acesso"
        subtitle="IP e data/hora de uso de uma conta, para ordem judicial ou pedido do titular"
      />

      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-5 px-4 pb-12 pt-6 md:gap-6 md:px-8 md:pb-16 md:pt-8">
        <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-k-surface1 px-3.5 py-3 text-[13px] leading-normal text-k-text-dim">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-k-primary" />
          <p>
            Estes registros ficam sob sigilo por 6 meses (Marco Civil da Internet, art. 15) e só devem ser entregues
            por ordem judicial ou ao próprio titular. A consulta fica registrada na auditoria com o seu nome e o
            motivo.
          </p>
        </div>

        <SectionCard title="Consultar uma conta" subtitle="Conta excluída também é encontrada, pelo e-mail que ela usava">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
              <label className="flex flex-col gap-2">
                <span className={formLabelClass}>E-mail da conta</span>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={formInputClass}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={formLabelClass}>De</span>
                <input
                  type="date"
                  required
                  value={from}
                  max={to || todayIso()}
                  onChange={(e) => setFrom(e.target.value)}
                  className={formInputClass}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={formLabelClass}>Até</span>
                <input
                  type="date"
                  required
                  value={to}
                  min={from || undefined}
                  max={todayIso()}
                  onChange={(e) => setTo(e.target.value)}
                  className={formInputClass}
                />
              </label>
            </div>
            <label className="flex flex-col gap-2">
              <span className={formLabelClass}>
                Motivo <span className="font-normal text-k-text-muted">(nº do processo ou do pedido do titular)</span>
              </span>
              <textarea
                rows={2}
                required
                maxLength={REASON_MAX}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full resize-none rounded-xl border border-white/10 bg-k-bg px-4 py-3 text-[15px] placeholder:text-k-text-muted focus:border-k-primary"
              />
              {!reasonOk && reason !== '' && (
                <span className="text-xs text-k-text-muted">Mínimo de {REASON_MIN} caracteres.</span>
              )}
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={!canSubmit} className="max-sm:w-full">
                <Search /> {busy ? 'Consultando…' : 'Consultar'}
              </Button>
            </div>
          </form>
        </SectionCard>

        {result && (
          <SectionCard
            title={`${result.logs.length} registro(s) no período`}
            subtitle={
              result.deletedAccount
                ? 'Conta já excluída: achada pelo pseudônimo do e-mail.'
                : result.truncated
                  ? 'Mostrando os mais recentes; diminua o período para ver o restante.'
                  : undefined
            }
          >
            {result.logs.length === 0 ? (
              <EmptyCard>Nenhum acesso desta conta no período.</EmptyCard>
            ) : (
              <>
                <MobileList>
                  {result.logs.map((log, i) => (
                    <MobileListItem
                      key={`${log.accessedAt}-${i}`}
                      title={<span className="font-mono">{log.ip}</span>}
                      subtitle={`${EVENT_LABEL[log.event]} · ${dateTimeLabel(log.accessedAt)}`}
                    />
                  ))}
                </MobileList>
                <div className="overflow-hidden overflow-x-auto rounded-xl border border-white/[0.08] max-md:hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data e hora</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Evento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.logs.map((log, i) => (
                        <TableRow key={`${log.accessedAt}-${i}`}>
                          <TableCell className="text-xs tabular-nums">{dateTimeLabel(log.accessedAt)}</TableCell>
                          <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                          <TableCell className="text-xs text-k-text-dim">{EVENT_LABEL[log.event]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
