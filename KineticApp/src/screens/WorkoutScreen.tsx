import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { AuthContext, WorkoutPlanItem } from '../contexts/AuthContext';
import { KINETIC } from '../theme/kinetic';
import { COLORS } from '../theme/colors';
import { formatRelativeDays } from '../utils/dateRelative';
import AppHeader from '../components/AppHeader';
import api from '../services/api';

interface Exercise {
  id?: string;
  name: string;
  muscles: string;
  type: string;
  sets: number | string;
  reps: number | string;
  weight: string;
  restTime: string;
}

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

type ViewMode = 'LIST' | 'DETAIL';

interface MuscleStyle {
  bg: string;
  text: string;
}

interface Accent {
  color: string;
  grad: [string, string];
  dim: string;
  soft: string;
  fg: string;
}

// Paleta de acento por dia (A/B/C ciclando), espelhando os ACCENTS do mock e
// reaproveitando os tokens KINETIC (ciano primary, dourado warn, verde success).
const ACCENTS: Accent[] = [
  { color: KINETIC.primary, grad: [KINETIC.primary, '#00bcd4'], dim: KINETIC.primaryDim, soft: KINETIC.primarySoft, fg: '#001f24' },
  { color: KINETIC.warn, grad: ['#f5b945', '#e09820'], dim: 'rgba(245,185,69,0.10)', soft: 'rgba(245,185,69,0.22)', fg: '#241700' },
  { color: KINETIC.success, grad: ['#4ade80', '#22c55e'], dim: 'rgba(74,222,128,0.10)', soft: 'rgba(74,222,128,0.22)', fg: '#001f0c' },
];

const DAY_LETTERS = ['A', 'B', 'C'];

