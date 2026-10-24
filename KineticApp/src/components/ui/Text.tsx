import React from 'react';
import { TextProps as RNTextProps } from 'react-native';
import { Text as ScaledText } from './scaled';
import { KINETIC, TYPE, TypeVariant } from '../../theme/kinetic';

export interface TextProps extends RNTextProps {
  /** Estilo da escala tipográfica (TYPE em kinetic.ts). Default `body`. */
  variant?: TypeVariant;
  /** Cor do texto. Default KINETIC.text. */
  color?: string;
}

/** Texto com a fonte Geist e a escala do redesign. */
export default function Text({ variant = 'body', color = KINETIC.text, style, ...rest }: TextProps) {
  return <ScaledText {...rest} style={[TYPE[variant], { color }, style]} />;
}
