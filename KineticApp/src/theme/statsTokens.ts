/**
 * Design tokens da aba "Sua Evolução" (Stats).
 *
 * Espelham o objeto `T` do mock HTML/JSX original e são compartilhados por
 * StatsScreen e PlanEvolutionCard para evitar duplicação. Mantêm uma paleta
 * própria, mais escura que a identidade Kinetic padrão (`kinetic.ts`), pensada
 * para os cards de gráficos e métricas dessa tela.
 */
export const STATS_T = {
  bg: '#0a0d10',
  card: '#15191d',
  cardSoft: '#1b2025',
  border: 'rgba(255,255,255,0.06)',
  borderSoft: 'rgba(255,255,255,0.04)',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.62)',
  text3: 'rgba(245,246,247,0.34)',
  accent: '#1ee0ee',
  accentDim: 'rgba(30,224,238,0.10)',
  accentSoft: 'rgba(30,224,238,0.16)',
  success: '#4ade80',
  successDim: 'rgba(74,222,128,0.14)',
  warn: '#f5b945',
  warnDim: 'rgba(245,185,69,0.14)',
} as const;
