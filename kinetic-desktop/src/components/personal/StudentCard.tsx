import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import Avatar from '../Avatar';
import { CountUp, EASE_OUT, ProgressRing } from '../motion/primitives';
import { TONE_META, type AdherenceTone } from './adherence';
import type { MonthlyStatsResponseDTO, StudentEngagement, TrainerLink } from '../../types';

interface Props {
  link: TrainerLink;
  /** undefined = carregando; null = falhou. */
  stats: MonthlyStatsResponseDTO | null | undefined;
  tone: AdherenceTone | null;
  index: number;
  /** Painel de aderência (último treino, risco); undefined enquanto carrega. */
  engagement?: StudentEngagement;
}

const sinceLabel = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `Desde ${month} ${d.getFullYear()}`;
};

const sessionsLabel = (stats: MonthlyStatsResponseDTO | null): string => {
  if (!stats) return 'Não foi possível carregar o mês';
  if (stats.targetSessions <= 0) return 'Frequência semanal não definida';
  return `${stats.completedSessions} de ${stats.targetSessions} treinos no mês`;
};

const lastSessionShort = (e: StudentEngagement): string => {
  const d = e.daysSinceLastSession;
  if (d === null) return 'Nunca treinou';
  if (d === 0) return 'Treinou hoje';
  if (d === 1) return 'Treinou ontem';
  return `Há ${d} dias sem treinar`;
};

/** Card do aluno na carteira: anel de aderência do mês + status em texto. */
export default function StudentCard({ link, stats, tone, index, engagement }: Props) {
  const meta = tone ? TONE_META[tone] : null;
  const hasPlan = !!stats && stats.targetSessions > 0;
  const pct = hasPlan ? stats.efficiency : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        duration: 0.6,
        ease: EASE_OUT,
        delay: Math.min(index, 12) * 0.05,
        layout: { type: 'spring', stiffness: 380, damping: 34 },
      }}
    >
      <Link
        to={`/students/${link.peer.id}`}
        className="group flex h-full flex-col gap-4 rounded-[18px] border border-k-ghost bg-k-surface1 p-[18px] transition-[translate,border-color,background-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-k-primary/45 hover:bg-[#1f1f1f] hover:shadow-[0_22px_44px_-22px_rgba(0,229,255,0.38)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-k-primary"
      >
        <div className="flex items-center gap-3.5">
          <Avatar name={link.peer.nome} avatarUrl={link.peer.avatarUrl} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-k-text transition-colors group-hover:text-k-primary">
              {link.peer.nome}
            </p>
            <p className="truncate text-[12.5px] text-k-text-muted">{link.peer.email}</p>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#242424] text-k-text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-k-primary-dim group-hover:text-k-primary">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>

        <div className="flex items-center gap-3.5 border-t border-white/[0.06] pt-4">
          <ProgressRing value={pct} size={52} stroke={5} color={meta?.color ?? '#8e8f90'}>
            {stats === undefined ? null : hasPlan ? (
              <CountUp
                value={pct}
                format={(v) => `${Math.round(v)}%`}
                className="font-display text-[13px] font-extrabold tabular-nums"
              />
            ) : (
              <span className="font-display text-[13px] font-extrabold text-k-text-muted">—</span>
            )}
          </ProgressRing>

          <div className="min-w-0 flex-1">
            {stats === undefined ? (
              <div className="flex flex-col gap-2" aria-label="Carregando aderência">
                <span className="k-skeleton block h-2.5 w-24 rounded-full bg-k-surface2" />
                <span className="k-skeleton block h-2.5 w-36 rounded-full bg-[#242424]" />
              </div>
            ) : (
              <>
                <p className="text-[13px] font-semibold" style={{ color: meta?.color ?? '#8e8f90' }}>
                  {meta?.label ?? 'Sem dados do mês'}
                </p>
                <p className="truncate text-[12.5px] text-k-text-muted">{sessionsLabel(stats)}</p>
              </>
            )}
          </div>

          <div className="flex flex-col items-end gap-0.5 whitespace-nowrap text-right text-xs">
            {engagement && (
              <span
                className={
                  engagement.risk === 'ALTO'
                    ? 'font-semibold text-k-alert'
                    : engagement.risk === 'MEDIO'
                      ? 'font-semibold text-k-warn'
                      : 'text-k-text-dim'
                }
              >
                {lastSessionShort(engagement)}
              </span>
            )}
            <span className="text-k-text-muted">{sinceLabel(link.respondedAt ?? link.createdAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
