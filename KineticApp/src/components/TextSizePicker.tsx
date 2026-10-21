import React from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { TEXT_SIZES, useTextScale } from '../contexts/TextScaleContext';
import { FONT, KINETIC, RADIUS } from '../theme/kinetic';
import Icon from './Icon';
import { Text } from './ui';

// "Aa" de cada opção em tamanho fixo (RNText, fora da escala) para dar para comparar as três.
const SAMPLE_SIZE = { P: 18, M: 24, G: 30 } as const;

/**
 * Escolha Pequeno/Médio/Grande com prévia. Aplica na hora em todo o app:
 * a prévia (e a tela em volta) já aparece no tamanho escolhido.
 */
export default function TextSizePicker() {
  const { size, setSize } = useTextScale();

  return (
    <View style={styles.root}>
      <View style={styles.options} accessibilityRole="radiogroup">
        {TEXT_SIZES.map((opt) => {
          const on = opt.key === size;
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`Texto ${opt.label.toLowerCase()}`}
              onPress={() => setSize(opt.key)}
              style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.pressed]}
            >
              <View style={styles.sampleBox}>
                <RNText style={[styles.sample, { fontSize: SAMPLE_SIZE[opt.key] }, on && styles.sampleOn]}>Aa</RNText>
              </View>
              <RNText style={[styles.optionLabel, on && styles.optionLabelOn]}>{opt.label}</RNText>
            </Pressable>
          );
        })}
      </View>

      <Text variant="captionStrong" color={KINETIC.textSecondary} style={styles.previewTitle}>
        Prévia
      </Text>
      <View style={styles.preview}>
        <View style={styles.previewRow}>
          <View style={styles.previewIcon}>
            <Icon name="dumbbell" size={18} color={KINETIC.primary} />
          </View>
          <View style={styles.flex}>
            <Text variant="bodyStrong">Supino reto</Text>
            <Text variant="caption" color={KINETIC.textSecondary}>
              4 séries · 10 repetições · 40 kg
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={KINETIC.textMuted} />
        </View>
        <View style={styles.divider} />
        <Text variant="body" color={KINETIC.textDim}>
          Descanse 90 segundos entre as séries e mantenha as costas apoiadas no banco.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  flex: { flex: 1, gap: 2 },
  options: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: KINETIC.ghost,
    backgroundColor: KINETIC.surface1,
  },
  optionOn: { borderColor: KINETIC.primary, backgroundColor: KINETIC.primaryDim },
  pressed: { opacity: 0.85 },
  // Altura do maior "Aa": as três caixas alinham pela base.
  sampleBox: { height: 38, justifyContent: 'flex-end' },
  sample: { fontFamily: FONT.semibold, color: KINETIC.textDim },
  sampleOn: { color: KINETIC.primary },
  optionLabel: { fontFamily: FONT.medium, fontSize: 13, color: KINETIC.textSecondary },
  optionLabelOn: { color: KINETIC.text },
  previewTitle: { marginTop: 8, paddingHorizontal: 4 },
  preview: { padding: 14, gap: 12, borderRadius: RADIUS.xl, backgroundColor: KINETIC.surface1 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: KINETIC.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)' },
});
