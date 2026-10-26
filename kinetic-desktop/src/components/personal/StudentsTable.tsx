import { Link, useNavigate } from 'react-router-dom';
import { BellOff, ChevronRight } from 'lucide-react';
import Avatar from '../Avatar';
import { formatPauseDate, pauseReasonLabel, resumeStudentAlerts } from './PauseAlertDialog';
import { TONE_META, type AdherenceTone } from './adherence';
import type { MonthlyStatsResponseDTO, StudentEngagement, TrainerLink } from '../../types';

export interface StudentRow {
  link: TrainerLink;
  /** undefined = carregando; null = falhou. */
  stats: MonthlyStatsResponseDTO | null | undefined;
  tone: AdherenceTone | null;
}

const sinceLabel = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')} ${d.getFullYear()}`;
};

const lastSession = (e: StudentEngagement | undefined): string => {
  if (!e) return '—';
  const d = e.daysSinceLastSession;
  if (d === null) return 'Nunca treinou';
  if (d === 0) return 'hoje';
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
};

const TH = 'px-3 py-3 text-xs font-medium text-k-text-muted';
const TD = 'px-3 py-3.5';

/** Carteira em tabela: escaneável, ordenada por quem precisa de atenção primeiro. */
export default function StudentsTable({
  rows,
  engagement,
}: {
  rows: StudentRow[];
  engagement: Record<string, StudentEngagement> | null;
}) {
  const navigate = useNavigate();
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
        <thead className="border-b border-white/[0.07]">
          <tr>
            <th scope="col" className={`${TH} pl-5`}>Aluno</th>
            <th scope="col" className={TH}>Status</th>
            <th scope="col" className={TH}>Aderência · mês</th>
            <th scope="col" className={`${TH} text-right`}>Treinos no mês</th>
            <th scope="col" className={TH}>Último treino</th>
            <th scope="col" className={TH}>Aluno desde</th>
            <th scope="col" className={`${TH} pr-5`}>
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {rows.map(({ link, stats, tone }) => {
            const meta = tone ? TONE_META[tone] : null;
            const hasPlan = !!stats && stats.targetSessions > 0;
            const e = engagement?.[link.peer.id];
            const href = `/students/${link.peer.id}`;
            return (
              <tr
                key={link.id}
                onClick={() => navigate(href)}
                className="cursor-pointer transition-colors hover:bg-white/[0.025]"
              >
                <td className={`${TD} pl-5`}>
                  <span className="flex items-center gap-3">
                    <Avatar name={link.peer.nome} avatarUrl={link.peer.avatarUrl} size={32} />
                    <span className="flex min-w-0 flex-col">
                      <Link
                        to={href}
                        onClick={(ev) => ev.stopPropagation()}
                        className="truncate font-medium text-k-text hover:text-k-primary"
                      >
                        {link.peer.nome}
                      </Link>
                      <span className="truncate text-xs text-k-text-muted">
                        {link.frozen ? <span className="text-k-warn">Congelado · </span> : null}
                        {link.peer.email}
                      </span>
                    </span>
                  </span>
                </td>
                <td className={TD}>
                  {stats === undefined ? (
                    <span className="k-skeleton block h-2.5 w-20 rounded-full bg-k-surface2" />
                  ) : (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap" style={{ color: meta?.color ?? '#8e8f90' }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta?.color ?? '#8e8f90' }} />
                      {meta?.label ?? 'Sem dados'}
                    </span>
                  )}
                  {e?.pause && (
                    // Pausado não entra na fila de hoje nem nos alertas de risco: sem isto, some sem explicação.
                    <span
                      className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs text-k-text-muted"
                      title={`${pauseReasonLabel(e.pause.reason)}${e.pause.note ? ` — ${e.pause.note}` : ''}`}
                    >
                      <BellOff className="h-3 w-3" aria-hidden="true" />
                      Alertas pausados até {formatPauseDate(e.pause.until)}
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          void resumeStudentAlerts(link.peer.id);
                        }}
                        aria-label={`Reativar alertas de ${link.peer.nome}`}
                        className="text-k-primary hover:underline"
                      >
                        Reativar
                      </button>
                    </span>
                  )}
                </td>
                <td className={TD}>
                  {hasPlan ? (
                    <span className="flex items-center gap-2.5">
                      <span className="h-1 w-24 rounded-full bg-white/[0.08]">
                        <span
                          className="block h-1 rounded-full bg-k-primary"
                          style={{ width: `${Math.min(100, stats.efficiency)}%` }}
                        />
                      </span>
                      <span className="font-mono">{stats.efficiency}%</span>
                    </span>
                  ) : (
                    <span className="text-k-text-muted">—</span>
                  )}
                </td>
                <td className={`${TD} text-right font-mono`}>
                  {hasPlan ? (
                    <>
                      {stats.completedSessions}
                      <span className="text-k-text-muted"> / {stats.targetSessions}</span>
                    </>
                  ) : (
                    <span className="text-k-text-muted">—</span>
                  )}
                </td>
                <td
                  className={`${TD} whitespace-nowrap ${
                    e?.risk === 'ALTO' ? 'text-k-alert' : e?.risk === 'MEDIO' ? 'text-k-warn' : 'text-k-text-soft'
                  }`}
                >
                  {lastSession(e)}
                </td>
                <td className={`${TD} whitespace-nowrap text-k-text-muted`}>
                  {sinceLabel(link.respondedAt ?? link.createdAt)}
                </td>
                <td className={`${TD} pr-5 text-right text-k-text-muted`}>
                  <ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
