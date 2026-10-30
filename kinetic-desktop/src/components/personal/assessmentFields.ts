import type { AssessmentMeasures, PhysicalAssessment } from '../../types';

/**
 * Metadados das medidas da avaliação física — fonte única para o formulário,
 * a aba de avaliações e o relatório de evolução.
 * `better`: para que lado a mudança é boa (cor da variação); neutral = depende do objetivo.
 */
export interface MeasureField {
  key: keyof AssessmentMeasures;
  label: string;
  unit: string;
  group: 'composicao' | 'circunferencias';
  better: 'up' | 'down' | 'neutral';
  /** Casas decimais na exibição. */
  digits: number;
}

export const MEASURE_FIELDS: MeasureField[] = [
  { key: 'weightKg', label: 'Peso', unit: 'kg', group: 'composicao', better: 'neutral', digits: 1 },
  { key: 'heightCm', label: 'Altura', unit: 'cm', group: 'composicao', better: 'neutral', digits: 0 },
  { key: 'bodyFatPct', label: 'Gordura corporal', unit: '%', group: 'composicao', better: 'down', digits: 1 },
  { key: 'muscleMassKg', label: 'Massa muscular', unit: 'kg', group: 'composicao', better: 'up', digits: 1 },
  { key: 'restingHr', label: 'FC de repouso', unit: 'bpm', group: 'composicao', better: 'down', digits: 0 },
  { key: 'chestCm', label: 'Peitoral', unit: 'cm', group: 'circunferencias', better: 'neutral', digits: 1 },
  { key: 'waistCm', label: 'Cintura', unit: 'cm', group: 'circunferencias', better: 'down', digits: 1 },
  { key: 'abdomenCm', label: 'Abdômen', unit: 'cm', group: 'circunferencias', better: 'down', digits: 1 },
  { key: 'hipCm', label: 'Quadril', unit: 'cm', group: 'circunferencias', better: 'neutral', digits: 1 },
  { key: 'armRightCm', label: 'Braço dir.', unit: 'cm', group: 'circunferencias', better: 'neutral', digits: 1 },
  { key: 'armLeftCm', label: 'Braço esq.', unit: 'cm', group: 'circunferencias', better: 'neutral', digits: 1 },
  { key: 'thighRightCm', label: 'Coxa dir.', unit: 'cm', group: 'circunferencias', better: 'neutral', digits: 1 },
  { key: 'thighLeftCm', label: 'Coxa esq.', unit: 'cm', group: 'circunferencias', better: 'neutral', digits: 1 },
  { key: 'calfRightCm', label: 'Panturrilha dir.', unit: 'cm', group: 'circunferencias', better: 'neutral', digits: 1 },
  { key: 'calfLeftCm', label: 'Panturrilha esq.', unit: 'cm', group: 'circunferencias', better: 'neutral', digits: 1 },
];

/** Indicadores calculados mostrados junto das medidas no relatório. */
export const DERIVED_FIELDS: {
  key: 'bmi' | 'fatMassKg' | 'leanMassKg';
  label: string;
  unit: string;
  better: 'up' | 'down' | 'neutral';
}[] = [
  { key: 'bmi', label: 'IMC', unit: '', better: 'neutral' },
  { key: 'fatMassKg', label: 'Massa gorda', unit: 'kg', better: 'down' },
  { key: 'leanMassKg', label: 'Massa magra', unit: 'kg', better: 'up' },
];

const nf = (digits: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: digits });

export const formatMeasure = (value: number | null | undefined, unit: string, digits = 1): string =>
  value === null || value === undefined ? '—' : `${nf(digits).format(value)}${unit ? ` ${unit}` : ''}`;

/** Variação com sinal ("+1,2 kg" / "−0,8 %") e o tom: good/bad/neutral. */
export function delta(
  from: number | null | undefined,
  to: number | null | undefined,
  unit: string,
  better: 'up' | 'down' | 'neutral',
  digits = 1,
): { text: string; tone: 'good' | 'bad' | 'neutral' } | null {
  if (from === null || from === undefined || to === null || to === undefined) return null;
  const diff = Math.round((to - from) * 10 ** digits) / 10 ** digits;
  if (diff === 0) return { text: 'sem mudança', tone: 'neutral' };
  const sign = diff > 0 ? '+' : '−';
  const text = `${sign}${nf(digits).format(Math.abs(diff))}${unit ? ` ${unit}` : ''}`;
  if (better === 'neutral') return { text, tone: 'neutral' };
  const good = better === 'up' ? diff > 0 : diff < 0;
  return { text, tone: good ? 'good' : 'bad' };
}

/** Primeira e última avaliação que têm a medida — base do "antes e depois". */
export function firstAndLast(
  list: PhysicalAssessment[],
  key: keyof PhysicalAssessment,
): { first: PhysicalAssessment; last: PhysicalAssessment } | null {
  const withValue = list.filter((a) => a[key] !== null && a[key] !== undefined);
  if (withValue.length < 1) return null;
  return { first: withValue[0], last: withValue[withValue.length - 1] };
}
