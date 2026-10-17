import React from 'react';
import { StyleSheet, View } from 'react-native';
import { KINETIC, RADIUS } from '../../theme/kinetic';
import type { WorkoutSummary } from '../../types';
import { formatBestSet, formatDurationSeconds, formatShortDate, formatThousands } from '../../utils/formatters';
import { StatRow, StatTile, Text } from '../ui';

/** Uma sessão registrada: título, data, números e os primeiros exercícios. */
export default function WorkoutSummaryCard({ workout }: { workout: WorkoutSummary }) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text variant="headline" numberOfLines={1} style={styles.flex}>
          {workout.title ?? 'Treino'}
        </Text>
        <Text variant="caption" color={KINETIC.textSecondary}>
          {formatShortDate(workout.date)}
        </Text>
      </View>
      <StatRow card={false} style={styles.stats}>
        <StatTile size="sm" label="Duração" value={workout.durationSeconds ? formatDurationSeconds(workout.durationSeconds) : '—'} />
        <StatTile size="sm" label="Volume" value={workout.volumeKg > 0 ? `${formatThousands(workout.volumeKg)} kg` : '—'} />
        <StatTile
          size="sm"
          label="Recordes"
          value={workout.recordsCount}
          color={workout.recordsCount > 0 ? KINETIC.record : KINETIC.text}
        />
      </StatRow>
      {workout.exercises.length > 0 ? (
        <View style={styles.list}>
          {workout.exercises.map((ex, i) => (
            <View key={`${ex.name}-${i}`} style={styles.row}>
              <Text variant="body" numberOfLines={1} style={styles.flex}>
                <Text variant="monoBody" color={KINETIC.textDim}>
                  {ex.setsCount}×{' '}
                </Text>
                {ex.name}
              </Text>
              <Text variant="mono" color={KINETIC.textDim}>
                {formatBestSet(ex.bestSet)}
              </Text>
            </View>
          ))}
          {workout.moreExercises > 0 ? (
            <Text variant="caption" color={KINETIC.textSecondary}>
              + {workout.moreExercises} {workout.moreExercises === 1 ? 'exercício' : 'exercícios'}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, padding: 16, borderRadius: RADIUS.xl, backgroundColor: KINETIC.surface1, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  stats: {},
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 34 },
});