// ─── Ícones SVG ────────────────────────────────────────────────
function IcDumbbell({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Path
        d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M6 12h12"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IcClock({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={2} />
      <Polyline
        points="12 6 12 12 16 14"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IcHistory({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Polyline
        points="1 4 1 10 7 10"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51 15a9 9 0 1 0 .49-3.5"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IcArrow({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IcSparkle({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Path
        d="M12 2l1.9 6.4 6.4 1.9-6.4 1.9L12 22l-1.9-6.4L3.7 13.7l6.4-1.9z"
        fill={color}
      />
    </Svg>
  );
}

function MetricItem({ icon, label, muted }: { icon: React.ReactNode; label: string; muted?: boolean }) {
  return (
    <View style={styles.metricItem}>
      {icon}
      <Text style={[styles.metricText, { color: muted ? KINETIC.textMuted : KINETIC.textDim }]}>{label}</Text>
    </View>
  );
}

export default function WorkoutScreen({ navigation }: Props) {
  const { workoutPlans, setWorkoutPlans } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

  const fetchWorkoutPlans = useCallback(async () => {
    if (!Array.isArray(workoutPlans) || workoutPlans.length === 0) {
      setIsLoading(true);
    }
    setErrorMessage('');

    try {
      const response = await api.get('/workouts/my-plans');
      setWorkoutPlans(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
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

  const openRoutineDetail = (id: string) => {
    setSelectedRoutineId(id);
    setViewMode('DETAIL');
  };

  const goBackToList = () => {
    setViewMode('LIST');
    setSelectedRoutineId(null);
  };

  const startSession = (item: WorkoutPlanItem) => {
    navigation.navigate('ActiveSession', { workoutData: item });
  };

  const MUSCLE_COLORS: Record<string, MuscleStyle> = {
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

  const normalizeMuscle = (muscle: string | undefined): string => {
    if (!muscle) return '';
    return muscle
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase();
  };

  const tagLabel = (item: WorkoutPlanItem, letter: string): string => {
    const raw = item.tag?.trim();
    if (!raw) return `DIA ${letter}`;
    const upper = raw.toUpperCase();
    return upper.startsWith('DIA') ? upper : `DIA ${upper}`;
  };

  const renderEmptyState = () => (
    <View style={styles.centerState}>
      <Text style={styles.emptyTitle}>Nenhum treino encontrado</Text>
      <Text style={styles.emptyText}>Gere uma ficha no onboarding ou tente atualizar a lista.</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchWorkoutPlans}>
        <Text style={styles.retryButtonText}>TENTAR NOVAMENTE</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWorkoutCard = ({ item, index }: ListRenderItemInfo<WorkoutPlanItem>) => {
    const exercises = (item.data ?? []) as Exercise[];
    const accent = ACCENTS[index % ACCENTS.length];
    const letter = DAY_LETTERS[index % DAY_LETTERS.length];

    const muscles = Array.from(
      new Set(exercises.map((e) => (e.muscles ?? '').trim()).filter(Boolean))
    );
    const chips = muscles.length ? muscles : ['Corpo inteiro'];

    const neverDone = !item.lastCompletedAt;
    const durationLabel = item.estimatedDurationMinutes != null ? `${item.estimatedDurationMinutes} min` : '— min';

    return (
      <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={() => openRoutineDetail(item.id)}>
        <LinearGradient colors={accent.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardStripe} />

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={[styles.dayBadge, { backgroundColor: accent.dim, borderColor: accent.soft }]}>
              <Text style={[styles.dayBadgeText, { color: accent.color }]}>{tagLabel(item, letter)}</Text>
            </View>
            <View style={styles.iaBadge}>
              <IcSparkle color={KINETIC.textMuted} />
              <Text style={styles.iaBadgeText}>Sugestão IA</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>{item.title}</Text>

          <View style={styles.chipsRow}>
            {chips.map((g) => (
              <View key={g} style={styles.muscleChip}>
                <Text style={styles.muscleChipText}>{g}</Text>
              </View>
            ))}
          </View>

          <View style={styles.metricsRow}>
            <MetricItem icon={<IcDumbbell color={KINETIC.textDim} />} label={`${exercises.length} exercícios`} />
            <Text style={styles.metricDot}>·</Text>
            <MetricItem icon={<IcClock color={KINETIC.textDim} />} label={durationLabel} />
            <Text style={styles.metricDot}>·</Text>
            <MetricItem
              icon={<IcHistory color={neverDone ? KINETIC.textMuted : KINETIC.textDim} />}
              label={formatRelativeDays(item.lastCompletedAt)}
              muted={neverDone}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar treino"
            onPress={() => startSession(item)}
            style={({ pressed }) => [styles.ctaWrap, pressed && styles.ctaPressed]}
          >
            <LinearGradient colors={accent.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <Text style={[styles.ctaText, { color: accent.fg }]}>Iniciar treino</Text>
              <IcArrow color={accent.fg} />
            </LinearGradient>
          </Pressable>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExerciseCard = ({ item }: ListRenderItemInfo<Exercise>) => {
    const muscleColor = MUSCLE_COLORS[normalizeMuscle(item.muscles)] ?? { bg: KINETIC.surface2, text: KINETIC.primary };

    return (
      <View style={styles.exerciseCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: muscleColor.bg }]}>
                <Text style={[styles.badgeText, { color: muscleColor.text }]}>{item.muscles}</Text>
              </View>
              <View style={[styles.badge, styles.badgeGhost]}>
                <Text style={styles.badgeTextGhost}>{item.type}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>SERIES x REPS</Text>
            <Text style={styles.gridValue}>{item.sets} x {item.reps}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>PESO SUGERIDO</Text>
            <Text style={[styles.gridValue, { color: KINETIC.primary }]}>{item.weight}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>DESCANSO</Text>
            <Text style={styles.gridValue}>{item.restTime}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <View style={styles.centerState}>
          <ActivityIndicator color={KINETIC.primary} size="large" />
          <Text style={styles.loadingText}>Carregando seus treinos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (viewMode === 'LIST') {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <FlatList<WorkoutPlanItem>
          data={workoutPlans}
          keyExtractor={(item) => item.id}
          renderItem={renderWorkoutCard}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={() => (
            <View style={styles.routineHeader}>
              <Text style={styles.routineTitle}>SUAS FICHAS</Text>
              <Text style={styles.routineSub}>
                {errorMessage || 'Escolha um treino da sua grade personalizada.'}
              </Text>
            </View>
          )}
          ListFooterComponent={() =>
            workoutPlans.length > 0 ? (
              <View style={styles.disclaimer}>
                <IcSparkle color={KINETIC.textMuted} />
                <Text style={styles.disclaimerText}>
                  Fichas geradas por IA com base no seu perfil. Consulte um profissional de educação física antes
                  de iniciar qualquer programa de treinos.
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    );
  }

  const workout = selectedWorkout ?? workoutPlans[0];
  const exercises = (workout?.data ?? []) as Exercise[];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />

      <View style={styles.backNav}>
        <TouchableOpacity onPress={goBackToList}>
          <Text style={styles.backActionText}>{'<'} Voltar para Fichas</Text>
        </TouchableOpacity>
      </View>

      <FlatList<Exercise>
        data={exercises}
        keyExtractor={(item, index) => item.id ?? `${item.name}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.pageHeader}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>{workout?.tag}</Text>
            </View>
            <Text style={styles.pageTitle}>{workout?.title}</Text>
            <Text style={styles.pageSubtitle}>{workout?.subtitle}</Text>
            <Text style={styles.exerciseCount}>{exercises.length} exercicios - Volume total calculado</Text>
          </View>
        )}
        renderItem={renderExerciseCard}
        ListFooterComponent={() => (
          <View style={styles.footerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Iniciar treino"
              onPress={() => workout && startSession(workout)}
              style={({ pressed }) => [styles.ctaWrap, pressed && styles.ctaPressed]}
            >
              <LinearGradient
                colors={[KINETIC.primary, KINETIC.primaryDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}
              >
                <Text style={[styles.ctaText, { color: '#001a1f' }]}>INICIAR TREINO</Text>
                <IcArrow color="#001a1f" />
              </LinearGradient>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KINETIC.bg },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: 'bold',
    color: KINETIC.textDim,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    color: KINETIC.text,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: KINETIC.textDim,
  },
  retryButton: {
    backgroundColor: KINETIC.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#001a1f',
    fontSize: 12,
    fontWeight: '900',
  },

  // ─── Header da seção ───
  routineHeader: {
    marginBottom: 20,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  routineTitle: {
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: -1,
    color: KINETIC.text,
  },
  routineSub: { color: KINETIC.textDim, fontSize: 13, marginTop: 6, lineHeight: 18 },

  // ─── Card de ficha (LIST) ───
  card: {
    backgroundColor: KINETIC.surface1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardStripe: { height: 3, width: '100%' },
  cardBody: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  iaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KINETIC.ghost,
  },
  iaBadgeText: { fontSize: 10, fontWeight: '600', color: KINETIC.textMuted },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: KINETIC.text,
    lineHeight: 26,
    marginBottom: 10,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 14 },
  muscleChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: KINETIC.ghost,
  },
  muscleChipText: { fontSize: 10, fontWeight: '600', color: KINETIC.textDim },
  metricsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricText: { fontSize: 11, fontWeight: '500' },
  metricDot: { color: KINETIC.textMuted, fontSize: 10 },

  // ─── CTA gradiente ───
  ctaWrap: {
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: KINETIC.primary,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaPressed: { opacity: 0.85 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  ctaText: { fontWeight: '800', fontSize: 14, letterSpacing: 0.2 },

  // ─── Disclaimer rodapé ───
  disclaimer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: KINETIC.ghost,
  },
  disclaimerText: { flex: 1, fontSize: 11, color: KINETIC.textMuted, lineHeight: 17 },

  // ─── DETAIL ───
  backNav: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backActionText: {
    color: KINETIC.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  pageHeader: { marginBottom: 24, marginTop: 4, paddingHorizontal: 4 },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: KINETIC.primaryDim,
    borderWidth: 1,
    borderColor: KINETIC.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  tagBadgeText: { color: KINETIC.primary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
  pageTitle: { fontSize: 34, fontStyle: 'italic', fontWeight: '900', lineHeight: 38, marginBottom: 4, color: KINETIC.text },
  pageSubtitle: { color: KINETIC.textDim, fontSize: 13, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  exerciseCount: { color: KINETIC.textMuted, fontSize: 12 },
  exerciseCard: {
    marginBottom: 14,
    borderRadius: 16,
    padding: 18,
    backgroundColor: KINETIC.surface1,
    borderLeftWidth: 2,
    borderLeftColor: KINETIC.primary,
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
    color: KINETIC.text,
  },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeGhost: { backgroundColor: KINETIC.surface2 },
  badgeTextGhost: { color: KINETIC.textDim, fontSize: 10, fontWeight: 'bold' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCol: { alignItems: 'flex-start', flex: 1 },
  gridLabel: { color: KINETIC.textMuted, fontSize: 9, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.5 },
  gridValue: { fontSize: 15, fontWeight: 'bold', color: KINETIC.text },
  footerActions: { marginTop: 24 },
});
