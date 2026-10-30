import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardAvoider from '../components/ui/KeyboardAvoider';
import { LinearGradient } from 'expo-linear-gradient';

import Icon from '../components/Icon';
import SerieCard, { SerieStatus } from '../components/SerieCard';
import RestTimer from '../components/RestTimer';
import { LoadType } from '../types';
import { validateSet } from '../utils/setLimits';
import { parseRestSeconds } from '../utils/restTime';
import { formatClock } from '../utils/formatters';
import { showAlert } from '../components/ui/AlertHost';
import WorkoutCompleteSheet from '../components/WorkoutCompleteSheet';
import type { FinishedWorkout } from '../navigation/types';
import { createStyles, useColors } from '../theme/ThemeContext';
import { allLogs, confirmedLogs, durationOf, emptySets, useActiveWorkout } from '../contexts/ActiveWorkoutContext';

// Um exercício exige peso quando o rótulo de carga tem valor numérico (ex.: "40 kg").
// Rótulos como "Sem carga" / "Peso corporal" não têm dígitos → campo opcional.
// Fichas antigas (ou em cache) podem vir sem loadType: mesma dedução do backend
// (LoadType.infer).
function loadTypeOf(exercise?: { loadType?: LoadType | null; weight?: string | null }): LoadType {
  if (exercise?.loadType) return exercise.loadType;
  const label = String(exercise?.weight ?? '').toLowerCase();
  if (label.includes('corporal') || label.includes('peso do corpo') || label.includes('colete')) return 'BODYWEIGHT';
  if (label.includes('sem carga') || label.includes('sem peso')) return 'NONE';
  return 'EXTERNAL';
}

// Evita renderizar o literal "undefined" quando o campo vem ausente do plano (ex.:
// exercício sem reps/restTime cadastrados).
function withSuffix(value: unknown, suffix: string): string {
  if (value === undefined || value === null || value === '') return '-';
  return `${value} ${suffix}`;
}

