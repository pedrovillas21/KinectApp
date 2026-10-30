import React from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { TEXT_SIZES, useTextScale } from '../contexts/TextScaleContext';
import { FONT, RADIUS } from '../theme/kinetic';
import Icon from './Icon';
import { ChoiceGroup, Text } from './ui';
import { createStyles, useColors } from '../theme/ThemeContext';

// "Aa" de cada opção em tamanho fixo (RNText, fora da escala) para dar para comparar as três.
const SAMPLE_SIZE = { P: 18, M: 24, G: 30 } as const;

const OPTIONS = TEXT_SIZES.map((s) => ({ key: s.key, label: s.label, accessibilityLabel: `Texto ${s.label.toLowerCase()}` }));

/**
 * Escolha Pequeno/Médio/Grande com prévia. Aplica na hora em todo o app:
 * a prévia (e a tela em volta) já aparece no tamanho escolhido.
 */
export default function TextSizePicker() {
  const styles = useStyles();
  const c = useColors();
  const { size, setSize } = useTextScale();

  return (
    <View style={styles.root}>
      <ChoiceGroup
        options={OPTIONS}
        value={size}
        onChange={setSize}
        renderPreview={(key, on) => (
          <View style={styles.sampleBox}>
            <RNText style={[styles.sample, { fontSize: SAMPLE_SIZE[key] }, on && styles.sampleOn]}>Aa</RNText>
          </View>
        )}
      />

      <Text variant="captionStrong" color={c.textSecondary} style={styles.previewTitle}>
        Prévia
      </Text>
      <View style={styles.preview}>
        <View style={styles.previewRow}>
          <View style={styles.previewIcon}>
            <Icon name="dumbbell" size={18} color={c.primary} />
          </View>
          <View style={styles.flex}>
            <Text variant="bodyStrong">Supino reto</Text>
            <Text variant="caption" color={c.textSecondary}>
              4 séries · 10 repetições · 40 kg
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={c.textMuted} />
        </View>
        <View style={styles.divider} />
        <Text variant="body" color={c.textDim}>
          Descanse 90 segundos entre as séries e mantenha as costas apoiadas no banco.
        </Text>
      </View>
    </View>
  );
}

const useStyles = createStyles((c, s) => ({
  root: { gap: 12 },
  flex: { flex: 1, gap: 2 },
  // Altura do maior "Aa": as três caixas alinham pela base.
  sampleBox: { height: 38, justifyContent: 'flex-end' },
  sample: { fontFamily: FONT.semibold, color: c.textDim },
  sampleOn: { color: c.primary },
  previewTitle: { marginTop: 8, paddingHorizontal: 4 },
  preview: { ...s.card, padding: 14, gap: 12, borderRadius: RADIUS.xl, backgroundColor: c.surface1 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: c.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
}));
