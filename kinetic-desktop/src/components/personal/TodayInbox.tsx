import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Link2,
  Sparkles,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { EASE_OUT, SPRING_PILL } from '../motion/primitives';
import type { TodayItem, TodayItemType } from '../../types';

const TYPE_META: Record<TodayItemType, { label: string; icon: LucideIcon }> = {
  PAGAMENTO: { label: 'Pagamentos', icon: Wallet },
  RISCO: { label: 'Em risco', icon: TriangleAlert },
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

/** Âncoras da própria carteira rolam a página; o resto navega para a tela certa. */
function ActionLink({ path, children }: { path: string; children: ReactNode }) {
  const className =
    'flex h-9 shrink-0 items-center gap-1 rounded-xl border border-white/10 px-3 text-[13px] font-semibold text-k-text-dim transition-colors hover:border-k-primary/45 hover:text-k-primary';
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
 * Caixa de entrada "Hoje": tudo o que pede ação do personal numa lista só,
 * filtrável por tipo, com atalho para a tela onde cada pendência se resolve.
 */
export default function TodayInbox({ items }: { items: TodayItem[] }) {
  const [filter, setFilter] = useState<TodayItemType | 'ALL'>('ALL');
  const [expanded, setExpanded] = useState(false);

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
      className="flex flex-col gap-4 rounded-[20px] border border-k-ghost bg-k-surface1 p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-k-primary-dim text-k-primary">
          <CalendarCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-tight font-stretch-semi-expanded">Hoje</h2>
          <p className="text-[13px] text-k-text-muted">
            {items.length === 0
              ? 'Tudo em dia. Nenhuma pendência por agora.'
              : `${items.length} ${items.length === 1 ? 'pendência' : 'pendências'}${
                  urgent > 0 ? ` · ${urgent} ${urgent === 1 ? 'urgente' : 'urgentes'}` : ''
                }`}
          </p>
        </div>
        {types.length > 1 && (
          <div role="group" aria-label="Filtrar pendências" className="ml-auto flex flex-wrap gap-1 rounded-[14px] border border-k-ghost bg-k-bg p-1">
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
                  className={`relative flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[12.5px] font-semibold transition-colors ${
                    active ? 'text-k-primary' : 'text-k-text-dim hover:text-k-text'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="today-filter-pill"
                      transition={SPRING_PILL}
                      className="absolute inset-0 rounded-[10px] bg-k-primary-dim shadow-[inset_0_0_0_1px_rgba(0,229,255,0.25)]"
                    />
                  )}
                  <span className="relative">{t === 'ALL' ? 'Tudo' : TYPE_META[t].label}</span>
                  <span className="relative text-k-text-muted">{t === 'ALL' ? items.length : counts[t]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col divide-y divide-white/[0.06]">
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
                  className="flex items-center gap-3 py-3"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[item.severity]}`} aria-hidden="true" />
                  <Icon className="h-4 w-4 shrink-0 text-k-text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {item.studentName ? `${item.studentName} · ` : ''}
                      <span className="font-normal text-k-text-soft">{item.title}</span>
                    </p>
                    <p className="truncate text-[12.5px] text-k-text-muted">{item.detail}</p>
                  </div>
                  <ActionLink path={item.actionPath}>
                    Resolver
                    <ChevronRight className="h-3.5 w-3.5" />
                  </ActionLink>
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
          className="self-start text-[13px] font-semibold text-k-primary hover:underline"
        >
          {expanded ? 'Mostrar menos' : `Ver todas (${filtered.length})`}
        </button>
      )}
    </motion.section>
  );
}
