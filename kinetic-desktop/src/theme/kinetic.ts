/**
 * Tokens visuais da identidade "Kinetic" (Dark + Ciano Neon) — cópia dos
 * tokens do mobile (KineticApp/src/theme/kinetic.ts). Os mesmos valores são
 * expostos como CSS variables em theme.css; use o objeto TS para estilos
 * inline e as variables para CSS estático.
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
