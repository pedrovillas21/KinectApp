import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { AuthContext, WorkoutPlanItem } from '../contexts/AuthContext';
import { KINETIC } from '../theme/kinetic';
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
  section?: string | null;
}

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

type ViewMode = 'LIST' | 'DETAIL';

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

function IcChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M15 6l-7 6 7 6" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IcInfo({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={2} />
      <Path d="M12 16v-5M12 8h.01" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Formata inteiro com separador de milhar pt-BR (4084 -> "4.084").
const formatVolumeKg = (n: number): string =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// ─── Agrupamento por seção (classificada pela IA no back-end) ──────
type SectionKey = 'AQUECIMENTO' | 'PRINCIPAL' | 'FINALIZACAO';

const SECTION_ORDER: SectionKey[] = ['AQUECIMENTO', 'PRINCIPAL', 'FINALIZACAO'];

const SECTION_LABELS: Record<SectionKey, string> = {
  AQUECIMENTO: 'Aquecimento',
  PRINCIPAL: 'Treino principal',
  FINALIZACAO: 'Finalização',
};

function sectionKeyOf(ex: Exercise): SectionKey {
  const s = (ex.section ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
  if (s.startsWith('AQUEC')) return 'AQUECIMENTO';
  if (s.startsWith('FINAL')) return 'FINALIZACAO';
  return 'PRINCIPAL';
}

interface RenderSection {
  id: SectionKey;
  label: string | null;
  items: Exercise[];
}

function groupSections(exercises: Exercise[]): RenderSection[] {
  const buckets: Record<SectionKey, Exercise[]> = { AQUECIMENTO: [], PRINCIPAL: [], FINALIZACAO: [] };
  exercises.forEach((ex) => buckets[sectionKeyOf(ex)].push(ex));

  const nonEmpty = SECTION_ORDER.filter((k) => buckets[k].length > 0);
  // Uma única seção (ex.: fichas antigas sem classificação) vira lista sem cabeçalho.
  const showLabels = nonEmpty.length > 1;
  return nonEmpty.map((k) => ({ id: k, label: showLabels ? SECTION_LABELS[k] : null, items: buckets[k] }));
}

// ─── Card de exercício (DETAIL) ────────────────────────────────────
function DetailExerciseCard({ ex, accent }: { ex: Exercise; accent: Accent }) {
  return (
    <View style={styles.exCard}>
      <LinearGradient colors={accent.grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.exStripe} />
      <View style={styles.exBody}>
        <Text style={styles.exName}>{ex.name}</Text>

        <View style={styles.exChipsRow}>
          {!!ex.muscles && (
            <View style={[styles.exMuscleChip, { backgroundColor: accent.dim, borderColor: accent.soft }]}>
              <Text style={[styles.exMuscleChipText, { color: accent.color }]}>{ex.muscles}</Text>
            </View>
          )}
          {!!ex.type && (
            <View style={styles.exTypeChip}>
              <Text style={styles.exTypeChipText}>{ex.type}</Text>
            </View>
          )}
        </View>

        <View style={styles.exGrid}>
          <View style={styles.exGridCol}>
            <Text style={styles.exGridLabel}>SÉRIES × REPS</Text>
            <Text style={styles.exGridValue}>{ex.sets} × {ex.reps}</Text>
          </View>
          <View style={styles.exGridCol}>
            <Text style={styles.exGridLabel}>SUGESTÃO</Text>
            <Text style={[styles.exGridValue, { color: accent.color }]}>{ex.weight}</Text>
          </View>
          <View style={styles.exGridCol}>
            <Text style={styles.exGridLabel}>DESCANSO</Text>
            <Text style={styles.exGridValue}>{ex.restTime}</Text>
          </View>
        </View>
      </View>
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

  // A BottomTabBar é flutuante (position: absolute); reserva espaço para o CTA
  // fixo não ficar escondido atrás dela.
  const tabBarHeight = useBottomTabBarHeight();

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
  if (!workout) {
    return <SafeAreaView style={styles.container} />;
  }

  const exercises = (workout.data ?? []) as Exercise[];
  const selectedIndex = Math.max(0, workoutPlans.findIndex((p) => p.id === workout.id));
  const accent = ACCENTS[selectedIndex % ACCENTS.length];
  const letter = DAY_LETTERS[selectedIndex % DAY_LETTERS.length];

  const muscleGroups = Array.from(
    new Set(exercises.map((e) => (e.muscles ?? '').trim()).filter(Boolean))
  );
  const sections = groupSections(exercises);
  const volumeKg = workout.estimatedTotalVolumeKg ?? null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.detailHeader}>
        <TouchableOpacity
          onPress={goBackToList}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Fichas"
          style={styles.backBtn}
        >
          <View style={styles.backChip}>
            <IcChevronLeft color={KINETIC.text} />
          </View>
          <Text style={styles.backLabel}>Fichas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
        <View style={styles.titleBlock}>
          <View style={[styles.dayBadge, styles.dayBadgeStart, { backgroundColor: accent.dim, borderColor: accent.soft }]}>
            <Text style={[styles.dayBadgeText, { color: accent.color }]}>{tagLabel(workout, letter)}</Text>
          </View>

          <Text style={styles.detailTitle}>{(workout.title ?? '').toUpperCase()}</Text>

          {muscleGroups.length > 0 && (
            <View style={styles.chipsRow}>
              {muscleGroups.map((g) => (
                <View key={g} style={styles.muscleChip}>
                  <Text style={styles.muscleChipText}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.infoBox}>
            <View style={styles.infoLine}>
              <IcSparkle color={KINETIC.textMuted} />
              <Text style={styles.infoText}>Sugestão por IA — consulte um profissional de educação física.</Text>
            </View>
            <View style={styles.infoLine}>
              <IcInfo color={KINETIC.textMuted} />
              <Text style={styles.infoText}>RPE = esforço percebido, de 1 (muito leve) a 10 (esforço máximo).</Text>
            </View>
          </View>

          <Text style={styles.metaText}>
            {exercises.length} exercícios
            {volumeKg != null && (
              <Text>
                {' · '}
                <Text style={[styles.metaStrong, { color: accent.color }]}>≈ {formatVolumeKg(volumeKg)} kg</Text>
                {' de volume total'}
              </Text>
            )}
          </Text>
        </View>

        {sections.map((sec) => (
          <View key={sec.id}>
            {sec.label && <Text style={styles.sectionHeader}>{sec.label}</Text>}
            <View style={styles.sectionBody}>
              {sec.items.map((ex, i) => (
                <DetailExerciseCard key={ex.id ?? `${ex.name}-${i}`} ex={ex} accent={accent} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: tabBarHeight + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar treino"
          onPress={() => startSession(workout)}
          style={({ pressed }) => [styles.ctaWrap, pressed && styles.ctaPressed]}
        >
          <LinearGradient colors={accent.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={[styles.ctaText, { color: accent.fg }]}>Iniciar treino</Text>
            <IcArrow color={accent.fg} />
          </LinearGradient>
        </Pressable>
      </View>
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

  // ─── DETAIL: header compacto ───
  detailHeader: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backChip: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: { color: KINETIC.textDim, fontSize: 13, fontWeight: '600' },

  // ─── DETAIL: bloco de título ───
  detailScrollView: { flex: 1 },
  detailScroll: { paddingBottom: 20 },
  titleBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6 },
  dayBadgeStart: { alignSelf: 'flex-start', marginBottom: 12 },
  detailTitle: {
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 34,
    color: KINETIC.text,
    marginBottom: 12,
  },
  infoBox: {
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: KINETIC.ghost,
    marginBottom: 12,
  },
  infoLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  infoText: { flex: 1, fontSize: 11.5, color: KINETIC.textMuted, lineHeight: 16 },
  metaText: { fontSize: 12.5, color: KINETIC.textDim, fontWeight: '500' },
  metaStrong: { fontWeight: '700' },

  // ─── DETAIL: seções ───
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: KINETIC.textMuted,
  },
  sectionBody: { gap: 10, paddingHorizontal: 16 },

  // ─── DETAIL: card de exercício ───
  exCard: {
    flexDirection: 'row',
    backgroundColor: KINETIC.surface1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  exStripe: { width: 3 },
  exBody: { flex: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 15 },
  exName: { fontSize: 16.5, fontWeight: '700', color: KINETIC.text, lineHeight: 21, marginBottom: 10 },
  exChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  exMuscleChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  exMuscleChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  exTypeChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KINETIC.ghostHi,
  },
  exTypeChipText: { fontSize: 10, fontWeight: '600', color: KINETIC.textMuted },
  exGrid: { flexDirection: 'row', gap: 10 },
  exGridCol: { flex: 1 },
  exGridLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.6, color: KINETIC.textMuted, marginBottom: 4 },
  exGridValue: { fontSize: 13.5, fontWeight: '700', color: KINETIC.text, lineHeight: 18 },

  // ─── DETAIL: CTA fixo (barra em fluxo, ancorada abaixo do ScrollView) ───
  ctaBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: KINETIC.bg,
    borderTopWidth: 1,
    borderTopColor: KINETIC.ghost,
  },
});
