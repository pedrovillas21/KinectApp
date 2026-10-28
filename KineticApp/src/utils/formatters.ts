const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** "Quinta, 16 de outubro" (sem depender do Intl do Hermes). */
export function formatLongDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/** "15 out 2026" a partir de um instante ISO; null se inválido. */
export function formatDayMonthYear(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

/** Letra do dia da semana para faixas compactas: D S T Q Q S S. */
export function weekdayLetter(date: Date): string {
  return 'DSTQQSS'[date.getDay()];
}

/** Lê "YYYY-MM-DD" como data local (new Date('2026-10-16') seria UTC e pode cair no dia anterior). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Inteiro com separador de milhar pt-BR: 7820 → "7.820". */
export function formatThousands(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "Bom dia" / "Boa tarde" / "Boa noite" pela hora local. */
export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5 || h >= 18) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  return 'Boa tarde';
}

/** Minutos → "58min" / "4h 20min" / "2h". */
export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes);
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${h}h`;
}

/** Segundos de treino → "58min" / "1h 05min". */
export function formatDurationSeconds(seconds: number): string {
  return formatMinutes(seconds / 60);
}

/** Segundos → relógio "58:12" / "1:05:09". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Carga em kg sem casas desnecessárias: 80 → "80", 22.5 → "22,5". */
export function formatKg(weightKg: number): string {
  return Number.isInteger(weightKg) ? String(weightKg) : weightKg.toFixed(1).replace('.', ',');
}

/** Melhor série: "80 kg × 8"; carga 0 = peso corporal → "12 reps". */
export function formatBestSet(best: { weightKg: number; reps: number } | null | undefined): string {
  if (!best) return '';
  if (best.weightKg <= 0) return `${best.reps} reps`;
  return `${formatKg(best.weightKg)} kg × ${best.reps}`;
}

const MONTHS_SHORT_LABEL = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Meses distintos das semanas (YYYY-MM-DD), em ordem: rótulos do eixo dos gráficos de 12 semanas. */
export function monthLabels(weekStarts: string[]): string[] {
  const labels: string[] = [];
  for (const iso of weekStarts) {
    const label = MONTHS_SHORT_LABEL[parseLocalDate(iso).getMonth()];
    if (labels[labels.length - 1] !== label) labels.push(label);
  }
  return labels;
}

/** "março de 2026". */
export function formatMonthYear(iso: string): string {
  const d = parseLocalDate(iso);
  return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "02 out" para datas de recorde. */
export function formatShortDate(iso: string): string {
  const d = parseLocalDate(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT_LABEL[d.getMonth()]}`;
}

/** "jun 2026" a partir de uma data ISO (só a parte YYYY-MM-DD importa). */
export function formatMonthShortYear(iso: string): string {
  const d = parseLocalDate(iso);
  return `${MONTHS_SHORT_LABEL[d.getMonth()]} ${d.getFullYear()}`;
}
