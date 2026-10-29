import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import type { PlanExercise as Exercise, WorkoutPlanItem } from '../types';
import { FONT, Palette, RADIUS } from '../theme/kinetic';
import { formatRelativeDays } from '../utils/dateRelative';
import { formatThousands } from '../utils/formatters';
import { Avatar, Button, StaleBanner } from '../components/ui';
import useFocusResource from '../hooks/useFocusResource';
import api from '../services/api';
import { createStyles, useColors } from '../theme/ThemeContext';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

interface Accent {
  color: string;
  grad: [string, string];
  dim: string;
  soft: string;
  fg: string;
}

// Paleta de acento por dia (A/B/C ciclando), espelhando os ACCENTS do mock e
// reaproveitando os tokens da paleta (ciano primary, dourado warn, verde success).
// Os gradientes são preenchimento (iguais nos dois temas), com texto escuro por cima.
const accentAt = (c: Palette, index: number): Accent =>
  (
    [
      { color: c.primary, grad: [c.primaryFill, c.primaryFillEnd], dim: c.primaryDim, soft: c.primarySoft, fg: c.onPrimary },
      { color: c.warn, grad: ['#f5b945', '#e09820'], dim: c.warnDim, soft: c.warnSoft, fg: '#241700' },
      { color: c.success, grad: ['#4ade80', '#22c55e'], dim: c.successDim, soft: c.successSoft, fg: '#001f0c' },
    ] as Accent[]
  )[index % 3];

// A, B, C, D… pela posição na grade (a cor é que cicla de 3 em 3).
const letterOf = (index: number) => String.fromCharCode(65 + (index % 26));

const musclesOf = (exercises: Exercise[]) =>
  Array.from(new Set(exercises.map((e) => (e.muscles ?? '').trim()).filter(Boolean)));

// "7 exercícios · 55 min · nunca feito"
const metaOf = (item: WorkoutPlanItem, exerciseCount: number) =>
  [
    `${exerciseCount} ${exerciseCount === 1 ? 'exercício' : 'exercícios'}`,
    item.estimatedDurationMinutes != null ? `${item.estimatedDurationMinutes} min` : null,
    item.lastCompletedAt ? formatRelativeDays(item.lastCompletedAt).toLowerCase() : 'nunca feito',
  ]
    .filter(Boolean)
    .join(' · ');

// Próxima ficha da rotação: a feita há mais tempo; nunca feita vem antes, na ordem da grade.
function nextPlanIndex(plans: WorkoutPlanItem[]): number {
  let best = -1;
  let bestTime = Infinity;
  plans.forEach((p, i) => {
    const t = p.lastCompletedAt ? Date.parse(p.lastCompletedAt) : -Infinity;
    if (best === -1 || t < bestTime) {
      best = i;
      bestTime = t;
    }
  });
  return best;
}

// ─── Ícones SVG ────────────────────────────────────────────────
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

