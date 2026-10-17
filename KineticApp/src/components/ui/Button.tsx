import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { FONT, KINETIC, RADIUS } from '../../theme/kinetic';
import Icon, { IconName } from '../Icon';
import Text from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Ocupa a largura toda do pai. Default true para `lg`. */
  block?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT: Record<ButtonSize, number> = { lg: 48, md: 44, sm: 32 };
const FONT_SIZE: Record<ButtonSize, number> = { lg: 15, md: 14, sm: 13 };

const PALETTE: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: KINETIC.primary, fg: KINETIC.onPrimary },
  secondary: { bg: 'rgba(255,255,255,0.05)', fg: KINETIC.text },
  ghost: { bg: 'transparent', fg: KINETIC.text, border: KINETIC.ghost },
  danger: { bg: KINETIC.dangerDim, fg: KINETIC.danger },
  whatsapp: { bg: KINETIC.success, fg: '#062012' },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  loading,
  disabled,
  block,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const p = PALETTE[variant];
  const isBlock = block ?? size === 'lg';
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      hitSlop={size === 'sm' ? 6 : 0}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          paddingHorizontal: size === 'sm' ? 12 : 16,
          borderRadius: size === 'sm' ? RADIUS.sm : RADIUS.lg,
          backgroundColor: p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          alignSelf: isBlock ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} color={p.fg} strokeWidth={2} /> : null}
          <Text style={{ fontFamily: FONT.semibold, fontSize: FONT_SIZE[size], lineHeight: 20 }} color={p.fg}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
