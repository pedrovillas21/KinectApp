import React from 'react';
import { View } from 'react-native';
import { RADIUS } from '../../theme/kinetic';
import { formatMinutes, monthLabels } from '../../utils/formatters';
import { BarChart12w, Text } from '../ui';
import { createStyles, useColors } from '../../theme/ThemeContext';

interface WeeklyMinutesCardProps {
  weekStarts: string[];
  weeklyMinutes: number[];
}

/** Tempo de treino por semana nas últimas 12 semanas; a semana atual em destaque. */
export default function WeeklyMinutesCard({ weekStarts, weeklyMinutes }: WeeklyMinutesCardProps) {
  const styles = useStyles();
  const c = useColors();
  const thisWeek = weeklyMinutes[weeklyMinutes.length - 1] ?? 0;
  const max = Math.max(0, ...weeklyMinutes);
  const min = Math.min(...weeklyMinutes, max);
  const a11y =
    max > 0
      ? `Tempo de treino por semana nas últimas 12 semanas, entre ${formatMinutes(min)} e ${formatMinutes(max)}`
      : 'Nenhum treino nas últimas 12 semanas';

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.flex}>
          <Text variant="stat">{formatMinutes(thisWeek)}</Text>
          <Text variant="caption" color={c.textSecondary}>
            nesta semana
          </Text>
        </View>
        <Text variant="caption" color={c.textSecondary}>
          Últimos 3 meses
        </Text>
      </View>
      {max > 0 ? (
        <View style={styles.chart}>
          <BarChart12w
            series={[{ values: weeklyMinutes, color: c.primaryMid, lastColor: c.primary }]}
            labels={monthLabels(weekStarts)}
            accessibilityLabel={a11y}
          />
        </View>
      ) : (
        <Text variant="body" color={c.textSecondary} style={styles.chart}>
          Nenhum treino nas últimas 12 semanas.
        </Text>
      )}
    </View>
  );
}

const useStyles = createStyles((c, s) => ({
  card: { ...s.card, marginHorizontal: 16, padding: 16, borderRadius: RADIUS.xl, backgroundColor: c.surface1 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1, gap: 2 },
  chart: { marginTop: 16 },
}));
