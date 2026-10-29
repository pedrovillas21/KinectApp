import { StyleSheet, ViewStyle } from 'react-native';

/**
 * Tokens visuais da identidade "Kinetic" (Ciano Neon), em escuro e claro.
 *
 * Fonte única de cor, sombra, raio, fonte e tipografia do app. As telas leem a
 * paleta ativa via `useColors()` / `createStyles()` (theme/ThemeContext).
 */
const DARK = {
  bg: '#131313',
  surface1: '#1c1b1b',
  surface2: '#2a2a2a',
  surface3: '#353534',
  /** Superfície elevada sobre surface1 (segmento ativo, placeholder de mídia). */
  surfaceRaised: '#2c2b2b',
  /** Placeholder de imagem/mídia dentro de um card. */
  media: '#1f1e1e',

  /** Texto, ícone, borda e seleção em ciano. */
  primary: '#00E5FF',
  primaryDim: 'rgba(0,229,255,0.10)',
  primarySoft: 'rgba(0,229,255,0.20)',
  /** Ciano a meia força (barras de gráfico, borda de destaque). */
  primaryMid: 'rgba(0,229,255,0.40)',
  /** Preenchimento de botão/CTA: o neon da marca nos dois temas. */
  primaryFill: '#00E5FF',
  /** Fim dos gradientes de CTA. */
  primaryFillEnd: '#00bcd4',
  primaryDeep: '#00daf3',
  /** Texto/ícone sobre primaryFill. */
  onPrimary: '#00262b',

  text: '#f5f6f7',
  textDim: 'rgba(245,246,247,0.62)',
  /** Legendas, metadados (contraste ≥ 4.5:1 sobre bg/surface1). */
  textSecondary: 'rgba(245,246,247,0.55)',
  textMuted: 'rgba(245,246,247,0.36)',
  /** Placeholder de campo: 4.5:1 sobre bg/surface1 (textMuted não passa; leitura com vista cansada). */
  placeholder: 'rgba(245,246,247,0.5)',

  /** Fundo de ícone/botão secundário, toque pressionado, ripple. */
  subtle: 'rgba(255,255,255,0.05)',
  /** Divisor dentro de card. */
  divider: 'rgba(255,255,255,0.06)',
  /** Linha divisória fina (listas, topo da tab bar). */
  hairline: 'rgba(255,255,255,0.07)',
  ghost: 'rgba(255,255,255,0.08)',
  /** Divisor de lista, borda de campo, grade de gráfico. */
  border: 'rgba(255,255,255,0.1)',
  ghostHi: 'rgba(255,255,255,0.15)',
  /** Contorno de botão outline. */
  borderStrong: 'rgba(255,255,255,0.2)',
  /** Véu atrás de diálogos. */
  scrim: 'rgba(0,0,0,0.7)',

  success: '#4ade80',
  successBg: '#1f3326',
  successDim: 'rgba(74,222,128,0.12)',
  successSoft: 'rgba(74,222,128,0.28)',
  /** Texto sobre fundo success (botão WhatsApp). */
  onSuccess: '#062012',
  warn: '#f5b945',
  warnDim: 'rgba(245,185,69,0.10)',
  warnSoft: 'rgba(245,185,69,0.22)',
  /** Recordes / conquistas. */
  record: '#F5B13D',
  danger: '#ff6b6b',
  dangerDim: 'rgba(255,107,107,0.12)',
  /** 4ª cor categórica de gráfico (Core). */
  indigo: '#a5b4fc',

  gold: '#F5C518',
  silver: '#B0B8C1',
  bronze: '#CD7F32',
};

export type Palette = { [K in keyof typeof DARK]: string };
export type ColorScheme = 'light' | 'dark';

/**
 * Claro: hierarquia por fundo cinza-frio + card branco com sombra (SHADOWS), não
 * por brilho. Ciano neon dá 1.5:1 no branco, então texto/ícone usa teal escuro e
 * o neon fica só como preenchimento (primaryFill). Contrastes: texto ≥ 4.5:1 e
 * textMuted ≥ 3:1 sobre bg (#F4F5F7) e surface1 (#FFF).
 */
