import React from 'react';
import { Pressable, View } from 'react-native';
import { FONT } from '../../theme/kinetic';
import { Avatar, Text } from '../ui';
import { createStyles, useColors } from '../../theme/ThemeContext';

export interface ProfileCounter {
  label: string;
  value: string | number;
}

interface ProfileHeaderProps {
  name: string;
  avatarUrl?: string | null;
  seed?: string | null;
  /** Linhas abaixo do nome (ex.: "Membro desde março de 2026"). */
  lines?: string[];
  counters: ProfileCounter[];
  /** Toque na foto: abre a foto ampliada (e, no próprio perfil, a troca de foto). */
  onAvatarPress?: () => void;
}

/** Avatar grande, nome e contadores (perfil próprio e de outros). */
export default function ProfileHeader({ name, avatarUrl, seed, lines = [], counters, onAvatarPress }: ProfileHeaderProps) {
  const styles = useStyles();
  const c = useColors();
  return (
    <View>
      <View style={styles.identity}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver foto de perfil"
          onPress={onAvatarPress}
          disabled={!onAvatarPress}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Avatar name={name} uri={avatarUrl} seed={seed ?? name} size={76} />
        </Pressable>
        <View style={styles.texts}>
          <Text style={styles.name} numberOfLines={2} accessibilityRole="header">
            {name}
          </Text>
          {lines.map((line, i) => (
            <Text key={i} variant="caption" color={i === 0 ? c.textDim : c.textSecondary} numberOfLines={1}>
              {line}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.counters}>
        {counters.map((item) => (
          <View key={item.label} style={styles.counter} accessible accessibilityLabel={`${item.label}: ${item.value}`}>
            <Text style={styles.counterValue}>{item.value}</Text>
            <Text variant="caption" color={c.textSecondary}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 12 },
  texts: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontFamily: FONT.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  counters: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.hairline,
  },
  counter: { flex: 1, gap: 2 },
  pressed: { opacity: 0.85 },
  counterValue: { fontFamily: FONT.monoSemibold, fontSize: 17, lineHeight: 22 },
}));
