import type { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import type { MetricDeltaDTO } from '../types';

/**
 * Primitivos de dashboard compartilhados (extraídos do DashboardTab). Reusados
 * nas Homes de PERSONAL, ROOT e EMPRESA para um visual coeso. Estilo Kinetic
 * (tokens de marca) — o mesmo do restante do painel.
 */

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** Card de estado vazio ("em breve" / sem dados) no padrão Kinetic. */
export function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-10 rounded-2xl bg-k-surface2/30 border border-dashed border-k-ghost text-k-text-muted text-xs leading-relaxed max-w-lg mx-auto gap-2">
      <HelpCircle className="w-6 h-6 text-k-text-muted/60" />
      <p>{children}</p>
    </div>
  );
}

/** Chip de variação (▲/▼/·) colorido por "good" (favorável ou não). */
export function DeltaChip({
  delta,
  good,
  suffix,
}: {
  delta: number;
  good?: boolean | null;
  suffix: string;
}) {
  const sign = delta > 0 ? '+' : '';
  const isZeroOrNull = delta === 0 || good == null;
  const isPositive = delta > 0;

  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
        isZeroOrNull
          ? 'bg-k-surface2 text-k-text-dim border border-k-ghost'
          : good
            ? 'bg-k-success/10 text-k-success border border-k-success/20'
            : 'bg-k-warn/10 text-k-warn border border-k-warn/20'
      }`}
    >
      <span>{delta === 0 ? '·' : isPositive ? '▲' : '▼'}</span>
      <span>
        {sign}
        {nf.format(delta)}
        {suffix}
      </span>
    </span>
  );
}

/** KPI tile: rótulo, valor grande, ícone e um rodapé opcional (chip + detalhe). */
export function StatTile({
  label,
  value,
  detail,
  chip,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  chip?: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 p-5 rounded-2xl bg-k-surface1/60 border border-k-ghost hover:border-k-ghost-hi hover:bg-k-surface1 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-k-text-muted uppercase tracking-wider">{label}</span>
          <span className="text-2xl font-black tracking-tight text-white">{value}</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-k-surface2 border border-k-ghost flex items-center justify-center text-k-text-dim">
          {icon}
        </div>
      </div>
      {(detail || chip) && (
        <div className="flex items-center gap-2 text-xs text-k-text-dim border-t border-k-ghost/40 pt-3 mt-1">
          {chip}
          <span className="truncate">{detail}</span>
        </div>
      )}
    </div>
  );
}

/** Linha comparativa "anterior → atual" com chip de variação. */
export function MetricRow({
  label,
  metric,
  unit,
}: {
  label: string;
  metric: MetricDeltaDTO | null;
  unit: string;
}) {
  if (!metric) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-k-surface2/30 border border-k-ghost/40">
      <span className="text-xs font-bold text-k-text-dim">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-k-text-muted">
          {nf.format(metric.previous)} → <strong className="text-white font-extrabold">{nf.format(metric.current)}</strong>{' '}
          {unit}
        </span>
        <DeltaChip delta={metric.delta} good={metric.good} suffix={unit === '%' ? '%' : ` ${unit}`} />
      </div>
    </div>
  );
}
