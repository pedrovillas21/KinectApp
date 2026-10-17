import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ProtocolOption } from '../../../constants/protocol';
import { KINETIC, RADIUS } from '../../../theme/kinetic';
import Icon from '../../Icon';
import { Dialog, Text } from '../../ui';

interface OptionPickerDialogProps {
  visible: boolean;
  title: string;
  options: ProtocolOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

/** Escolha única (objetivo, nível, frequência). Tocar numa opção salva e fecha. */
export default function OptionPickerDialog({ visible, title, options, selected, onSelect, onClose }: OptionPickerDialogProps) {
  return (
    <Dialog visible={visible} onClose={onClose} title={title}>
      <View accessibilityRole="radiogroup" style={styles.list}>
        {options.map((opt) => {
          const active = opt.value === selected;
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
              style={[styles.option, active && styles.optionActive]}
            >
              <View style={styles.texts}>
                <Text variant="bodyStrong">{opt.title}</Text>
                <Text variant="caption" color={KINETIC.textSecondary}>
                  {opt.sub}
                </Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <Icon name="check" size={13} color={KINETIC.onPrimary} strokeWidth={3} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: KINETIC.bg,
  },
  optionActive: { borderColor: KINETIC.primary, backgroundColor: KINETIC.primaryDim },
  texts: { flex: 1, gap: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { backgroundColor: KINETIC.primary, borderColor: KINETIC.primary },
});