const LIGHT: Palette = {
  bg: '#F4F5F7',
  surface1: '#FFFFFF',
  surface2: '#ECEEF1',
  surface3: '#E1E4E8',
  surfaceRaised: '#FFFFFF',
  media: '#E6E8EB',

  primary: '#00727F',
  primaryDim: 'rgba(0,114,127,0.10)',
  primarySoft: 'rgba(0,114,127,0.18)',
  primaryMid: 'rgba(0,114,127,0.40)',
  primaryFill: '#00E5FF',
  primaryFillEnd: '#00bcd4',
  primaryDeep: '#00daf3',
  onPrimary: '#00262b',

  text: '#101418',
  textDim: '#3F464D',
  textSecondary: '#5A6169',
  textMuted: '#7A818A',
  placeholder: '#5F666E',

  subtle: 'rgba(16,20,24,0.05)',
  divider: 'rgba(16,20,24,0.08)',
  hairline: 'rgba(16,20,24,0.08)',
  ghost: 'rgba(16,20,24,0.06)',
  border: 'rgba(16,20,24,0.10)',
  ghostHi: 'rgba(16,20,24,0.12)',
  borderStrong: 'rgba(16,20,24,0.22)',
  scrim: 'rgba(10,12,14,0.45)',

  success: '#137A3A',
  successBg: '#DCF5E4',
  successDim: 'rgba(19,122,58,0.10)',
  successSoft: 'rgba(19,122,58,0.22)',
  onSuccess: '#FFFFFF',
  warn: '#A84A08',
  warnDim: 'rgba(168,74,8,0.10)',
  warnSoft: 'rgba(168,74,8,0.18)',
  record: '#995C00',
  danger: '#C42727',
  dangerDim: 'rgba(196,39,39,0.10)',
  indigo: '#4F5BD5',

  gold: '#8C6A00',
  silver: '#5E6672',
  bronze: '#A0612A',
};

export const PALETTES: Record<ColorScheme, Palette> = { dark: DARK, light: LIGHT };

const NO_SHADOW: ViewStyle = {};

/** Elevação: no escuro a diferença de superfície basta; no claro o card precisa de sombra. */
export const SHADOWS: Record<ColorScheme, Record<'card' | 'raised' | 'dialog', ViewStyle>> = {
  dark: {
    card: NO_SHADOW,
    raised: NO_SHADOW,
    dialog: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 24 }, elevation: 24 },
  },
  light: {
    // Contorno fino junto da sombra: no iOS a sombra some em card com overflow hidden.
    card: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(16,20,24,0.08)',
    },
    raised: { shadowColor: '#0F172A', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
    dialog: { shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  },
};
export type Shadows = (typeof SHADOWS)['dark'];

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
export const AVATAR_TONES: Record<ColorScheme, readonly { bg: string; fg: string }[]> = {
  dark: [
    { bg: '#263234', fg: '#00E5FF' },
    { bg: '#3a2f1c', fg: '#F5B13D' },
    { bg: '#1f3326', fg: '#4ade80' },
    { bg: '#262a3a', fg: '#a5b4fc' },
    { bg: '#3a2430', fg: '#f9a8d4' },
  ],
  light: [
    { bg: '#D9F3F6', fg: '#00626D' },
    { bg: '#F8E9CF', fg: '#7A4A00' },
    { bg: '#DCF5E4', fg: '#106632' },
    { bg: '#E3E6F8', fg: '#3F47A8' },
    { bg: '#F8E1EC', fg: '#9A2E62' },
  ],
};

/**
 * Retorna a cor da posição no ranking (ouro/prata/bronze) ou cinza para 4º+.
 */
export const rankingPositionColor = (position: number, c: Palette): string => {
  if (position === 1) return c.gold;
  if (position === 2) return c.silver;
  if (position === 3) return c.bronze;
  return c.textMuted;
};

/**
 * Background tonal da chip de posição (RGBA do tom medal).
 */
export const rankingPositionChipBg = (position: number, c: Palette): string => {
  if (position === 1) return 'rgba(245,197,24,0.15)';
  if (position === 2) return 'rgba(176,184,193,0.15)';
  if (position === 3) return 'rgba(205,127,50,0.15)';
  return c.surface2;
};
