import React from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { FONT, RADIUS } from '../../theme/kinetic';
import { createStyles } from '../../theme/ThemeContext';

export interface ChoiceOption<K extends string> {
  key: K;
  label: string;
  accessibilityLabel?: string;
}

interface ChoiceGroupProps<K extends string> {
  options: ChoiceOption<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Conteúdo acima do rótulo de cada opção (prévia do que ela faz). */
  renderPreview: (key: K, on: boolean) => React.ReactNode;
}

/**
 * Cartões lado a lado para escolher uma opção (radiogroup), com prévia em cada um.
 * Rótulo em RNText, fora da escala de texto, para os cartões não mudarem de tamanho.
 */
export default function ChoiceGroup<K extends string>({ options, value, onChange, renderPreview }: ChoiceGroupProps<K>) {
  const styles = useStyles();
  return (
    <View style={styles.options} accessibilityRole="radiogroup">
      {options.map((opt) => {
        const on = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
            onPress={() => onChange(opt.key)}
            style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.pressed]}
          >
            {renderPreview(opt.key, on)}
            <RNText style={[styles.optionLabel, on && styles.optionLabelOn]}>{opt.label}</RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((c, s) => ({
  options: { flexDirection: 'row', gap: 8 },
  option: {
    ...s.card,
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: c.ghost,
    backgroundColor: c.surface1,
  },
  optionOn: { borderColor: c.primary, backgroundColor: c.primaryDim },
  pressed: { opacity: 0.85 },
  optionLabel: { fontFamily: FONT.medium, fontSize: 13, color: c.textSecondary },
  optionLabelOn: { color: c.text },
}));
