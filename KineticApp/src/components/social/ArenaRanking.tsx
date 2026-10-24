import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KINETIC, RADIUS, rankingPositionChipBg, rankingPositionColor } from '../../theme/kinetic';
import type { RankingEntryDTO } from '../../types';
import { Avatar, Text } from '../ui';

interface ArenaRankingProps {
  entries: RankingEntryDTO[];
  onPressUser?: (userId: string) => void;
}

const deltaLabel = (delta: number): string => {
  if (delta > 0) return `+${delta} min vs. semana passada`;
  if (delta < 0) return `${delta} min vs. semana passada`;
  return 'igual à semana passada';
};

/** Ranking semanal da arena (minutos treinados entre amigos). */
export default function ArenaRanking({ entries, onPressUser }: ArenaRankingProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyStrong">Ranking vazio</Text>
        <Text variant="body" color={KINETIC.textSecondary} style={styles.center}>
          Adicione amigos e treine para aparecer no ranking da semana.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      <Text variant="caption" color={KINETIC.textSecondary} style={styles.caption}>
        Competição semanal · minutos treinados
      </Text>
      {entries.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          accessibilityLabel={`${e.position}º lugar, ${e.name}, ${e.minutes} minutos`}
          disabled={e.isCurrentUser || !onPressUser}
          onPress={() => onPressUser?.(e.id)}
          style={[styles.row, e.isCurrentUser && styles.rowMe]}
        >
          <View style={[styles.position, { backgroundColor: rankingPositionChipBg(e.position) }]}>
            <Text variant="statSmall" color={e.position <= 3 ? rankingPositionColor(e.position) : KINETIC.textDim}>
              {e.position}º
            </Text>
          </View>
          <Avatar name={e.name} seed={e.id} size={36} ring={e.online ? 'live' : undefined} />
          <View style={styles.texts}>
            <Text variant="bodyStrong" numberOfLines={1} color={e.isCurrentUser ? KINETIC.primary : KINETIC.text}>
              {e.name}
            </Text>
            <Text variant="caption" color={KINETIC.textSecondary} numberOfLines={1}>
              {deltaLabel(e.delta)}
            </Text>
          </View>
          <Text variant="statSmall">
            {e.minutes}
            <Text variant="mono" color={KINETIC.textMuted}>
              {' '}min
            </Text>
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  caption: { paddingHorizontal: 4 },
  row: {
    minHeight: 64,
    paddingHorizontal: 12,
    borderRadius: RADIUS.xl,
    backgroundColor: KINETIC.surface1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowMe: { borderWidth: 1, borderColor: KINETIC.primarySoft },
  position: { width: 36, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 6 },
  center: { textAlign: 'center' },
});
