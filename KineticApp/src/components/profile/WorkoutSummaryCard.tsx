import React from 'react';
import { View } from 'react-native';
import { RADIUS } from '../../theme/kinetic';
import type { WorkoutSummary } from '../../types';
import { formatBestSet, formatDurationSeconds, formatShortDate, formatThousands } from '../../utils/formatters';
import { StatRow, StatTile, Text } from '../ui';
import { createStyles, useColors } from '../../theme/ThemeContext';

/** Uma sessão registrada: título, data, números e os primeiros exercícios. */
export default function WorkoutSummaryCard({ workout }: { workout: WorkoutSummary }) {
  const styles = useStyles();
  const c = useColors();
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text variant="headline" numberOfLines={1} style={styles.flex}>
          {workout.title ?? 'Treino'}
        </Text>
        <Text variant="caption" color={c.textSecondary}>
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
          color={workout.recordsCount > 0 ? c.record : c.text}
        />
      </StatRow>
      {workout.exercises.length > 0 ? (
        <View style={styles.list}>
          {workout.exercises.map((ex, i) => (
            <View key={`${ex.name}-${i}`} style={styles.row}>
              <Text variant="body" numberOfLines={1} style={styles.flex}>
                <Text variant="monoBody" color={c.textDim}>
                  {ex.setsCount}×{' '}
                </Text>
                {ex.name}
              </Text>
              <Text variant="mono" color={c.textDim}>
                {formatBestSet(ex.bestSet)}
              </Text>
            </View>
          ))}
          {workout.moreExercises > 0 ? (
            <Text variant="caption" color={c.textSecondary}>
              + {workout.moreExercises} {workout.moreExercises === 1 ? 'exercício' : 'exercícios'}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((c, s) => ({
  card: { ...s.card, marginHorizontal: 16, padding: 16, borderRadius: RADIUS.xl, backgroundColor: c.surface1, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  stats: {},
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 34 },
}));
