import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';

export default function StatsScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const isDark = isDarkMode;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.darkBackground : COLORS.lightBackground }]}>
      {/* Header fixo */}
      <AppHeader />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderIcon}>📊</Text>
          <Text style={styles.placeholderTitle}>Estatísticas</Text>
          <Text style={styles.placeholderDesc}>
            Seus gráficos de performance, evolução de cargas e histórico de treinos aparecerão aqui em breve.
          </Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}><Text style={styles.tagText}>EM BREVE</Text></View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderCard: {
    alignItems: 'center',
    padding: 32,
  },
  placeholderIcon: { fontSize: 52, marginBottom: 20 },
  placeholderTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  placeholderDesc: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  tagRow: { flexDirection: 'row' },
  tag: {
    backgroundColor: '#113a40',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.neonBlue,
  },
  tagText: { color: COLORS.neonBlue, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
});
