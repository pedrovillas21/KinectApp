import React from 'react';
import { Pressable, View } from 'react-native';
import { RADIUS } from '../theme/kinetic';
import Icon from './Icon';
import { Text } from './ui';
import type { PostIntensity } from '../types';
import { createStyles, useColors } from '../theme/ThemeContext';

const OPTIONS: { value: PostIntensity; label: string }[] = [
  { value: 'LEVE', label: 'Leve' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'ALTA', label: 'Alta' },
];

interface Props {
  value: PostIntensity;
  onChange: (value: PostIntensity) => void;
}

/**
 * Linha "Intensidade" para dentro de um ListGroup. Título em cima e as três opções
 * dividindo a largura embaixo: cabe também com o texto em tamanho Grande.
 */
export default function IntensityPicker({ value, onChange }: Props) {
  const styles = useStyles();
  const c = useColors();
  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <View style={styles.iconBox}>
          <Icon name="flame" size={16} color={c.textDim} />
        </View>
        <Text variant="bodyMedium">Intensidade</Text>
      </View>
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Intensidade">
        {OPTIONS.map((opt) => {
          const on = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && !on && styles.pressed]}
            >
              <Text variant="captionStrong" color={on ? c.onPrimary : c.textDim} numberOfLines={1}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  root: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  // Mesma caixa de ícone do ListRow, para alinhar com as linhas vizinhas.
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    backgroundColor: c.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: c.ghostHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionOn: { backgroundColor: c.primaryFill, borderColor: c.primary },
  pressed: { backgroundColor: c.subtle },
}));
