import { KINETIC } from './kinetic';

/**
 * Design tokens da aba "Progresso" (Stats).
 *
 * Compartilhados por StatsScreen e PlanEvolutionCard. Desde o redesign
 * apontam para a paleta única de `kinetic.ts`; o objeto continua existindo
 * para não precisar reescrever as telas que o usam.
 */
export const STATS_T = {
  bg: KINETIC.bg,
  card: KINETIC.surface1,
  cardSoft: KINETIC.surface2,
  border: 'rgba(255,255,255,0.06)',
  borderSoft: 'rgba(255,255,255,0.04)',
  text: KINETIC.text,
  text2: KINETIC.textDim,
  text3: KINETIC.textMuted,
  accent: KINETIC.primary,
  accentDim: KINETIC.primaryDim,
  accentSoft: KINETIC.primarySoft,
  success: KINETIC.success,
  successDim: 'rgba(74,222,128,0.14)',
  warn: KINETIC.warn,
  warnDim: 'rgba(245,185,69,0.14)',
} as const;
