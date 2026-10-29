import React, { useState } from 'react';
import { View } from 'react-native';
import { FONT, Palette, RADIUS } from '../../theme/kinetic';
import type { Achievement } from '../../types';
import { SectionHeader, Text } from '../ui';
import { createStyles, useColors } from '../../theme/ThemeContext';

/** Selo curto e cor de cada conquista calculada pelo backend. */
const BADGE: Record<string, { value: string; color: keyof Palette }> = {
  FIRST_WORKOUT: { value: '1º', color: 'primary' },
  WORKOUTS_10: { value: '10', color: 'success' },
  WORKOUTS_50: { value: '50', color: 'success' },
  WORKOUTS_100: { value: '100', color: 'success' },
  STREAK_7: { value: '7d', color: 'primary' },
  STREAK_30: { value: '30d', color: 'primary' },
  VOLUME_10T: { value: '10t', color: 'record' },
  VOLUME_100T: { value: '100t', color: 'record' },
  VOLUME_1000T: { value: '1kt', color: 'record' },
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
  const styles = useStyles();
  const c = useColors();
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
          const badge = BADGE[a.code] ?? { value: '★', color: 'text' as const };
          const label = a.unlocked
            ? `${a.title}, desbloqueada. ${a.description}`
            : `${a.title}, bloqueada, ${a.progress} de ${a.target}. ${a.description}`;
          return (
            <View key={a.code} style={styles.item} accessible accessibilityLabel={label}>
              <View style={[styles.badge, !a.unlocked && styles.badgeLocked]}>
                <Text style={styles.badgeValue} color={a.unlocked ? c[badge.color] : c.textMuted}>
                  {badge.value}
                </Text>
              </View>
              <Text variant="micro" color={a.unlocked ? c.textDim : c.textMuted} numberOfLines={2} style={styles.caption}>
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

const useStyles = createStyles((c) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 10, rowGap: 12 },
  item: { width: '25%', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  badge: { 
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLocked: { opacity: 0.6, borderStyle: 'dashed' },
  badgeValue: { fontFamily: FONT.monoSemibold, fontSize: 14, lineHeight: 18 },
  caption: { textAlign: 'center' },
  progressTrack: { width: 40, height: 3, borderRadius: RADIUS.pill, backgroundColor: c.surface2, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: c.textDim },
}));
