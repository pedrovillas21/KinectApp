import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KINETIC } from '../../theme/kinetic';
import { formatLongDate, greetingFor } from '../../utils/formatters';
import { Avatar, Text } from '../ui';

interface HomeHeaderProps {
  firstName: string;
  /** Nome completo, para as iniciais do avatar. */
  fullName?: string | null;
  userId?: string | number | null;
  onPressAvatar: () => void;
}

/** Data, saudação e atalho para o perfil. */
export default function HomeHeader({ firstName, fullName, userId, onPressAvatar }: HomeHeaderProps) {
  const now = new Date();
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text variant="micro" color={KINETIC.textSecondary} style={styles.date}>
          {formatLongDate(now)}
        </Text>
        <Text variant="display" accessibilityRole="header" numberOfLines={1}>
          {greetingFor(now)}, {firstName}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir meu perfil" onPress={onPressAvatar} hitSlop={4}>
        <Avatar name={fullName ?? firstName} seed={userId ?? fullName} size={40} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },
  texts: { flex: 1, gap: 4 },
  date: { fontSize: 12, letterSpacing: 0.4 },
});
