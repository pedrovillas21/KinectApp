import React from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { FONT } from '../theme/kinetic';
import { formatClock, formatThousands } from '../utils/formatters';
import { Text } from './ui';
import { createStyles, useColors } from '../theme/ThemeContext';

interface Props {
  volumeKg: number;
  durationSeconds: number;
  title: string;
}

/**
 * Faixa translúcida no rodapé da foto do treino: tonelagem | tempo | treino do dia,
 * na letra da marca (negrito inclinado, caixa alta). Posicione dentro de um pai com
 * `overflow: 'hidden'`; ela se ancora na base dele.
 */
export default function WorkoutPhotoStrip({ volumeKg, durationSeconds, title }: Props) {
  const styles = useStyles();
  const c = useColors();
  const label = `${formatThousands(volumeKg)} kg, ${formatClock(durationSeconds)}, ${title}`;
  return (
    <BlurView intensity={24} tint="dark" style={styles.strip} accessible accessibilityLabel={label}>
      <Svg width={20} height={15} viewBox="0 0 26 20">
        <Path d="M6 0h6L6 20H0z" fill={c.primary} />
        <Path d="M15 0h6l-6 20H9z" fill={c.primary} opacity={0.55} />
        <Path d="M24 0h2l-6 20h-2z" fill={c.primary} opacity={0.25} />
      </Svg>
      <View style={styles.row}>
        <Text style={styles.text}>{formatThousands(volumeKg)} kg</Text>
        <Text style={[styles.text, styles.sep]}>|</Text>
        <Text style={styles.text}>{formatClock(durationSeconds)}</Text>
        <Text style={[styles.text, styles.sep]}>|</Text>
        <Text style={[styles.text, styles.title]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </BlurView>
  );
}

const useStyles = createStyles((c) => ({
  strip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // Fundo do véu: no Android o BlurView só tinge, então a transparência vem daqui.
    backgroundColor: 'rgba(19,19,19,0.45)',
    overflow: 'hidden',
  },
  row: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  // Mesmo itálico "falso" da letra das fichas (WorkoutScreen): a família Geist carregada não tem itálico.
  text: {
    fontFamily: FONT.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: c.text,
    transform: [{ skewX: '-10deg' }],
  },
  sep: { color: c.primary },
  title: { flexShrink: 1 },
}));
