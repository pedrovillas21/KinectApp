import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AVATAR_TONES, FONT, KINETIC } from '../../theme/kinetic';
import Text from './Text';

export interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  /** Usado para escolher a cor estável das iniciais. Cai no nome se ausente. */
  seed?: string | number | null;
  size?: number;
  /** Anel em volta: `unseen` story nova (ciano), `seen` cinza, `live` treinando agora (verde). */
  ring?: 'unseen' | 'seen' | 'live';
}

const hash = (value: string): number => {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const initialsOf = (name?: string | null, max = 2): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const letters = parts.length === 1 ? [parts[0][0]] : [parts[0][0], parts[parts.length - 1][0]];
  return letters.slice(0, max).join('').toUpperCase();
};

export const avatarTone = (seed: string | number | null | undefined) =>
  AVATAR_TONES[hash(String(seed ?? '')) % AVATAR_TONES.length];

/** Foto de perfil ou iniciais coloridas. */
export default function Avatar({ name, uri, seed, size = 40, ring }: AvatarProps) {
  const tone = avatarTone(seed ?? name);
  // Anel de 2px + respiro até a foto (menor em avatar pequeno, para a foto não sumir).
  const inner = ring ? size - (size >= 48 ? 8 : 5) : size;
  const initials = initialsOf(name);

  const face = uri ? (
    <Image source={{ uri }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
  ) : (
    <View style={[styles.center, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: tone.bg }]}>
      <Text
        style={{ fontFamily: FONT.semibold, fontSize: Math.round(inner * 0.36), lineHeight: Math.round(inner * 0.46) }}
        color={tone.fg}
      >
        {initials}
      </Text>
    </View>
  );

  if (!ring) return face;
  return (
    <View
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: ring === 'unseen' ? KINETIC.primary : ring === 'live' ? KINETIC.success : 'rgba(255,255,255,0.14)',
        },
      ]}
    >
      {face}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
