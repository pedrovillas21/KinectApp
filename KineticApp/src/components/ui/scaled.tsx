import React, { forwardRef } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from 'react-native';
import { useTextScale } from '../../contexts/TextScaleContext';

/**
 * Multiplica fontSize/lineHeight pelo tamanho de texto escolhido pelo usuário.
 * Texto sem fontSize próprio herda do pai (Text aninhado), por isso não é tocado.
 */
function scaleStyle(style: StyleProp<TextStyle>, factor: number): StyleProp<TextStyle> {
  if (factor === 1) return style;
  const flat = StyleSheet.flatten(style);
  if (!flat?.fontSize) return style;
  return [style, { fontSize: flat.fontSize * factor, lineHeight: flat.lineHeight ? flat.lineHeight * factor : undefined }];
}

/** Drop-in do Text do react-native que respeita o tamanho de texto do app. */
export const Text = forwardRef<Text, TextProps>(function ScaledText(props, ref) {
  const { factor } = useTextScale();
  return <RNText ref={ref} {...props} style={scaleStyle(props.style, factor)} />;
});

/** Drop-in do TextInput do react-native que respeita o tamanho de texto do app. */
export const TextInput = forwardRef<TextInput, TextInputProps>(function ScaledTextInput(props, ref) {
  const { factor } = useTextScale();
  return <RNTextInput ref={ref} {...props} style={scaleStyle(props.style, factor)} />;
});

// Mesmo nome como tipo: `useRef<TextInput>(null)` continua valendo como no react-native.
export type Text = React.ComponentRef<typeof RNText>;
export type TextInput = React.ComponentRef<typeof RNTextInput>;