function IcUserCheck({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Circle cx="9" cy="7" r="4" fill="none" stroke={color} strokeWidth={2.2} />
      <Path d="M2 21v-1a6 6 0 0 1 6-6h2" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Polyline points="15 18 17.5 20.5 22 15" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
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
function DetailExerciseCard({ ex, accent, prescribed }: { ex: Exercise; accent: Accent; prescribed: boolean }) {
  const styles = useStyles();
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
            <Text style={styles.exGridLabel}>{prescribed ? 'CARGA' : 'SUGESTÃO'}</Text>
            <Text style={[styles.exGridValue, { color: accent.color }]}>{ex.weight || '—'}</Text>
          </View>
          <View style={styles.exGridCol}>
            <Text style={styles.exGridLabel}>DESCANSO</Text>
            <Text style={styles.exGridValue}>{ex.restTime || '—'}</Text>
          </View>
        </View>

        {!!ex.notes && (
          <View style={[styles.exNotes, { borderLeftColor: accent.color }]}>
            <Text style={styles.exGridLabel}>OBSERVAÇÃO DO PERSONAL</Text>
            <Text style={styles.exNotesText}>{ex.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function WorkoutScreen({ navigation }: Props) {
  const styles = useStyles();
  const c = useColors();
  // Ficha aberta no detalhe; null = lista.
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

  // Mesma chave da Home: as duas telas compartilham o cache das fichas.
  const plansRes = useFocusResource('workouts/my-plans', () =>
    api.get<WorkoutPlanItem[]>('/workouts/my-plans').then((r) => (Array.isArray(r.data) ? r.data : [])),
  );
  const workoutPlans = plansRes.data ?? [];
  const isLoading = plansRes.loading;
  const fetchWorkoutPlans = plansRes.refresh;

  const selectedWorkout = useMemo(
    () => workoutPlans.find((plan) => plan.id === selectedRoutineId),
    [selectedRoutineId, workoutPlans]
  );

  const openRoutineDetail = (id: string) => setSelectedRoutineId(id);
  const goBackToList = () => setSelectedRoutineId(null);

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

  const renderFichaRow = (item: WorkoutPlanItem, index: number, last: boolean) => {
    const exercises = item.data ?? [];
    const accent = accentAt(c, index);
    const letter = letterOf(index);
    const muscles = musclesOf(exercises);
    return (
      <Pressable
        key={item.id}
        accessibilityRole="button"
        accessibilityLabel={`Ver ficha ${letter}, ${item.title}`}
        onPress={() => openRoutineDetail(item.id)}
        style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.rowPressed]}
      >
        <View style={[styles.letterTile, { backgroundColor: accent.dim }]}>
          <Text style={[styles.letterText, { color: accent.color }]}>{letter}</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.rowMuscles} numberOfLines={1}>{muscles.length ? muscles.join(' · ') : 'Corpo inteiro'}</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>{metaOf(item, exercises.length)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Iniciar ficha ${letter}, ${item.title}`}
          onPress={() => startSession(item)}
          hitSlop={4}
          style={styles.playBtn}
        >
          <Svg width={30} height={30} viewBox="0 0 32 32">
            <Circle cx="16" cy="16" r="15" fill="none" stroke={accent.color} strokeOpacity={0.35} strokeWidth={1.5} />
            <Path d="M13 10.5v11l9-5.5z" fill={accent.color} />
          </Svg>
        </Pressable>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerState}>
          <ActivityIndicator color={c.primary} size="large" />
          <Text style={styles.loadingText}>Carregando seus treinos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedRoutineId === null) {
    const nextIndex = nextPlanIndex(workoutPlans);
    const next = workoutPlans[nextIndex];
    const trainerName = workoutPlans.find((p) => p.prescribedByName)?.prescribedByName ?? null;
    const hasAiPlans = workoutPlans.some((p) => !p.prescribedByName);
    const gradeLetters = workoutPlans.map((_, i) => letterOf(i)).join('');

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          <Text style={styles.screenTitle} accessibilityRole="header">Treinos</Text>

          <StaleBanner visible={plansRes.error} hasData={workoutPlans.length > 0} onRetry={fetchWorkoutPlans} />

          {!next ? (
            renderEmptyState()
          ) : (
            <>
              <View style={styles.planCard}>
                {trainerName ? (
                  <Avatar name={trainerName} seed={trainerName} size={40} />
                ) : (
                  <View style={styles.aiAvatar}>
                    <IcSparkle color={c.primary} />
                  </View>
                )}
                <View style={styles.rowBody}>
                  <Text style={styles.planTitle}>Grade personalizada · {gradeLetters}</Text>
                  <Text style={styles.rowMuscles} numberOfLines={1}>
                    {trainerName ? `Prescrita por ${trainerName}` : 'Sugerida pela IA com base no seu perfil'}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Próximo treino</Text>
              {(() => {
                const exercises = next.data ?? [];
                const accent = accentAt(c, nextIndex);
                const letter = letterOf(nextIndex);
                const muscles = musclesOf(exercises);
                return (
                  <View style={[styles.nextCard, { borderColor: accent.soft }]}>
                    <View style={styles.nextTop}>
                      <View style={[styles.letterTile, styles.letterTileLg, { backgroundColor: accent.dim }]}>
                        <Text style={[styles.letterText, styles.letterTextLg, { color: accent.color }]}>{letter}</Text>
                      </View>
                      <View style={styles.rowBody}>
                        <Text style={styles.nextTitle}>{next.title}</Text>
                        <Text style={styles.rowMeta}>{metaOf(next, exercises.length)}</Text>
                        {muscles.length > 0 && (
                          <View style={styles.chipsRow}>
                            {muscles.map((g) => (
                              <View key={g} style={styles.muscleChip}>
                                <Text style={styles.muscleChipText}>{g}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.nextActions}>
                      <Button
                        label="Iniciar treino"
                        icon="play"
                        onPress={() => startSession(next)}
                        style={styles.flex}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Ver exercícios da ficha ${letter}`}
                        onPress={() => openRoutineDetail(next.id)}
                        style={styles.listBtn}
                      >
                        <Svg width={18} height={18} viewBox="0 0 24 24">
                          <Path
                            d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"
                            fill="none"
                            stroke={c.text}
                            strokeWidth={1.8}
                            strokeLinecap="round"
                          />
                        </Svg>
                      </Pressable>
                    </View>
                  </View>
                );
              })()}

              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabelInline}>Todas as fichas</Text>
                <Text style={styles.rowMeta}>{workoutPlans.length}</Text>
              </View>
              <View style={styles.listCard}>
                {workoutPlans.map((p, i) => renderFichaRow(p, i, i === workoutPlans.length - 1))}
              </View>

              {hasAiPlans && (
                <View style={styles.disclaimer}>
                  <IcSparkle color={c.textMuted} />
                  <Text style={styles.disclaimerText}>
                    Fichas geradas por IA com base no seu perfil. Consulte um profissional de educação física antes
                    de iniciar qualquer programa de treinos.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const workout = selectedWorkout ?? workoutPlans[0];
  if (!workout) {
    return <SafeAreaView style={styles.container} edges={['top', 'left', 'right']} />;
  }

  const exercises = workout.data ?? [];
  const selectedIndex = Math.max(0, workoutPlans.findIndex((p) => p.id === workout.id));
  const accent = accentAt(c, selectedIndex);
  const letter = letterOf(selectedIndex);

  const muscleGroups = musclesOf(exercises);
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
            <IcChevronLeft color={c.text} />
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
            <View style={[styles.chipsRow, styles.detailChips]}>
              {muscleGroups.map((g) => (
                <View key={g} style={styles.muscleChip}>
                  <Text style={styles.muscleChipText}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.infoBox}>
            {workout.prescribedByName ? (
              <View style={styles.infoLine}>
                <IcUserCheck color={c.success} />
                <Text style={styles.infoText}>Ficha prescrita por {workout.prescribedByName}, seu personal.</Text>
              </View>
            ) : (
              <View style={styles.infoLine}>
                <IcSparkle color={c.textMuted} />
                <Text style={styles.infoText}>Sugestão por IA — consulte um profissional de educação física.</Text>
              </View>
            )}
            <View style={styles.infoLine}>
              <IcInfo color={c.textMuted} />
              <Text style={styles.infoText}>RPE = esforço percebido, de 1 (muito leve) a 10 (esforço máximo).</Text>
            </View>
          </View>

          <Text style={styles.metaText}>
            {exercises.length} exercícios
            {volumeKg != null && (
              <Text>
                {' · '}
                <Text style={[styles.metaStrong, { color: accent.color }]}>≈ {formatThousands(volumeKg)} kg</Text>
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
                <DetailExerciseCard
                  key={ex.id ?? `${ex.name}-${i}`}
                  ex={ex}
                  accent={accent}
                  prescribed={!!workout.prescribedByName}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.ctaBar}>
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

const useStyles = createStyles((c, s) => ({
  container: { flex: 1, backgroundColor: c.bg },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
    color: c.textDim,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    color: c.text,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: c.textDim,
  },
  retryButton: {
    backgroundColor: c.primaryFill,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: c.onPrimary,
    fontSize: 12,
    fontWeight: '900',
  },

  flex: { flex: 1 },
  screenTitle: {
    fontFamily: FONT.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: c.text,
    paddingHorizontal: 4,
    paddingTop: 18,
    paddingBottom: 12,
  },

  // ─── Plano (quem prescreveu) ───
  planCard: {
    ...s.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: RADIUS.xl,
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.hairline,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 20, color: c.text },

  // ─── Rótulos de seção ───
  sectionLabel: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: c.textSecondary,
    paddingHorizontal: 4,
    paddingTop: 22,
    paddingBottom: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 24,
    paddingBottom: 10,
  },
  sectionLabelInline: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: c.textSecondary,
  },

  // ─── Próximo treino ───
  nextCard: { ...s.card, borderRadius: RADIUS.xl, backgroundColor: c.surface1, borderWidth: 1, padding: 16, gap: 16 },
  nextTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  nextTitle: { fontFamily: FONT.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.3, color: c.text },
  nextActions: { flexDirection: 'row', gap: 8 },
  listBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: c.ghost,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Letra da ficha ───
  letterTile: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  letterTileLg: { width: 52, height: 52, borderRadius: 14 },
  letterText: { fontFamily: FONT.bold, fontSize: 21, lineHeight: 26, transform: [{ skewX: '-10deg' }] },
  letterTextLg: { fontSize: 26, lineHeight: 32 },

  // ─── Lista de fichas ───
  listCard: { ...s.card, borderRadius: RADIUS.xl, backgroundColor: c.surface1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingLeft: 14, paddingRight: 6 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: c.hairline },
  rowPressed: { backgroundColor: c.surfaceRaised },
  rowBody: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 20, color: c.text },
  rowMuscles: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16, color: c.textSecondary },
  rowMeta: { fontFamily: FONT.mono, fontSize: 11.5, lineHeight: 16, color: c.textSecondary },
  playBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  muscleChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    backgroundColor: c.ghost,
  },
  muscleChipText: { fontFamily: FONT.medium, fontSize: 11, color: c.textDim },

  // ─── CTA gradiente ───
  ctaWrap: {
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: c.primaryFill,
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
    backgroundColor: c.ghost,
  },
  disclaimerText: { flex: 1, fontSize: 11, color: c.textMuted, lineHeight: 17 },

  // ─── DETAIL: header compacto ───
  detailHeader: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backChip: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: c.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: { color: c.textDim, fontSize: 13, fontWeight: '600' },

  // ─── DETAIL: bloco de título ───
  detailScrollView: { flex: 1 },
  detailScroll: { paddingBottom: 20 },
  titleBlock: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6 },
  detailChips: { marginTop: 0, marginBottom: 14 },
  dayBadgeStart: { alignSelf: 'flex-start', marginBottom: 12 },
  detailTitle: {
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 34,
    color: c.text,
    marginBottom: 12,
  },
  infoBox: {
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.ghost,
    marginBottom: 12,
  },
  infoLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  infoText: { flex: 1, fontSize: 11.5, color: c.textMuted, lineHeight: 16 },
  metaText: { fontSize: 12.5, color: c.textDim, fontWeight: '500' },
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
    color: c.textMuted,
  },
  sectionBody: { gap: 10, paddingHorizontal: 16 },

  // ─── DETAIL: card de exercício ───
  exCard: {
    ...s.card,
    flexDirection: 'row',
    backgroundColor: c.surface1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  exStripe: { width: 3 },
  exBody: { flex: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 15 },
  exName: { fontSize: 16.5, fontWeight: '700', color: c.text, lineHeight: 21, marginBottom: 10 },
  exChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  exMuscleChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  exMuscleChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  exTypeChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.ghostHi,
  },
  exTypeChipText: { fontSize: 10, fontWeight: '600', color: c.textMuted },
  exGrid: { flexDirection: 'row', gap: 10 },
  exGridCol: { flex: 1 },
  exGridLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.6, color: c.textMuted, marginBottom: 4 },
  exGridValue: { fontSize: 13.5, fontWeight: '700', color: c.text, lineHeight: 18 },
  exNotes: {
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderLeftWidth: 2,
    backgroundColor: c.ghost,
  },
  exNotesText: { fontSize: 13, color: c.text, lineHeight: 18 },

  // ─── DETAIL: CTA fixo (barra em fluxo, ancorada abaixo do ScrollView) ───
  ctaBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: c.bg,
    borderTopWidth: 1,
    borderTopColor: c.ghost,
  },
}));
