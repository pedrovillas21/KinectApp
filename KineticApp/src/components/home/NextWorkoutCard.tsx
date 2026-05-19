import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { KINETIC } from '../../theme/kinetic';
import type { NextWorkoutDTO } from '../../types';

interface NextWorkoutCardProps {
  workout: NextWorkoutDTO;
  onStart: () => void;
}

export default function NextWorkoutCard({ workout, onStart }: NextWorkoutCardProps) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[KINETIC.primary, KINETIC.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topAccent}
      />

      <View style={styles.body}>
        <View style={styles.tagWrap}>
          <Text style={styles.tagText}>{workout.tag}</Text>
        </View>

        <Text style={styles.name}>{workout.name}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Svg width={12} height={12} viewBox="0 0 24 24">
              <Circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke={KINETIC.textDim}
                strokeWidth={2}
              />
              <Polyline
                points="12 6 12 12 16 14"
                fill="none"
                stroke={KINETIC.textDim}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.metaText}>{workout.durationInMinutes} min</Text>
          </View>

          <View style={styles.metaItem}>
            <Svg width={12} height={12} viewBox="0 0 24 24">
              <Path
                d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12"
                fill="none"
                stroke={KINETIC.textDim}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.metaText}>{workout.exerciseCount} exercícios</Text>
          </View>
        </View>

        <Text style={styles.muscles} numberOfLines={1}>
          {workout.muscleGroups.join(' · ')}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Começar treino"
          onPress={onStart}
          style={({ pressed }) => [styles.ctaWrap, pressed && styles.ctaPressed]}
        >
          <LinearGradient
            colors={[KINETIC.primary, KINETIC.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Começar treino</Text>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="M5 3l14 9-14 9V3z"
                fill="#001a1f"
                stroke="#001a1f"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: KINETIC.surface1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: KINETIC.primary,
    shadowOpacity: 0.18,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  topAccent: {
    height: 3,
    width: '100%',
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  tagWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: KINETIC.primaryDim,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: KINETIC.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: KINETIC.text,
    letterSpacing: -0.7,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: KINETIC.textDim,
    fontWeight: '500',
  },
  muscles: {
    marginTop: 4,
    fontSize: 11,
    color: KINETIC.textMuted,
  },
  ctaWrap: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: KINETIC.primary,
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  ctaText: {
    color: '#001a1f',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
