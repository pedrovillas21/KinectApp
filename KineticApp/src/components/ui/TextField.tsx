import React, { forwardRef, useState } from 'react';
import { StyleProp, TextInputProps, View, ViewStyle } from 'react-native';
import { TextInput } from './scaled';
import { FONT, RADIUS } from '../../theme/kinetic';
import Text from './Text';
import { createStyles, useColors } from '../../theme/ThemeContext';

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
  const styles = useStyles();
  const c = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, style]}>
      <Text variant="captionStrong" color={c.textSecondary}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        {...rest}
        multiline={multiline}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        placeholderTextColor={c.placeholder}
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
        <Text variant="caption" color={c.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color={c.textSecondary}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

export default TextField;

const useStyles = createStyles((c) => ({
  wrap: { gap: 6 },
  input: {
    minHeight: 44,
    borderRadius: RADIUS.md,
    backgroundColor: c.bg,
    borderWidth: 1.5,
    borderColor: c.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: c.text,
    fontFamily: FONT.regular,
    fontSize: 15,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  mono: { fontFamily: FONT.mono, letterSpacing: 0.5 },
  focused: { borderColor: c.primary },
  invalid: { borderColor: c.danger },
}));
