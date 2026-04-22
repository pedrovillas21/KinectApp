import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';

export default function PasswordRequirements({ passwordValue }) {
  const { isDarkMode } = useContext(ThemeContext);
  const isDark = isDarkMode;

  const hasMinLength  = passwordValue.length >= 8;
  const hasUppercase  = /[A-Z]/.test(passwordValue);
  const hasLowercase  = /[a-z]/.test(passwordValue);
  const hasNumber     = /\d/.test(passwordValue);
  const hasSymbol     = /[!@#$%^&*]/.test(passwordValue);

  const Req = ({ met, label }) => (
    <Text style={styles.reqItem}>
      <Text style={met ? styles.checkIcon : styles.uncheckIcon}>{met ? '✓' : '●'}</Text>
      {' '}{label}
    </Text>
  );

  return (
    <View style={[styles.requirementsCard, { backgroundColor: isDark ? COLORS.darkCard : COLORS.lightCard }]}>
      <Text style={styles.reqTitle}>REQUISITOS DE SEGURANÇA</Text>
      <View style={styles.reqGrid}>
        <Req met={hasMinLength} label="8+ caracteres" />
        <Req met={hasUppercase} label="Letra maiúscula" />
        <Req met={hasLowercase} label="Letra minúscula" />
        <Req met={hasNumber}    label="Um número" />
        <Req met={hasSymbol}    label="Símbolo especial" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  requirementsCard: { padding: 16, borderRadius: 8, marginBottom: 24 },
  reqTitle: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 12, letterSpacing: 1 },
  reqGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  reqItem: { width: '50%', color: '#A0A0A0', fontSize: 13, marginBottom: 8 },
  checkIcon: { color: COLORS.neonBlue, fontWeight: 'bold' },
  uncheckIcon: { color: '#444' },
});
