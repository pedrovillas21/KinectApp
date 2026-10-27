import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import {
  CalendarX,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Link2,
  MessageCircle,
  Sparkles,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { EASE_OUT, SPRING_PILL } from '../motion/primitives';
import { dismissToday } from '../../services/trainerService';
import { qk, queryClient } from '../../services/queryClient';
import { whatsappUrl } from '../../utils/whatsapp';
import type { TodayItem, TodayItemType } from '../../types';

const TYPE_META: Record<TodayItemType, { label: string; icon: LucideIcon }> = {
  PAGAMENTO: { label: 'Pagamentos', icon: Wallet },
  TREINO_HOJE: { label: 'Treino de hoje', icon: CalendarX },
  PREVIA_IA: { label: 'Prévias de IA', icon: Sparkles },
  REAVALIACAO: { label: 'Avaliações', icon: ClipboardList },
  FICHA_ANTIGA: { label: 'Fichas antigas', icon: Dumbbell },
  CONVITE: { label: 'Convites', icon: Link2 },
};

const SEVERITY_DOT: Record<TodayItem['severity'], string> = {
  ALTO: 'bg-k-alert',
  MEDIO: 'bg-k-warn',
  INFO: 'bg-k-primary',
};

const COLLAPSED_LIMIT = 6;

const missedTodayMessage = (studentName: string | null) => {
  const first = studentName?.trim().split(/\s+/)[0];
  return `Oi${first ? `, ${first}` : ''}! Senti sua falta no treino hoje. Está tudo bem?`;
};

const ACTION_CLASS =
  'flex h-8 shrink-0 items-center gap-1 rounded-lg border border-white/[0.12] px-3 text-[13px] text-k-text transition-colors hover:bg-white/[0.06]';

/** Âncoras da própria carteira rolam a página; o resto navega para a tela certa. */
function ActionLink({ path, children }: { path: string; children: ReactNode }) {
  const className = ACTION_CLASS;
  if (path.startsWith('#')) {
    return (
      <button
        type="button"
        onClick={() => document.getElementById(path.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        className={className}
      >
        {children}
      </button>
    );
  }
  return (
    <Link to={path} className={className}>
      {children}
    </Link>
  );
}

/**
 * Caixa de entrada "Hoje": os a-fazeres do dia numa lista só, filtrável por tipo,
 * com atalho para a tela onde cada pendência se resolve. "Ainda não treinou hoje"
 * (só à noite) tem WhatsApp direto e "Ignorar", que limpa o item até amanhã.
 */
export default function TodayInbox({ items }: { items: TodayItem[] }) {
  const [filter, setFilter] = useState<TodayItemType | 'ALL'>('ALL');
  const [expanded, setExpanded] = useState(false);
  const [dismissing, setDismissing] = useState<string | null>(null);

  const handleDismiss = async (studentId: string) => {
    setDismissing(studentId);
    try {
      await dismissToday(studentId);
      await queryClient.invalidateQueries({ queryKey: qk.today });
    } catch {
      toast.error('Não foi possível ignorar. Tente novamente.');
    } finally {
      setDismissing(null);
    }
  };

  const counts = items.reduce<Partial<Record<TodayItemType, number>>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, {});
  const types = (Object.keys(TYPE_META) as TodayItemType[]).filter((t) => counts[t]);
  const filtered = filter === 'ALL' ? items : items.filter((i) => i.type === filter);
  const shown = expanded ? filtered : filtered.slice(0, COLLAPSED_LIMIT);
  const urgent = items.filter((i) => i.severity === 'ALTO').length;

  return (
    <motion.section
      aria-label="Hoje"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
      className="flex flex-col rounded-xl border border-white/[0.08]"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-4 py-3.5 md:px-5">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
          <h2 className="text-[15px] font-semibold">Fila de hoje</h2>
          <p className="font-mono text-xs text-k-text-muted">
            {items.length === 0
              ? 'Tudo em dia. Nenhuma pendência por agora.'
              : `${items.length} ${items.length === 1 ? 'pendência' : 'pendências'}${
                  urgent > 0 ? ` · ${urgent} ${urgent === 1 ? 'urgente' : 'urgentes'}` : ''
                }`}
          </p>
        </div>
        {types.length > 1 && (
          <div role="group" aria-label="Filtrar pendências" className="flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-white/[0.08] p-0.5 sm:ml-auto sm:flex-wrap">
            {(['ALL', ...types] as const).map((t) => {
              const active = filter === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setFilter(t);
                    setExpanded(false);
                  }}
                  className={`relative flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs transition-colors ${
                    active ? 'text-k-text' : 'text-k-text-dim hover:text-k-text'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="today-filter-pill"
                      transition={SPRING_PILL}
                      className="absolute inset-0 rounded-md bg-white/[0.08]"
                    />
                  )}
                  <span className="relative">{t === 'ALL' ? 'Tudo' : TYPE_META[t].label}</span>
                  <span className="relative font-mono text-k-text-muted">{t === 'ALL' ? items.length : counts[t]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col divide-y divide-white/[0.06] px-4 md:px-5">
          <AnimatePresence initial={false}>
            {shown.map((item, i) => {
              const Icon = TYPE_META[item.type].icon;
              return (
                <motion.li
                  key={`${item.type}-${item.studentId ?? ''}-${item.title}-${i}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3.5"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[item.severity]}`} aria-hidden="true" />
                  <Icon className="h-4 w-4 shrink-0 text-k-text-muted" />
                  {/* Celular: aluno e pendência em linhas separadas; WhatsApp + Ignorar descem para a
                      linha de baixo, "Resolver" fica ao lado. */}
                  <div className={`min-w-0 flex-1 ${item.type === 'TREINO_HOJE' ? 'basis-[200px]' : ''}`}>
                    <p className="truncate text-sm font-medium">
                      {item.studentName && (
                        <>
                          {item.studentName}
                          <span className="max-sm:hidden"> · </span>
                        </>
                      )}
                      <span className="font-normal text-k-text-soft max-sm:block max-sm:truncate">{item.title}</span>
                    </p>
                    <p className="truncate text-[13px] text-k-text-muted">{item.detail}</p>
                  </div>
                  {item.type === 'TREINO_HOJE' && item.studentId ? (
                    <div className="flex shrink-0 items-center gap-2 max-sm:ml-[38px]">
                      {item.studentPhone && (
                        <a
                          href={whatsappUrl(item.studentPhone, missedTodayMessage(item.studentName))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={ACTION_CLASS}
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-k-success" />
                          WhatsApp
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDismiss(item.studentId!)}
                        disabled={dismissing === item.studentId}
                        className="flex h-8 items-center rounded-lg px-2.5 text-[13px] text-k-text-dim transition-colors hover:bg-white/[0.06] hover:text-k-text disabled:opacity-50"
                      >
                        Ignorar
                      </button>
                    </div>
                  ) : (
                    <ActionLink path={item.actionPath}>
                      Resolver
                      <ChevronRight className="h-3.5 w-3.5" />
                    </ActionLink>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {filtered.length > COLLAPSED_LIMIT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mx-4 my-3 self-start md:mx-5 text-[13px] text-k-primary hover:underline"
        >
          {expanded ? 'Mostrar menos' : `Ver todas (${filtered.length})`}
        </button>
      )}
    </motion.section>
  );
}
