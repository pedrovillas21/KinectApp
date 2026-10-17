import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FONT, KINETIC, RADIUS } from '../../theme/kinetic';
import type { Achievement } from '../../types';
import { SectionHeader, Text } from '../ui';

/** Selo curto e cor de cada conquista calculada pelo backend. */
const BADGE: Record<string, { value: string; color: string }> = {
  FIRST_WORKOUT: { value: '1º', color: KINETIC.primary },
  WORKOUTS_10: { value: '10', color: KINETIC.success },
  WORKOUTS_50: { value: '50', color: KINETIC.success },
  WORKOUTS_100: { value: '100', color: KINETIC.success },
  STREAK_7: { value: '7d', color: KINETIC.primary },
  STREAK_30: { value: '30d', color: KINETIC.primary },
  VOLUME_10T: { value: '10t', color: KINETIC.record },
  VOLUME_100T: { value: '100t', color: KINETIC.record },
  VOLUME_1000T: { value: '1kt', color: KINETIC.record },
};

const COLLAPSED = 4;

/**
 * Conquistas como seção com legenda: desbloqueadas primeiro; "Ver todas" mostra
 * também as bloqueadas, apagadas e com o progresso.
 */
export default function AchievementBadges({
  achievements,
  initiallyExpanded = false,
}: {
  achievements: Achievement[];
  /** Começa mostrando todas (aba Conquistas do perfil próprio). */
  initiallyExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  if (achievements.length === 0) return null;

  const unlocked = achievements.filter((a) => a.unlocked);
  const ordered = [...unlocked, ...achievements.filter((a) => !a.unlocked)];
  const shown = expanded ? ordered : (unlocked.length > 0 ? unlocked : ordered).slice(0, COLLAPSED);

  return (
    <View>
      <SectionHeader
        title="Conquistas"
        caption={`${unlocked.length} de ${achievements.length} desbloqueadas`}
        actionLabel={initiallyExpanded ? undefined : expanded ? 'Ver menos' : `Ver as ${achievements.length}`}
        onAction={() => setExpanded((v) => !v)}
      />
      <View style={styles.grid}>
        {shown.map((a) => {
          const badge = BADGE[a.code] ?? { value: '★', color: KINETIC.text };
          const label = a.unlocked
            ? `${a.title}, desbloqueada. ${a.description}`
            : `${a.title}, bloqueada, ${a.progress} de ${a.target}. ${a.description}`;
          return (
            <View key={a.code} style={styles.item} accessible accessibilityLabel={label}>
              <View style={[styles.badge, !a.unlocked && styles.badgeLocked]}>
                <Text style={styles.badgeValue} color={a.unlocked ? badge.color : KINETIC.textMuted}>
                  {badge.value}
                </Text>
              </View>
              <Text variant="micro" color={a.unlocked ? KINETIC.textDim : KINETIC.textMuted} numberOfLines={2} style={styles.caption}>
                {a.title}
              </Text>
              {!a.unlocked && a.target > 1 ? (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, (a.progress / a.target) * 100)}%` }]} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 10, rowGap: 12 },
  item: { width: '25%', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: KINETIC.surface1,
    borderWidth: 1,
    borderColor: KINETIC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLocked: { opacity: 0.6, borderStyle: 'dashed' },
  badgeValue: { fontFamily: FONT.monoSemibold, fontSize: 14, lineHeight: 18 },
  caption: { textAlign: 'center' },
  progressTrack: { width: 40, height: 3, borderRadius: RADIUS.pill, backgroundColor: KINETIC.surface2, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: KINETIC.textDim },
});
