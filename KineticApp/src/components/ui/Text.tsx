import React from 'react';
import { TextProps as RNTextProps } from 'react-native';
import { Text as ScaledText } from './scaled';
import { TYPE, TypeVariant } from '../../theme/kinetic';
import { useColors } from '../../theme/ThemeContext';

export interface TextProps extends RNTextProps {
  /** Estilo da escala tipográfica (TYPE em kinetic.ts). Default `body`. */
  variant?: TypeVariant;
  /** Cor do texto. Default c.text. */
  color?: string;
}

/** Texto com a fonte Geist e a escala do redesign. */
export default function Text({ variant = 'body', color, style, ...rest }: TextProps) {
  const c = useColors();
  color ??= c.text;
  return <ScaledText {...rest} style={[TYPE[variant], { color }, style]} />;
}
