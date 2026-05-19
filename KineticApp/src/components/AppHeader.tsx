import React from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { KINETIC } from '../theme/kinetic';

interface AppHeaderProps {
  /** Sequência atual de dias consecutivos. Quando > 0, exibe a chip de streak. */
  streakDays?: number;
  /** Callback do botão de notificações. */
  onPressNotifications?: () => void;
  /** Quando true, exibe o badge de notificações não-lidas. */
  hasUnreadNotifications?: boolean;
}

export default function AppHeader({
  streakDays = 0,
  onPressNotifications,
  hasUnreadNotifications = false,
}: AppHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.brand}>KINETIC</Text>

      <View style={styles.rightCluster}>
        {streakDays > 0 && (
          <View style={styles.streakChip}>
            <Svg width={12} height={12} viewBox="0 0 24 24">
              <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={KINETIC.gold} />
            </Svg>
            <Text style={styles.streakText}>{streakDays} dias</Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notificações"
          onPress={onPressNotifications}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.notifBtn}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path
              d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
              fill="none"
              stroke={KINETIC.textDim}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M13.73 21a2 2 0 01-3.46 0"
              fill="none"
              stroke={KINETIC.textDim}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          {hasUnreadNotifications && <View style={styles.notifDot} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 14 : 14,
    paddingBottom: 14,
    backgroundColor: KINETIC.bg,
  },
  brand: {
    color: KINETIC.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(245,197,24,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.25)',
  },
  streakText: {
    color: KINETIC.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.neonBlue,
  },
});
