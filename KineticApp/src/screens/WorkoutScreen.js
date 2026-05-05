import React, { useCallback, useContext, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { COLORS } from '../theme/colors';
import AppHeader from '../components/AppHeader';
import api from '../services/api';

export default function WorkoutScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const { workoutPlans, setWorkoutPlans } = useContext(AuthContext);
  const isDark = isDarkMode;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState('LIST');
  const [selectedRoutineId, setSelectedRoutineId] = useState(null);

  const THEME = {
    bg: isDark ? COLORS.darkBackground : COLORS.lightBackground,
    text: isDark ? COLORS.textPrimaryDark : COLORS.textPrimaryLight,
    muted: isDark ? COLORS.textSecondaryDark : COLORS.textSecondaryLight,
    card: isDark ? COLORS.darkCard : COLORS.lightCard,
  };

  const fetchWorkoutPlans = useCallback(async () => {
    if (Array.isArray(workoutPlans) && workoutPlans.length > 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await api.get('/workouts/my-plans');
      setWorkoutPlans(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      const message = error.response?.data || 'Nao foi possivel carregar seus treinos.';
      setErrorMessage(typeof message === 'string' ? message : 'Nao foi possivel carregar seus treinos.');
    } finally {
      setIsLoading(false);
    }
  }, [setWorkoutPlans, workoutPlans.length]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkoutPlans();
    }, [fetchWorkoutPlans])
  );

  const selectedWorkout = useMemo(
    () => workoutPlans.find((plan) => plan.id === selectedRoutineId),
    [selectedRoutineId, workoutPlans]
  );

  const openRoutineDetail = (id) => {
    setSelectedRoutineId(id);
    setViewMode('DETAIL');
  };

  const goBackToList = () => {
    setViewMode('LIST');
    setSelectedRoutineId(null);
  };

  const MUSCLE_COLORS = {
    PEITO: { bg: '#1a0a2e', text: '#A78BFA' },
    OMBRO: { bg: '#0a1a2e', text: '#60A5FA' },
    TRICEPS: { bg: '#0a2e1a', text: '#34D399' },
    BICEPS: { bg: '#2e1a0a', text: '#FBBF24' },
    COSTAS: { bg: '#2e0a0a', text: '#F87171' },
    ANTEBRACO: { bg: '#1a2e0a', text: '#A3E635' },
    QUADRICEPS: { bg: '#0a2e2e', text: COLORS.neonBlue },
    POSTERIOR: { bg: '#2e2e0a', text: '#FCD34D' },
    GLUTEOS: { bg: '#2e0a2e', text: '#F472B6' },
    PANTURRILHA: { bg: '#0a0a2e', text: '#818CF8' },
  };

  const normalizeMuscle = (muscle) => (
    muscle
      ?.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
  );

  const renderEmptyState = () => (
    <View style={styles.centerState}>
      <Text style={[styles.emptyTitle, { color: THEME.text }]}>Nenhum treino encontrado</Text>
      <Text style={[styles.emptyText, { color: THEME.muted }]}>
        Gere uma ficha no onboarding ou tente atualizar a lista.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchWorkoutPlans}>
        <Text style={styles.retryButtonText}>TENTAR NOVAMENTE</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWorkoutCard = ({ item }) => {
    const exercises = item.data ?? [];

    return (
      <TouchableOpacity
        style={styles.programCard}
        onPress={() => openRoutineDetail(item.id)}
      >
        <View style={[styles.programImageMock, { backgroundColor: THEME.card }]}>
          <View style={styles.tagBadgeSmall}>
            <Text style={styles.tagTextSmall}>{item.tag}</Text>
          </View>
        </View>
        <View style={[styles.programInfo, { backgroundColor: THEME.card }]}>
          <View style={styles.programCopy}>
            <Text style={[styles.progTitle, { color: THEME.text }]}>{item.title}</Text>
            <Text style={styles.progBodyProps}>{item.subtitle}</Text>
            <Text style={[styles.progExCount, { color: THEME.text }]}>
              <Text style={{ color: COLORS.neonBlue }}>{exercises.length}</Text> Exercicios
            </Text>
            <Text style={styles.progVol}>VOLUME</Text>
          </View>
          <View style={styles.playIconContainer}>
            <Text style={styles.playIcon}>{'>'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExerciseCard = ({ item }) => {
    const muscleColor = MUSCLE_COLORS[normalizeMuscle(item.muscles)] ?? { bg: '#1a1a1a', text: COLORS.neonBlue };

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
            <Text style={styles.dotsIcon}>...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>SERIES x REPS</Text>
            <Text style={[styles.gridValue, { color: THEME.text }]}>{item.sets} x {item.reps}</Text>
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
          <Text style={styles.executionText}>VER EXECUCAO</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: THEME.bg }]}>
        <AppHeader />
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.neonBlue} size="large" />
          <Text style={[styles.loadingText, { color: THEME.muted }]}>Carregando seus treinos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (viewMode === 'LIST') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: THEME.bg }]}>
        <AppHeader />
        <FlatList
          data={workoutPlans}
          keyExtractor={(item) => item.id}
          renderItem={renderWorkoutCard}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => (
            <View style={styles.routineHeader}>
              <Text style={[styles.routineTitle, { color: THEME.text }]}>SUAS FICHAS</Text>
              <Text style={styles.routineSub}>
                {errorMessage || 'Escolha um treino da sua grade personalizada.'}
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  const workout = selectedWorkout ?? workoutPlans[0];
  const exercises = workout?.data ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: THEME.bg }]}>
      <AppHeader />

      <View style={styles.backNav}>
        <TouchableOpacity onPress={goBackToList}>
          <Text style={styles.backActionText}>{'<'} Voltar para Fichas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item, index) => item.id ?? `${item.name}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.pageHeader}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>{workout?.tag}</Text>
            </View>
            <Text style={[styles.pageTitle, { color: THEME.text }]}>{workout?.title}</Text>
            <Text style={styles.pageSubtitle}>{workout?.subtitle}</Text>
            <Text style={styles.exerciseCount}>{exercises.length} exercicios - Volume total calculado</Text>
          </View>
        )}
        renderItem={renderExerciseCard}
        ListFooterComponent={() => (
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => navigation.navigate('ActiveSession', { workoutData: workout })}
            >
              <Text style={styles.actionBtnText}>INICIAR TREINO</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editText}>EDITAR LISTA</Text>
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.neonBlue,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: COLORS.darkBackground,
    fontSize: 12,
    fontWeight: '900',
  },
  routineHeader: {
    marginBottom: 20,
    marginTop: 12,
  },
  routineTitle: { fontSize: 22, fontStyle: 'italic', fontWeight: '900', letterSpacing: 1 },
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
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programCopy: { flex: 1, paddingRight: 16 },
  progTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  progBodyProps: { color: '#888', fontSize: 10, marginBottom: 12, letterSpacing: 1 },
  progExCount: { fontSize: 12, fontWeight: 'bold' },
  progVol: { color: '#666', fontSize: 10, letterSpacing: 1, marginTop: 2 },
  playIconContainer: {
    backgroundColor: '#333',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { color: COLORS.neonBlue, fontSize: 16, fontWeight: '900' },
  backNav: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backActionText: {
    color: COLORS.neonBlue,
    fontSize: 14,
    fontWeight: 'bold',
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
  dotsIcon: { color: COLORS.neonBlue, fontSize: 18, fontWeight: 'bold' },
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
