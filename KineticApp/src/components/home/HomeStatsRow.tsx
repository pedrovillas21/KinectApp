import React from 'react';
import { StyleSheet } from 'react-native';
import { formatThousands } from '../../utils/formatters';
import { StatRow, StatTile } from '../ui';

interface HomeStatsRowProps {
  monthSessions: number;
  /** Meta de treinos no mês (0 = sem meta). */
  monthTarget: number;
  streakDays: number;
  volume7dKg: number;
}

/** Treinos no mês · Sequência · Volume 7 dias. */
export default function HomeStatsRow({ monthSessions, monthTarget, streakDays, volume7dKg }: HomeStatsRowProps) {
  return (
    <StatRow style={styles.row}>
      <StatTile label="Treinos no mês" value={monthSessions} unit={monthTarget > 0 ? `/${monthTarget}` : undefined} />
      <StatTile label="Sequência" value={streakDays} unit={streakDays === 1 ? ' dia' : ' dias'} />
      <StatTile label="Volume 7 dias" value={formatThousands(volume7dKg)} unit=" kg" />
    </StatRow>
  );
}

const styles = StyleSheet.create({
  row: { marginHorizontal: 16 },
});
