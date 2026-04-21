import React, { useContext } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { WORKOUT_MAP } from '../utils/mockData';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';

export default function WorkoutScreen({ navigation, route }) {
  const { isDarkMode } = useContext(ThemeContext);
  const isDark = isDarkMode;

  // Pega o routineId passado pela navegação (padrão: DIA A se vier de outro lugar)
  const routineId = route?.params?.routineId ?? '1';
  const workout = WORKOUT_MAP[routineId] ?? WORKOUT_MAP['1'];

  const THEME = {
    bg: isDark ? COLORS.darkBackground : COLORS.lightBackground,
    text: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight,
    card: isDark ? COLORS.darkCard : COLORS.lightCard,
  };

  const MUSCLE_COLORS = {
    'PEITO':       { bg: '#1a0a2e', text: '#A78BFA' },
    'OMBRO':       { bg: '#0a1a2e', text: '#60A5FA' },
    'TRÍCEPS':     { bg: '#0a2e1a', text: '#34D399' },
    'BÍCEPS':      { bg: '#2e1a0a', text: '#FBBF24' },
    'COSTAS':      { bg: '#2e0a0a', text: '#F87171' },
    'ANTEBRAÇO':   { bg: '#1a2e0a', text: '#A3E635' },
    'QUADRÍCEPS':  { bg: '#0a2e2e', text: COLORS.neonBlue },
    'POSTERIOR':   { bg: '#2e2e0a', text: '#FCD34D' },
    'GLÚTEOS':     { bg: '#2e0a2e', text: '#F472B6' },
    'PANTURRILHA': { bg: '#0a0a2e', text: '#818CF8' },
  };

  const renderCard = ({ item }) => {
    const muscleColor = MUSCLE_COLORS[item.muscles] ?? { bg: '#1a1a1a', text: COLORS.neonBlue };

    return (
      <View style={[styles.card, { backgroundColor: THEME.card }]}>
        {/* Header do card */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.exerciseName, { color: THEME.text }]}>{item.name}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: muscleColor.bg }]}>
                <Text style={[styles.badgeText, { color: muscleColor.text }]}>{item.muscles}</Text>
              </View>
              <View style={[styles.badge, styles.badgeGhost]}>
                <Text style={styles.badgeTextGhost}>{item.type}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity>
            <Text style={styles.dotsIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Grid de dados */}
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>SÉRIES × REPS</Text>
            <Text style={[styles.gridValue, { color: THEME.text }]}>{item.sets} × {item.reps}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>PESO SUGERIDO</Text>
            <Text style={[styles.gridValue, { color: COLORS.neonBlue }]}>{item.weight}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>DESCANSO</Text>
            <Text style={[styles.gridValue, { color: THEME.text }]}>{item.restTime}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.executionBtn}>
          <Text style={styles.executionText}>VER EXECUÇÃO  ▶</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: THEME.bg }]}>
      {/* Header fixo */}
      <AppHeader />

      <FlatList
        data={workout.data}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.pageHeader}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>{workout.tag}</Text>
            </View>
            <Text style={[styles.pageTitle, { color: THEME.text }]}>{workout.title}</Text>
            <Text style={styles.pageSubtitle}>{workout.subtitle}</Text>
            <Text style={styles.exerciseCount}>{workout.data.length} exercícios  ·  Volume total calculado</Text>
          </View>
        )}
        renderItem={renderCard}
        ListFooterComponent={() => (
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => navigation.navigate('ActiveSession', { routineId })}
            >
              <Text style={styles.actionBtnText}>⚡ INICIAR TREINO</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editText}>✎ EDITAR LISTA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn}>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pageHeader: { marginBottom: 28, marginTop: 8 },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#113a40',
    borderWidth: 1,
    borderColor: COLORS.neonBlue,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  tagBadgeText: { color: COLORS.neonBlue, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
  pageTitle: { fontSize: 40, fontStyle: 'italic', fontWeight: '900', lineHeight: 44, marginBottom: 4 },
  pageSubtitle: { color: '#888', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  exerciseCount: { color: '#555', fontSize: 12 },

  card: {
    marginBottom: 14,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.neonBlue,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeGhost: { backgroundColor: '#2A2A2A' },
  badgeTextGhost: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  dotsIcon: { color: COLORS.neonBlue, fontSize: 24, fontWeight: 'bold' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  gridCol: { alignItems: 'flex-start', flex: 1 },
  gridLabel: { color: '#555', fontSize: 9, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.5 },
  gridValue: { fontSize: 15, fontWeight: 'bold' },
  executionBtn: { alignSelf: 'flex-end' },
  executionText: { color: COLORS.neonBlue, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },

  footerActions: { marginTop: 24 },
  actionBtnPrimary: {
    backgroundColor: COLORS.neonBlue,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.neonBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  actionBtnText: { color: COLORS.darkBackground, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  secondaryActions: { flexDirection: 'row', justifyContent: 'space-between' },
  editBtn: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  editText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  addBtn: {
    backgroundColor: COLORS.neonBlue,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: { color: COLORS.darkBackground, fontSize: 24, fontWeight: 'bold' },
});
