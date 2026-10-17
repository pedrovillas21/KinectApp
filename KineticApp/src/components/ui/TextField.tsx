import React, { forwardRef, useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { FONT, KINETIC, RADIUS } from '../../theme/kinetic';
import Text from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string | null;
  /** Fonte mono (códigos, números). */
  mono?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Campo com rótulo, borda ciano no foco, dica e erro. */
const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, mono, style, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, style]}>
      <Text variant="captionStrong" color={KINETIC.textSecondary}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        {...rest}
        multiline={multiline}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        placeholderTextColor={KINETIC.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          mono && styles.mono,
          focused && styles.focused,
          !!error && styles.invalid,
        ]}
      />
      {error ? (
        <Text variant="caption" color={KINETIC.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color={KINETIC.textSecondary}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    minHeight: 44,
    borderRadius: RADIUS.md,
    backgroundColor: KINETIC.bg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: KINETIC.text,
    fontFamily: FONT.regular,
    fontSize: 15,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  mono: { fontFamily: FONT.mono, letterSpacing: 0.5 },
  focused: { borderColor: KINETIC.primary },
  invalid: { borderColor: KINETIC.danger },
});
