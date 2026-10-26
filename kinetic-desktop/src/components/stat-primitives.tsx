import type { ReactNode } from 'react';
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
    <div className="flex flex-col items-center justify-center text-center p-8 py-10 rounded-xl border border-dashed border-white/[0.08] text-k-text-muted text-sm leading-relaxed max-w-lg mx-auto">
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
      className={`text-[11px] font-medium font-mono px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
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
    <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.08] p-5">
      <span className="text-[13px] text-k-text-muted">{label}</span>
      <span className="font-mono text-[30px] font-medium leading-[34px] tabular-nums">{value}</span>
      {(detail || chip) && (
        <div className="flex items-center gap-2 text-xs text-k-text-muted">
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-white/[0.08]">
      <span className="text-sm text-k-text-dim">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-k-text-muted">
          {nf.format(metric.previous)} → <strong className="font-mono font-medium text-k-text">{nf.format(metric.current)}</strong>{' '}
          {unit}
        </span>
        <DeltaChip delta={metric.delta} good={metric.good} suffix={unit === '%' ? '%' : ` ${unit}`} />
      </div>
    </div>
  );
}
