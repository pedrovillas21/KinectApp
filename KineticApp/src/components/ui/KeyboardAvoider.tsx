import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import useKeyboardOverlap from '../../hooks/useKeyboardOverlap';

export interface KeyboardAvoiderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  enabled?: boolean;
}

/**
 * Substitui o KeyboardAvoidingView (que no Android edge-to-edge não reage): ocupa o
 * espaço disponível e, com o teclado aberto, reserva embaixo exatamente a parte que
 * ele cobre. ScrollViews dentro encolhem e o Android rola até o campo focado.
 */
export default function KeyboardAvoider({ children, style, enabled = true }: KeyboardAvoiderProps) {
  const { ref, overlap } = useKeyboardOverlap(enabled);
  return (
    <View ref={ref} style={[{ flex: 1 }, style, overlap > 0 ? { paddingBottom: overlap } : null]}>
      {children}
    </View>
  );
}
