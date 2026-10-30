/**
 * Datas "puras" do backend (LocalDate, "AAAA-MM-DD") sem passar por UTC:
 * `new Date("2026-10-10")` vira 09/10 às 21h no Brasil e mostraria o dia errado.
 */

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** "2026-10-10" → "10/10". */
export const dayMonth = (iso: string): string =>
  parseLocalDate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

/** "2026-10-10" → "10/10/2026". */
export const fullDate = (iso: string): string => parseLocalDate(iso).toLocaleDateString('pt-BR');

/** "2026-10" → "Outubro de 2026". */
export function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const raw = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Soma meses a "AAAA-MM". */
export function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Hoje em "AAAA-MM-DD" no fuso local. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Dia de hoje menos `days`, em "AAAA-MM-DD" no fuso local. */
export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Instante do backend → "10/10/2026 14:30" no fuso do navegador. */
export const dateTimeLabel = (iso: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(iso))
    .replace(',', '');

/** Data/hora do backend ("2026-10-10T14:30:00") → "10/10/2026". */
export const dateLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Instante do backend → "10 de outubro"; null → "". */
export const dayMonthLong = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : '';

/** Dias inteiros até `iso` (0 = hoje ou já passou). */
export const daysUntil = (iso: string | null): number =>
  iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)) : 0;
