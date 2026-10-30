import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import Text from './Text';
import { useColors } from '../../theme/ThemeContext';

export interface SectionHeaderProps {
  title: string;
  /** Legenda curta abaixo do título. */
  caption?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Título de seção com ação opcional à direita ("Ver tudo"). */
export default function SectionHeader({ title, caption, actionLabel, onAction, style }: SectionHeaderProps) {
  const c = useColors();
  return (
    <View style={[styles.row, style]}>
      <View style={styles.texts}>
        <Text variant="headline" accessibilityRole="header">
          {title}
        </Text>
        {caption ? (
          <Text variant="caption" color={c.textSecondary}>
            {caption}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={10} style={styles.action}>
          <Text variant="captionStrong" color={c.primary}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, gap: 12 },
  texts: { flex: 1, gap: 2 },
  action: { minHeight: 32, justifyContent: 'center' },
});
