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