export default function ActiveSessionScreen({ navigation }: any) {
  const styles = useStyles();
  const c = useColors();
  const { workout, update, saving, saveSession, stop, discard, setScreenOpen } = useActiveWorkout();

  // Último treino não nulo: a tela segue desenhada atrás da folha "Treino concluído"
  // depois que o salvamento limpa o contexto.
  const shown = useRef(workout);
  if (workout) shown.current = workout;
  const w = shown.current;
  const exercises: any[] = w?.workoutData.data ?? [];

  // Treino salvo: abre a folha "Treino concluído" (postar ou sair).
  const [finished, setFinished] = useState<FinishedWorkout | null>(null);

  // Só redesenha o cronômetro do topo: o tempo vem do início do treino.
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finished]);

  // Sair da tela (botão, voltar do Android, gesto do iOS) minimiza o treino no balão.
  // Sem série confirmada não há o que guardar: descarta.
  const workoutRef = useRef(workout);
  workoutRef.current = workout;
  useEffect(() => {
    setScreenOpen(true);
    return () => {
      setScreenOpen(false);
      const current = workoutRef.current;
      if (current && allLogs(current).length === 0) discard();
    };
  }, [setScreenOpen, discard]);

  const currentIndex = w?.currentIndex ?? 0;
  const currentExercise = exercises[currentIndex];
  const loadType = loadTypeOf(currentExercise);
  // Carga externa com valor prescrito pede o peso; sem prescrição, o aluno escolhe.
  const weightRequired = loadType === 'EXTERNAL' && /\d/.test(String(currentExercise?.weight ?? ''));

  const isLastExercise = currentIndex === exercises.length - 1;
  const setsData = w?.setsData ?? [];

  // Descanso após confirmar uma série: a próxima (inclusive a 1ª do exercício
  // seguinte) só libera quando zerar. Fica fora do estado do exercício de propósito.
  const rest = w?.rest ?? null;
  const skipRest = () => update((cur) => ({ ...cur, rest: null }));
  const addRestTime = () =>
    update((cur) =>
      cur.rest ? { ...cur, rest: { endsAt: cur.rest.endsAt + 15000, totalSeconds: cur.rest.totalSeconds + 15 } } : cur,
    );

  // Fluxo sequencial: a primeira série não confirmada é a "atual"; as posteriores
  // ficam bloqueadas até a anterior ser confirmada.
  const firstPending = setsData.findIndex(s => !s.completed);
  const allConfirmed = setsData.length > 0 && firstPending === -1;
  const confirmedCount = setsData.filter(s => s.completed).length;

  const statusOf = (i: number): SerieStatus => {
    if (setsData[i].completed) return 'confirmada';
    if (i === firstPending) return rest ? 'descanso' : 'atual';
    return 'locked';
  };

  const updateSet = (index: number, field: 'weight' | 'reps', value: string) => {
    update((cur) => ({ ...cur, setsData: cur.setsData.map((s, i) => (i === index ? { ...s, [field]: value } : s)) }));
  };

  const confirmSet = (index: number) => {
    const set = setsData[index];

    // Em BODYWEIGHT o campo é a carga extra; em NONE não há peso.
    const numericReps = Number(set.reps);
    const typedWeight = set.weight.trim() === '' ? 0 : Number(set.weight.replace(',', '.'));
    const error = validateSet(numericReps, loadType === 'NONE' ? 0 : typedWeight);
    if (error) {
      showAlert('Confira a série', error);
      return;
    }

    // Última série do treino: nada a esperar.
    const lastOfWorkout = isLastExercise && index === setsData.length - 1;
    const restSeconds = parseRestSeconds(currentExercise.restTime);
    const at = Date.now();
    update((cur) => ({
      ...cur,
      setsData: cur.setsData.map((s, i) => (i === index ? { ...s, completed: true } : s)),
      lastSetAt: at,
      rest: !lastOfWorkout && restSeconds ? { endsAt: at + restSeconds * 1000, totalSeconds: restSeconds } : cur.rest,
    }));
  };

  // Editar uma série anterior invalida a confirmação de todas as séries seguintes:
  // o modelo sequencial assume que "confirmada" é sempre um prefixo contíguo, então
  // deixar séries posteriores confirmadas com uma anterior reaberta quebraria essa invariante.
  // A série reaberta volta a ser a atual: o descanso que vinha dela não vale mais.
  const editSet = (index: number) => {
    update((cur) => ({
      ...cur,
      setsData: cur.setsData.map((s, i) => (i >= index ? { ...s, completed: false } : s)),
      rest: null,
    }));
  };

  const handleNextAction = () => {
    // O CTA só fica ativo com todas as séries confirmadas; guarda por segurança.
    if (!allConfirmed || saving) return;

    if (isLastExercise) {
      finishWorkoutSession();
      return;
    }

    update((cur) => ({
      ...cur,
      globalSetsLog: [...cur.globalSetsLog, ...confirmedLogs(cur.setsData, exercises[cur.currentIndex].id)],
      currentIndex: cur.currentIndex + 1,
      setsData: emptySets(exercises[cur.currentIndex + 1]),
    }));
  };

  const finishWorkoutSession = async () => {
    if (!w) return;
    const finalLogs = allLogs(w);
    if (finalLogs.length === 0) {
      navigation.goBack();
      return;
    }

    const durationSeconds = durationOf(w);
    if (!(await saveSession())) return;
    // Mesmo cálculo de volume do backend (TrainingSummaryService): Σ carga × reps.
    setFinished({
      clientSessionId: w.clientSessionId,
      title: w.workoutData.title || 'Treino',
      volumeKg: finalLogs.reduce((sum, l) => sum + l.weightUsed * l.repsPerformed, 0),
      durationSeconds,
      setsCount: finalLogs.length,
      exercisesCount: new Set(finalLogs.map(l => l.exerciseId)).size,
    });
  };

  if (!w || !currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhum exercicio encontrado</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.goBack()}>
            <Text style={styles.emptyButtonText}>VOLTAR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoider>
        {/* Barra superior: voltar ao app (esq.) · tempo discreto + parar (dir.) · progresso do exercício */}
        <View style={styles.topBar}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.exitBtn}
              onPress={() => navigation.goBack()}
              disabled={saving}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Voltar ao app. O treino continua em andamento."
            >
              <View style={styles.exitIconBox}>
                <Icon name="arrow-left" size={15} color={c.text} strokeWidth={2.4} />
              </View>
              <Text style={styles.exitText}>Voltar</Text>
            </TouchableOpacity>

            <View style={styles.topRight}>
              <View style={styles.timerBadge}>
                <Icon name="clock" size={11} color={c.textMuted} strokeWidth={2} />
                <Text style={styles.timerText}>{formatClock((now - w.startedAt) / 1000)}</Text>
              </View>
              <TouchableOpacity
                style={styles.stopBtn}
                onPress={() => stop(() => navigation.goBack())}
                disabled={saving}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Parar treino"
              >
                <Text style={styles.stopText}>Parar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.progressLabel}>
            Exercício {currentIndex + 1} de {exercises.length}
          </Text>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[c.primaryFill, c.primaryFillEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / exercises.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, rest && styles.scrollContentResting]} showsVerticalScrollIndicator={false}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseTitle}>{currentExercise.name.toUpperCase()}</Text>
            {!!currentExercise.muscles && (
              <View style={styles.focusChip}>
                <Text style={styles.focusChipText}>Foco: {currentExercise.muscles}</Text>
              </View>
            )}
            {!!currentExercise.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>OBSERVAÇÃO DO PERSONAL</Text>
                <Text style={styles.notesText}>{currentExercise.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.setsContainer}>
            {setsData.map((setObj, idx) => (
              <SerieCard
                key={idx}
                setNumber={idx + 1}
                targetReps={withSuffix(currentExercise.reps, 'reps')}
                // Ficha do personal pode vir sem carga definida: o aluno escolhe.
                cargaLabel={currentExercise.weight || 'Carga livre'}
                restLabel={withSuffix(currentExercise.restTime, 'descanso')}
                loadType={loadType}
                weightRequired={weightRequired}
                status={statusOf(idx)}
                weightValue={setObj.weight}
                repsValue={setObj.reps}
                onWeightChange={(val: string) => updateSet(idx, 'weight', val)}
                onRepsChange={(val: string) => updateSet(idx, 'reps', val)}
                onConfirm={() => confirmSet(idx)}
                onEdit={() => editSet(idx)}
              />
            ))}
          </View>
        </ScrollView>

        {/* CTA inferior: bloqueado até todas as séries serem confirmadas */}
        <View style={styles.footer}>
          {rest && <RestTimer endsAt={rest.endsAt} totalSeconds={rest.totalSeconds} onSkip={skipRest} onAddTime={addRestTime} />}
          {!allConfirmed && (
            <Text style={styles.footerHint}>
              {confirmedCount} de {setsData.length} séries confirmadas
            </Text>
          )}
          {allConfirmed ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleNextAction}
              disabled={saving}
              accessibilityState={{ disabled: saving, busy: saving }}
            >
              <LinearGradient
                colors={[c.primaryFill, c.primaryFillEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.primaryCta, saving && styles.primaryCtaSaving]}
              >
                <Text style={[styles.primaryCtaText, { color: c.onPrimary }]}>
                  {saving ? 'Salvando treino...' : isLastExercise ? 'Finalizar treino' : 'Próximo exercício'}
                </Text>
                {saving ? (
                  <ActivityIndicator size="small" color={c.onPrimary} />
                ) : (
                  <Icon name="arrow-right" size={16} color={c.onPrimary} strokeWidth={2.5} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={[styles.primaryCta, styles.primaryCtaDisabled]}>
              <Text style={[styles.primaryCtaText, { color: c.textMuted }]}>
                {isLastExercise ? 'Finalizar treino' : 'Próximo exercício'}
              </Text>
              <Icon name="arrow-right" size={16} color={c.textMuted} strokeWidth={2.5} />
            </View>
          )}
        </View>

        <WorkoutCompleteSheet
          workout={finished}
          onSkip={() => navigation.goBack()}
          onPost={() => {
            if (finished) navigation.replace('WorkoutCamera', { workout: finished });
          }}
        />
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const useStyles = createStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg },

  topBar: { paddingHorizontal: 16, paddingTop: 4 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exitIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: c.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitText: { color: c.textDim, fontSize: 12.5, fontWeight: '600' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stopBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: c.dangerDim },
  stopText: { color: c.danger, fontSize: 12.5, fontWeight: '700' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timerText: {
    color: c.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  progressLabel: {
    color: c.textDim,
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: c.ghost,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999 },

  scrollContent: { paddingBottom: 150 },
  // Rodapé mais alto com o cronômetro de descanso: a última série não some atrás dele.
  scrollContentResting: { paddingBottom: 240 },

  exerciseHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  exerciseTitle: {
    color: c.text,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 25,
    marginBottom: 8,
  },
  focusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: c.primaryDim,
    borderWidth: 1,
    borderColor: c.primarySoft,
  },
  focusChipText: { color: c.primary, fontSize: 11, fontWeight: '700' },
  notesBox: {
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderLeftWidth: 2,
    borderLeftColor: c.primary,
    backgroundColor: c.ghost,
  },
  notesLabel: { color: c.textMuted, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.6, marginBottom: 4 },
  notesText: { color: c.text, fontSize: 13, lineHeight: 18 },

  setsContainer: { paddingHorizontal: 16, paddingTop: 14 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 22,
    backgroundColor: c.bg,
  },
  footerHint: {
    textAlign: 'center',
    color: c.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 9,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  primaryCtaDisabled: { backgroundColor: c.surface2 },
  primaryCtaSaving: { opacity: 0.7 },
  primaryCtaText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: c.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: c.primaryFill,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: c.onPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
}));
