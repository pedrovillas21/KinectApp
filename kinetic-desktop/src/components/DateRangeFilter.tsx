import { formInputClass } from './personal/FormDialog';
import { cn } from '../utils/cn';
import { todayIso } from '../utils/dates';

interface Props {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

/** Período em dias ("AAAA-MM-DD"), para os filtros das telas de gestão. Nenhuma data no futuro. */
export default function DateRangeFilter({ from, to, onChange }: Props) {
  const today = todayIso();
  const input = cn(formInputClass, 'h-9 min-w-0 flex-1 rounded-[10px] px-3 text-sm sm:w-[150px] sm:flex-none');
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Período">
      <input
        type="date"
        aria-label="De"
        value={from}
        max={to || today}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className={input}
      />
      <span className="text-xs text-k-text-muted">até</span>
      <input
        type="date"
        aria-label="Até"
        value={to}
        min={from || undefined}
        max={today}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className={input}
      />
    </div>
  );
}
