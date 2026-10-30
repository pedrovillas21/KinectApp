import type { AuditEvent } from '../../../types';
import { dateTimeLabel } from '../../../utils/dates';
import { ACTION_LABEL, actorLabel, eventDetail, targetLabel } from './auditLabels';

/**
 * Uma linha da trilha: ação, autor → alvo, motivo e data/hora. Lista do celular e card
 * da Visão Geral (no desktop as páginas usam a tabela).
 */
export default function AuditEventItem({ event }: { event: AuditEvent }) {
  const target = targetLabel(event);
  const detail = eventDetail(event);
  return (
    <li className="flex flex-col gap-1 px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold">{ACTION_LABEL[event.action]}</p>
        <time dateTime={event.occurredAt} className="shrink-0 text-[11px] tabular-nums text-k-text-muted">
          {dateTimeLabel(event.occurredAt)}
        </time>
      </div>
      <p className="truncate text-xs text-k-text-dim">
        {actorLabel(event)}
        {target && <span className="text-k-text-muted"> → </span>}
        {target}
      </p>
      {(detail || event.ip) && (
        <p className="text-xs text-k-text-muted">
          {detail}
          {detail && event.ip && ' · '}
          {event.ip && <span className="font-mono">IP {event.ip}</span>}
        </p>
      )}
      {event.reason && <p className="text-xs italic leading-relaxed text-k-text-soft">“{event.reason}”</p>}
    </li>
  );
}
