import type { MonthlyStatsResponseDTO } from '../../types';

/**
 * Classificação da aderência mensal do aluno — fonte única para cards,
 * filtros e indicadores da carteira do personal.
 *  - low:  abaixo de 40% (precisa de atenção)
 *  - mid:  40–69%
 *  - ok:   70% ou mais
 *  - none: aluno sem frequência semanal definida (targetSessions = 0)
 */
export type AdherenceTone = 'low' | 'none' | 'mid' | 'ok';

export const TONE_META: Record<AdherenceTone, { label: string; color: string; rank: number }> = {
  low: { label: 'Precisa de atenção', color: '#ff6b6b', rank: 0 },
  none: { label: 'Sem meta de frequência', color: '#8e8f90', rank: 1 },
  mid: { label: 'Regular', color: '#f5b945', rank: 2 },
  ok: { label: 'Em dia', color: '#00e5ff', rank: 3 },
};

/** Tom da aderência; null enquanto o dado não chegou (ou falhou). */
export const adherenceTone = (
  stats: MonthlyStatsResponseDTO | null | undefined,
): AdherenceTone | null => {
  if (!stats) return null;
  if (stats.targetSessions <= 0) return 'none';
  if (stats.efficiency >= 70) return 'ok';
  if (stats.efficiency >= 40) return 'mid';
  return 'low';
};

/** Ordem de triagem: quem precisa de atenção aparece primeiro. */
export const toneRank = (tone: AdherenceTone | null): number =>
  tone ? TONE_META[tone].rank : 99;
