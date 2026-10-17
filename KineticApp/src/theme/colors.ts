import { KINETIC } from './kinetic';

/**
 * Paleta legada. Os valores escuros vêm de `kinetic.ts` para as telas antigas
 * herdarem o redesign; as chaves "Light" ficam por compatibilidade (o app é
 * dark fixo, ver ThemeContext).
 */
export const COLORS = {
  // Brand
  neonBlue: KINETIC.primary,
  white: '#FFFFFF',

  // Dark Mode
  darkBackground: KINETIC.bg,
  darkCard: KINETIC.surface1,
  darkCardHover: KINETIC.surface2,
  textPrimaryDark: KINETIC.text,
  textSecondaryDark: KINETIC.textSecondary,
  borderDark: KINETIC.ghost,

  // Light Mode
  lightBackground: '#F5F5F5',
  lightCard: '#FFFFFF',
  lightCardHover: '#F0F0F0',
  textPrimaryLight: '#131313',
  textSecondaryLight: '#666666',
  borderLight: '#E0E0E0',

  // Utility
  error: '#FF4444',
  success: KINETIC.success,
  transparent: 'transparent',
} as const;
