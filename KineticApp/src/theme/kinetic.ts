/**
 * Tokens visuais da identidade "Kinetic" (Dark + Ciano Neon).
 *
 * Fonte única de cor, raio, fonte e tipografia do app. `colors.ts` e
 * `statsTokens.ts` reexportam daqui para as telas antigas herdarem a paleta
 * do redesign sem precisar ser reescritas.
 */
export const KINETIC = {
  bg: '#131313',
  surface1: '#1c1b1b',
  surface2: '#2a2a2a',
  surface3: '#353534',
  /** Superfície elevada sobre surface1 (segmento ativo, placeholder de mídia). */
  surfaceRaised: '#2c2b2b',
  /** Placeholder de imagem/mídia dentro de um card. */
  media: '#1f1e1e',

  primary: '#00E5FF',
  primaryDeep: '#00daf3',
  primaryDim: 'rgba(0,229,255,0.10)',
  primarySoft: 'rgba(0,229,255,0.20)',
  /** Texto/ícone sobre fundo primary. */
  onPrimary: '#00262b',

  text: '#f5f6f7',
  textDim: 'rgba(245,246,247,0.62)',
  /** Legendas, metadados (contraste ≥ 4.5:1 sobre bg/surface1). */
  textSecondary: 'rgba(245,246,247,0.55)',
  textMuted: 'rgba(245,246,247,0.36)',
  /** Placeholder de campo: 4.5:1 sobre bg/surface1 (textMuted não passa; leitura com vista cansada). */
  placeholder: 'rgba(245,246,247,0.5)',

  ghost: 'rgba(255,255,255,0.08)',
  ghostHi: 'rgba(255,255,255,0.15)',
  /** Linha divisória fina (listas, topo da tab bar). */
  hairline: 'rgba(255,255,255,0.07)',
  /** Véu atrás de diálogos. */
  scrim: 'rgba(0,0,0,0.7)',

  success: '#4ade80',
  successBg: '#1f3326',
  warn: '#f5b945',
  /** Recordes / conquistas. */
  record: '#F5B13D',
  recordBg: '#3a2f1c',
  danger: '#ff6b6b',
  dangerDim: 'rgba(255,107,107,0.12)',

  gold: '#F5C518',
  silver: '#B0B8C1',
  bronze: '#CD7F32',
} as const;

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  dialog: 20,
  pill: 999,
} as const;

/**
 * Famílias carregadas em App.tsx (useFonts). No Android `fontWeight` não troca
 * de arquivo em fonte custom, então cada peso é uma família própria.
 */
export const FONT = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
  monoSemibold: 'GeistMono_600SemiBold',
} as const;

/** Escala tipográfica do redesign (tamanhos do canvas "Kinetic Mobile Redesign"). */
export const TYPE = {
  display: { fontFamily: FONT.semibold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  title: { fontFamily: FONT.semibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  headline: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontFamily: FONT.semibold, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: FONT.medium, fontSize: 14, lineHeight: 20 },
  input: { fontFamily: FONT.regular, fontSize: 15, lineHeight: 20 },
  label: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16 },
  captionStrong: { fontFamily: FONT.semibold, fontSize: 12, lineHeight: 16 },
  micro: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 14 },
  stat: { fontFamily: FONT.monoSemibold, fontSize: 20, lineHeight: 26 },
  statSmall: { fontFamily: FONT.monoMedium, fontSize: 15, lineHeight: 20 },
  mono: { fontFamily: FONT.mono, fontSize: 12, lineHeight: 16 },
  monoBody: { fontFamily: FONT.mono, fontSize: 13, lineHeight: 18 },
} as const;

export type TypeVariant = keyof typeof TYPE;

/** Pares fundo/letra para avatares sem foto (iniciais), escolhidos por id. */
export const AVATAR_TONES = [
  { bg: '#263234', fg: '#00E5FF' },
  { bg: '#3a2f1c', fg: '#F5B13D' },
  { bg: '#1f3326', fg: '#4ade80' },
  { bg: '#262a3a', fg: '#a5b4fc' },
  { bg: '#3a2430', fg: '#f9a8d4' },
] as const;

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
 * Cor do avatar de presença: TRAINING=verde, ONLINE=ciano, OFFLINE=cinza.
 */
export const presenceColor = (status: 'TRAINING' | 'ONLINE' | 'OFFLINE'): string => {
  if (status === 'TRAINING') return KINETIC.success;
  if (status === 'ONLINE') return KINETIC.primary;
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
