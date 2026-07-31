import type { StatsPeriodId } from '../types';

/** Segmented control de período — reusa os PERIODS do dashboard do personal. */
export const PERIODS: { id: StatsPeriodId; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'q', label: 'Trimestre' },
  { id: 'year', label: 'Ano' },
];

interface Props {
  value: StatsPeriodId;
  onChange: (value: StatsPeriodId) => void;
}

export default function PeriodTabs({ value, onChange }: Props) {
  return (
    <div className="flex gap-1.5 bg-k-surface1 border border-k-ghost p-1 rounded-xl">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            p.id === value
              ? 'bg-k-primary-dim text-k-primary shadow-[inset_0_0_0_1px_rgba(0,229,255,0.15)]'
              : 'text-k-text-muted hover:text-k-text'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
