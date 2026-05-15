/**
 * Tokens visuais da identidade "Kinetic" (Dark + Ciano Neon).
 *
 * Importe estes tokens em telas/componentes do dashboard para manter o
 * padrão Premium consistente (fundo #131313, ciano #00E5FF, tipografia tabular).
 */
export const KINETIC = {
  bg: '#131313',
  surface1: '#1c1b1b',
  surface2: '#2a2a2a',
  surface3: '#353534',

  primary: '#00E5FF',
  primaryDeep: '#00daf3',
  primaryDim: 'rgba(0,229,255,0.10)',
  primarySoft: 'rgba(0,229,255,0.20)',

  text: '#f5f6f7',
  textDim: 'rgba(245,246,247,0.62)',
  textMuted: 'rgba(245,246,247,0.36)',

  ghost: 'rgba(255,255,255,0.08)',
  ghostHi: 'rgba(255,255,255,0.15)',

  success: '#4ade80',
  warn: '#f5b945',

  gold: '#F5C518',
  silver: '#B0B8C1',
  bronze: '#CD7F32',
} as const;

/**
 * Retorna a cor da posição no ranking (ouro/prata/bronze) ou cinza para 4º+.
 */
export const rankingPositionColor = (position: number): string => {
  if (position === 1) return KINETIC.gold;
  if (position === 2) return KINETIC.silver;
  if (position === 3) return KINETIC.bronze;
  return KINETIC.textMuted;
};

/**
 * Background tonal da chip de posição (RGBA do tom medal).
 */
export const rankingPositionChipBg = (position: number): string => {
  if (position === 1) return 'rgba(245,197,24,0.15)';
  if (position === 2) return 'rgba(176,184,193,0.15)';
  if (position === 3) return 'rgba(205,127,50,0.15)';
  return KINETIC.surface2;
};
