import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Icon from '../Icon';
import Text from './Text';
import { useColors } from '../../theme/ThemeContext';

export interface StackHeaderProps {
  title?: string;
  onBack: () => void;
  /** Botão à direita (ex.: "Mais opções"). */
  right?: React.ReactNode;
}

/** Cabeçalho de tela empilhada: voltar, título centralizado, ação opcional. */
export default function StackHeader({ title, onBack, right }: StackHeaderProps) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} hitSlop={6} style={styles.side}>
        <Icon name="arrow-left" size={22} color={c.text} strokeWidth={1.9} />
      </Pressable>
      <Text variant="label" numberOfLines={1} accessibilityRole="header" style={styles.title}>
        {title ?? ''}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  side: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center' },
});
