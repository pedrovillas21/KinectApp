import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import { KINETIC } from '../../theme/kinetic';

interface AdherenceCardProps {
  /** Sessões concluídas no mês. */
  completed: number;
  /** Meta de sessões do mês. */
  target: number;
}

const RING_RADIUS = 26;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

export default function AdherenceCard({ completed, target }: AdherenceCardProps) {
  const safeCompleted = Math.max(completed, 0);
  const safeTarget = Math.max(target, 1);
  const ratio = Math.min(safeCompleted / safeTarget, 1);
  const percent = Math.round(ratio * 100);
  const remaining = Math.max(target - safeCompleted, 0);

  return (
    <View style={styles.card}>
      <View style={styles.ring}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          <Defs>
            <LinearGradient id="adhrGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={KINETIC.primary} />
              <Stop offset="100%" stopColor={KINETIC.primaryDeep} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={32}
            cy={32}
            r={RING_RADIUS}
            fill="none"
            stroke={KINETIC.ghost}
            strokeWidth={7}
          />
          <Circle
            cx={32}
            cy={32}
            r={RING_RADIUS}
            fill="none"
            stroke="url(#adhrGrad)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRC * ratio} ${RING_CIRC * (1 - ratio)}`}
            transform="rotate(-90 32 32)"
          />
        </Svg>

        <View style={styles.ringCenter} pointerEvents="none">
          <Text style={styles.ringValue}>{completed}</Text>
          <Text style={styles.ringTarget}>/{target}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.label}>ADERÊNCIA DO MÊS</Text>
        <View style={styles.percentRow}>
          <Text style={styles.percentValue}>{percent}</Text>
          <Text style={styles.percentSign}>%</Text>
        </View>

        <View style={styles.barTrack}>
          <RNLinearGradient
            colors={[KINETIC.primary, KINETIC.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.barFill, { width: `${percent}%` }]}
          />
        </View>

        <Text style={styles.remaining}>
          {target === 0
            ? 'Defina sua meta para acompanhar a aderência.'
            : `${remaining} treinos restantes no mês`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: KINETIC.surface1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ring: {
    width: 64,
    height: 64,
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 14,
    fontWeight: '800',
    color: KINETIC.text,
    letterSpacing: -0.4,
    lineHeight: 14,
  },
  ringTarget: {
    fontSize: 9,
    color: KINETIC.textMuted,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    color: KINETIC.textDim,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  percentValue: {
    fontSize: 24,
    fontWeight: '800',
    color: KINETIC.text,
    letterSpacing: -0.7,
    lineHeight: 26,
  },
  percentSign: {
    marginLeft: 2,
    fontSize: 14,
    fontWeight: '500',
    color: KINETIC.textMuted,
    lineHeight: 18,
  },
  barTrack: {
    marginTop: 6,
    height: 4,
    borderRadius: 99,
    backgroundColor: KINETIC.ghost,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
  },
  remaining: {
    marginTop: 4,
    fontSize: 11,
    color: KINETIC.textDim,
  },
});
