import React from 'react';
import { Pressable, View } from 'react-native';
import type { ProtocolOption } from '../../../constants/protocol';
import { RADIUS } from '../../../theme/kinetic';
import Icon from '../../Icon';
import { Dialog, Text } from '../../ui';
import { createStyles, useColors } from '../../../theme/ThemeContext';

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
  const styles = useStyles();
  const c = useColors();
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
                <Text variant="caption" color={c.textSecondary}>
                  {opt.sub}
                </Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <Icon name="check" size={13} color={c.onPrimary} strokeWidth={3} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Dialog>
  );
}

const useStyles = createStyles((c) => ({
  list: { gap: 8 },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: c.ghost,
    backgroundColor: c.bg,
  },
  optionActive: { borderColor: c.primary, backgroundColor: c.primaryDim },
  texts: { flex: 1, gap: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: c.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { backgroundColor: c.primaryFill, borderColor: c.primary },
}));
