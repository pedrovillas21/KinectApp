import React, { useContext, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../contexts/ThemeContext';
import { WORKOUT_MAP } from '../utils/mockData';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';

// Mock similar to what HomeScreen used
const ROUTINES = [
  { id: '1', title: 'Push day', bodyParts: 'CHEST / SHOULDERS / TRICEPS', exercises: '12', tag: 'DIA A' },
  { id: '2', title: 'Pull day', bodyParts: 'BACK / BICEPS / CORE', exercises: '10', tag: 'DIA B' },
  { id: '3', title: 'Leg day', bodyParts: 'QUADS / GLUTES / CALVES', exercises: '8', tag: 'DIA C' }
];

export default function WorkoutScreen({ navigation, route }) {
  const { isDarkMode } = useContext(ThemeContext);
  const isDark = isDarkMode;

  // Mode: 'LIST' or 'DETAIL'
  const [viewMode, setViewMode] = useState('LIST');
  const [selectedRoutineId, setSelectedRoutineId] = useState(null);

  // If passed from navigation explicitly, we should handle it (though we assume tab direct tap)
  // We'll manage it via state here for cleaner architecture.
  
  const THEME = {
    bg: isDark ? COLORS.darkBackground : COLORS.lightBackground,
    text: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight,
    card: isDark ? COLORS.darkCard : COLORS.lightCard,
  };

  const openRoutineDetail = (id) => {
    setSelectedRoutineId(id);
    setViewMode('DETAIL');
  };

  const goBackToList = () => {
    setViewMode('LIST');
    setSelectedRoutineId(null);
  };

  if (viewMode === 'LIST') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: THEME.bg }]}>
        <AppHeader />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          <View style={styles.routineHeader}>
            <View>
              <Text style={styles.routineTitle}>SUAS FICHAS PRESET</Text>
              <Text style={styles.routineSub}>Escolha um grupo muscular da sua grade.</Text>
            </View>
          </View>

          {ROUTINES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.programCard}
              onPress={() => openRoutineDetail(item.id)}
            >
              <View style={[styles.programImageMock, { backgroundColor: THEME.card }]}>
                <View style={styles.tagBadgeSmall}>
                  <Text style={styles.tagTextSmall}>{item.tag}</Text>
                </View>
              </View>
              <View style={styles.programInfo}>
                <View>
                  <Text style={styles.progTitle}>{item.title}</Text>
                  <Text style={styles.progBodyProps}>{item.bodyParts}</Text>
                  <Text style={styles.progExCount}><Text style={{ color: COLORS.neonBlue }}>{item.exercises}</Text> Exercícios</Text>
                  <Text style={styles.progVol}>VOLUME</Text>
                </View>
                <View style={styles.playIconContainer}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- DETAIL MODE ---
  const workout = WORKOUT_MAP[selectedRoutineId] ?? WORKOUT_MAP['1'];

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
      <AppHeader />
      
      <View style={styles.backNav}>
        <TouchableOpacity onPress={goBackToList}>
          <Text style={styles.backActionText}>← Voltar para Fichas</Text>
        </TouchableOpacity>
      </View>

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
              onPress={() => navigation.navigate('ActiveSession', { routineId: selectedRoutineId })}
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
  // List Mode Specifics
  routineHeader: {
    marginBottom: 20,
    marginTop: 12,
  },
  routineTitle: { color: COLORS.textPrimaryDark, fontSize: 22, fontStyle: 'italic', fontWeight: '900', letterSpacing: 1 },
  routineSub: { color: '#888', fontSize: 13, marginTop: 4 },
  programCard: {
    marginBottom: 20,
  },
  programImageMock: {
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  tagBadgeSmall: {
    backgroundColor: COLORS.neonBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 12,
  },
  tagTextSmall: { color: COLORS.darkBackground, fontSize: 10, fontWeight: 'bold' },
  programInfo: {
    backgroundColor: '#1C1C1C',
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  progBodyProps: { color: '#888', fontSize: 10, marginBottom: 12, letterSpacing: 1 },
  progExCount: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  progVol: { color: '#666', fontSize: 10, letterSpacing: 1, marginTop: 2 },
  playIconContainer: {
    backgroundColor: '#333',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { color: COLORS.neonBlue, fontSize: 12 },

  // Detail Mode Specifics
  backNav: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backActionText: {
    color: COLORS.neonBlue,
    fontSize: 14,
    fontWeight: 'bold',
  },
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
