import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Primitivos de dashboard das telas de ROOT, EMPRESA e DONO (estado vazio, grade de
 * KPIs, atalhos), no estilo Kinetic do restante do painel.
 */

/** Card de estado vazio ("em breve" / sem dados) no padrão Kinetic. */
export function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 py-8 md:p-8 md:py-10 rounded-xl border border-dashed border-white/[0.08] text-k-text-muted text-sm leading-relaxed max-w-lg mx-auto">
      <p>{children}</p>
    </div>
  );
}

/**
 * Grade de KPIs. No celular é a faixa 2×2 da visão geral do personal (células
 * separadas por linhas finas; um último item ímpar ocupa a linha toda); do md em
 * diante, cartões soltos.
 */
export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 }) {
  return (
    <div
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] max-md:[&>*:last-child:nth-child(odd)]:col-span-2 md:gap-4 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent ${
        cols === 4 ? 'lg:grid-cols-4' : 'md:grid-cols-3'
      }`}
    >
      {children}
    </div>
  );
}

/** Esqueleto da StatGrid enquanto carrega. */
export function StatGridSkeleton({ cols = 4 }: { cols?: 3 | 4 }) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 max-md:[&>*:last-child:nth-child(odd)]:col-span-2 md:gap-4 ${
        cols === 4 ? 'lg:grid-cols-4' : 'md:grid-cols-3'
      }`}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="k-skeleton h-[84px] rounded-xl bg-k-surface1 md:h-28" />
      ))}
    </div>
  );
}

/** KPI no padrão das telas do personal: rótulo, número em mono e um rodapé opcional (chip + detalhe). */
export function StatTile({
  label,
  value,
  detail,
  chip,
}: {
  label: string;
  value: string;
  detail?: string;
  chip?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 bg-k-bg p-4 md:gap-2.5 md:rounded-xl md:border md:border-white/[0.08] md:bg-transparent md:p-5">
      <span className="truncate text-xs text-k-text-muted md:text-[13px]">{label}</span>
      <span className="font-mono text-2xl font-medium leading-7 tabular-nums md:text-[30px] md:leading-[34px]">{value}</span>
      {/* No celular o detalhe sai (a faixa 2×2 fica alinhada); a variação, se houver, fica. */}
      {(detail || chip) && (
        <div className={`flex items-center gap-2 text-xs text-k-text-muted ${chip ? '' : 'max-md:hidden'}`}>
          {chip}
          <span className="truncate">{detail}</span>
        </div>
      )}
    </div>
  );
}

export interface QuickAction {
  label: string;
  /** Rótulo do atalho no celular (sem ele, usa `label`). */
  short?: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline';
}

/**
 * Atalhos de clique único. Desktop: botões em linha. Celular: blocos iguais lado a
 * lado, ícone em cima e rótulo curto (o primeiro é a ação principal, em ciano).
 */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <>
      <div className={`grid gap-2 md:hidden ${actions.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {actions.map(({ label, short, icon: Icon, onClick }, i) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-k-surface1 px-2 py-3.5 text-xs font-semibold text-k-text-soft transition-colors active:bg-k-surface2"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${
                i === 0 ? 'bg-k-primary text-k-on-primary' : 'bg-k-primary-dim text-k-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="max-w-full truncate">{short ?? label}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 max-md:hidden">
        {actions.map(({ label, icon: Icon, onClick, variant = 'default' }) => (
          <Button key={label} onClick={onClick} variant={variant}>
            <Icon className="w-4 h-4" /> {label}
          </Button>
        ))}
      </div>
    </>
  );
}

/**
 * Bloco de recurso ainda não entregue. Desktop: cartão com título e estado vazio.
 * Celular: uma linha compacta (ícone, título, selo "Em breve" e a frase), sem caixa
 * dentro de caixa.
 */
export function ComingSoonCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] p-4 md:flex md:flex-col md:p-5">
      <div className="flex items-center gap-3.5 md:hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-k-surface2 text-k-text-muted">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{title}</h3>
            <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-k-text-muted">Em breve</span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-k-text-muted">{children}</p>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-2 max-md:hidden">
        <Icon className="w-4 h-4 text-k-text-muted" />
        <h3 className="text-[15px] font-semibold">{title}</h3>
      </div>
      <div className="max-md:hidden">
        <EmptyCard>{children}</EmptyCard>
      </div>
    </div>
  );
}

/** Cartão de gráfico/seção dos painéis de gestão: cabeçalho (ícone opcional, título, subtítulo) + conteúdo. */
export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-white/[0.08] p-4 md:p-5">
      <div className="mb-3 flex items-start gap-2 md:mb-4">
        {Icon && <Icon className="mt-0.5 w-4 h-4 shrink-0 text-k-primary" />}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-k-text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
