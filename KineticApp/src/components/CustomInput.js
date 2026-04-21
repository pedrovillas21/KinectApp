import React, { useContext } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';

export default function CustomInput({ label, placeholder, value, onChangeText, secureTextEntry, icon }) {
  const { isDarkMode } = useContext(ThemeContext);

  const themeColors = {
    bg: isDarkMode ? COLORS.darkCard : COLORS.lightCard,
    text: isDarkMode ? COLORS.textPrimaryDark : COLORS.textPrimaryLight,
    label: isDarkMode ? COLORS.textSecondaryDark : COLORS.textSecondaryLight,
    border: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: themeColors.label }]}>{label.toUpperCase()}</Text>}
      <View style={[styles.inputContainer, { backgroundColor: themeColors.bg, borderColor: themeColors.border }]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          placeholder={placeholder}
          placeholderTextColor={themeColors.label}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  }
});
