import React from 'react';
import { StyleSheet, View } from 'react-native';
import { KINETIC, RADIUS } from '../../theme/kinetic';
import type { NextWorkoutDTO } from '../../types';
import { Avatar, Button, Text } from '../ui';

interface TodayWorkoutCardProps {
  workout: NextWorkoutDTO;
  onStart: () => void;
  /** Falso enquanto a ficha completa não carregou (não dá para iniciar a sessão). */
  canStart: boolean;
}

const setsLabel = (sets: number | null, reps: string | null): string => {
  if (sets && reps) return `${sets} × ${reps.replace('-', '–')}`;
  if (sets) return `${sets} séries`;
  return reps ?? '';
};

/** "Treino de hoje": nome, primeiros exercícios, iniciar e quem prescreveu. */
export default function TodayWorkoutCard({ workout, onStart, canStart }: TodayWorkoutCardProps) {
  const exercises = workout.exercises ?? [];
  const remaining = Math.max(0, workout.exerciseCount - exercises.length);
  const meta = [
    `${workout.exerciseCount} ${workout.exerciseCount === 1 ? 'exercício' : 'exercícios'}`,
    workout.durationInMinutes > 0 ? `~${workout.durationInMinutes} min` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.topRow}>
          <Text variant="captionStrong" color={KINETIC.primary}>
            Treino de hoje
          </Text>
          {workout.tag ? (
            <Text variant="mono" color={KINETIC.textSecondary} numberOfLines={1} style={styles.tag}>
              {workout.tag}
            </Text>
          ) : null}
        </View>
        <Text variant="title">{workout.name}</Text>
        <Text variant="mono" color={KINETIC.textDim}>
          {meta}
        </Text>
      </View>

      {exercises.length > 0 ? (
        <View style={styles.list}>
          {exercises.map((ex, i) => (
            <View key={`${ex.name}-${i}`} style={styles.item}>
              <Text variant="mono" color={KINETIC.textMuted} style={styles.index}>
                {i + 1}
              </Text>
              <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
                {ex.name}
              </Text>
              <Text variant="monoBody" color={KINETIC.textDim}>
                {setsLabel(ex.sets, ex.reps)}
              </Text>
            </View>
          ))}
          {remaining > 0 ? (
            <Text variant="body" color={KINETIC.textSecondary} style={styles.more}>
              + {remaining} {remaining === 1 ? 'exercício' : 'exercícios'}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.bottom}>
        <Button label="Iniciar treino" icon="play" onPress={onStart} disabled={!canStart} />
        {workout.prescribedBy ? (
          <View style={styles.prescribed}>
            <Avatar
              name={workout.prescribedBy.name}
              uri={workout.prescribedBy.avatarUrl}
              seed={workout.prescribedBy.id}
              size={20}
            />
            <Text variant="caption" color={KINETIC.textSecondary} numberOfLines={1} style={styles.flex}>
              Prescrito por {workout.prescribedBy.name}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: RADIUS.xl,
    backgroundColor: KINETIC.surface1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  top: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tag: { flexShrink: 1 },
  list: { paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  index: { width: 16 },
  name: { flex: 1 },
  more: { height: 40, textAlignVertical: 'center', lineHeight: 40 },
  bottom: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 12 },
  prescribed: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
