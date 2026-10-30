import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FONT } from '../../theme/kinetic';
import { formatLongDate, greetingFor } from '../../utils/formatters';
import { Avatar, Text } from '../ui';
import { createStyles, useColors } from '../../theme/ThemeContext';

interface HomeHeaderProps {
  firstName: string;
  /** Nome completo, para as iniciais do avatar. */
  fullName?: string | null;
  userId?: string | number | null;
  onPressAvatar: () => void;
}

/** Marca Kinetic (só na Início, como Instagram/Strava), depois data e saudação. */
export default function HomeHeader({ firstName, fullName, userId, onPressAvatar }: HomeHeaderProps) {
  const styles = useStyles();
  const c = useColors();
  const now = new Date();
  return (
    <View>
      <View style={styles.brandRow}>
        <View style={styles.brand} accessible accessibilityRole="header" accessibilityLabel="Kinetic">
          <Svg width={26} height={20} viewBox="0 0 26 20">
            <Path d="M6 0h6L6 20H0z" fill={c.primary} />
            <Path d="M15 0h6l-6 20H9z" fill={c.primary} opacity={0.55} />
            <Path d="M24 0h2l-6 20h-2z" fill={c.primary} opacity={0.25} />
          </Svg>
          <Text style={styles.wordmark}>KINETIC</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir meu perfil"
          onPress={onPressAvatar}
          style={styles.avatarHit}
        >
          <Avatar name={fullName ?? firstName} seed={userId ?? fullName} size={34} />
        </Pressable>
      </View>
      <View style={styles.texts}>
        <Text variant="micro" color={c.textSecondary} style={styles.date}>
          {formatLongDate(now)}
        </Text>
        <Text variant="title" numberOfLines={1}>
          {greetingFor(now)}, {firstName}
        </Text>
      </View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 12,
    paddingTop: 10,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  // Geist não tem itálico carregado: o skew dá a inclinação da marca nas duas plataformas.
  wordmark: {
    fontFamily: FONT.bold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 1.2,
    transform: [{ skewX: '-10deg' }],
  },
  avatarHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  texts: { gap: 3, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  date: { fontSize: 12, letterSpacing: 0.4 },
}));
