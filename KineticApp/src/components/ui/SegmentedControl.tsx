import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { FONT, RADIUS } from '../../theme/kinetic';
import Text from './Text';
import { createStyles, useColors } from '../../theme/ThemeContext';

export interface SegmentOption<K extends string> {
  key: K;
  label: string;
}

export interface SegmentedControlProps<K extends string> {
  options: SegmentOption<K>[];
  value: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
}

/** Alternador em pílula (ex.: Amigo | Personal no convite). */
export default function SegmentedControl<K extends string>({ options, value, onChange, style }: SegmentedControlProps<K>) {
  const styles = useStyles();
  const c = useColors();
  return (
    <View accessibilityRole="tablist" style={[styles.track, style]}>
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.key)}
            style={[styles.segment, selected && styles.segmentOn]}
          >
            <Text
              style={{ fontFamily: FONT.medium, fontSize: 13, lineHeight: 18 }}
              color={selected ? c.text : c.textSecondary}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((c, s) => ({
  track: { flexDirection: 'row', gap: 2, padding: 3, borderRadius: RADIUS.md, backgroundColor: c.bg },
  segment: { flex: 1, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: c.surfaceRaised, ...s.raised },
}));
