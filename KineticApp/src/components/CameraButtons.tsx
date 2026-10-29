import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from './Icon';
import { RADIUS } from '../theme/kinetic';
import { createStyles, useColors } from '../theme/ThemeContext';

/** Controles soltos sobre a imagem da câmera (estilo stories), usados pela câmera do treino e a do story. */

export function RoundButton({
  label,
  onPress,
  style,
  children,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={[styles.round, style]}>
      {children}
    </Pressable>
  );
}

export function FlipCameraButton({ onPress }: { onPress: () => void }) {
  return (
    <RoundButton label="Virar câmera" onPress={onPress}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
        <Path d="M4 3v5h5" />
        <Path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
        <Path d="M20 21v-5h-5" />
      </Svg>
    </RoundButton>
  );
}

export function ShutterButton({ onPress, ready }: { onPress: () => void; ready: boolean }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tirar foto"
      accessibilityState={{ disabled: !ready }}
      onPress={onPress}
      style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}
    >
      <View style={styles.shutterInner} />
    </Pressable>
  );
}

export function GalleryButton({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Escolher da galeria" onPress={onPress} style={styles.gallery}>
      <Icon name="image" size={18} color="rgba(255,255,255,0.8)" />
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallery: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: c.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: { transform: [{ scale: 0.94 }] },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
}));
