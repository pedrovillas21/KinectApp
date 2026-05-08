import { StatsPeriodId, StatsPeriodOption } from '../types';

export const STATS_PERIODS: ReadonlyArray<StatsPeriodOption> = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'q', label: '3M' },
  { id: 'year', label: 'Ano' },
];

const PERIOD_DESCRIPTION: Readonly<Record<StatsPeriodId, string>> = {
  week: 'últimos 7 dias',
  month: 'últimos 30 dias',
  q: 'últimos 90 dias',
  year: 'últimos 12 meses',
};

export function periodDescription(period: StatsPeriodId): string {
  return PERIOD_DESCRIPTION[period];
}

export function formatNumberPtBR(value: number, fractionDigits = 1): string {
  return value.toFixed(fractionDigits).replace('.', ',');
}

export function formatSignedNumberPtBR(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumberPtBR(value, fractionDigits)}`;
}

export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
}

/** Volume por grupo: 12.345 → "12,3t", 850 → "850kg". */
export function formatVolumeKg(valueKg: number): string {
  if (valueKg >= 10000) return `${formatNumberPtBR(valueKg / 1000, 0)}t`;
  if (valueKg >= 1000) return `${formatNumberPtBR(valueKg / 1000, 1)}t`;
  return `${Math.round(valueKg)}kg`;
}

/** Tonelagem total: ≥1000 vira "1,2t"; senão "850kg". */
export function formatTotalVolume(valueKg: number): string {
  if (valueKg >= 1000) return `${formatNumberPtBR(valueKg / 1000, 1)}t`;
  return `${Math.round(valueKg)}kg`;
}
