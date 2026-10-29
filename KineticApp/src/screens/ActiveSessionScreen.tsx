import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../components/ui/scaled';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardAvoider from '../components/ui/KeyboardAvoider';
import { LinearGradient } from 'expo-linear-gradient';

import Icon from '../components/Icon';
import SerieCard, { SerieStatus } from '../components/SerieCard';
import RestTimer from '../components/RestTimer';
import { SetLogDto, LogSessionRequestDTO, LoadType } from '../types';
import { validateSet } from '../utils/setLimits';
import { parseRestSeconds } from '../utils/restTime';
import api from '../services/api';
import useWorkoutPresence from '../hooks/useWorkoutPresence';
import { uuidv4 } from '../utils/uuid';
import { showAlert } from '../components/ui/AlertHost';
import WorkoutCompleteSheet from '../components/WorkoutCompleteSheet';
import type { FinishedWorkout } from '../navigation/types';
import { createStyles, useColors } from '../theme/ThemeContext';

// Teto do backend (LogSessionRequestDTO @Max): cronômetro esquecido aberto não perde o treino.
const MAX_SESSION_SECONDS = 6 * 60 * 60;

interface SetData {
  weight: string;
  reps: string;
  completed: boolean;
}

// Data do calendário LOCAL do usuário (YYYY-MM-DD). Não usar toISOString(), que
// devolve a data em UTC: treinos feitos à noite (BRT) virariam o dia em UTC e a
// sessão nasceria datada "amanhã" em relação ao LocalDate.now() do servidor,
// caindo fora da janela [início, hoje] do StatsScreen.
function localDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

// Séries confirmadas da tela no formato do backend: vírgula vale como decimal e campo vazio vale 0.
function confirmedLogs(sets: SetData[], exerciseId: string): SetLogDto[] {
  return sets
    .filter((s) => s.completed)
    .map((s, idx) => ({
      exerciseId,
      setNumber: idx + 1,
      repsPerformed: parseInt(s.reps, 10) || 0,
      weightUsed: parseFloat(s.weight.replace(',', '.')) || 0,
    }));
}

export default function ActiveSessionScreen({ navigation, route }: any) {
  const styles = useStyles();
  const c = useColors();
  const { markSaved } = useWorkoutPresence();

  const workoutData = route?.params?.workoutData;
  const exercises = workoutData?.data ?? [];

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Armazena todos os logs de todas as séries já preenchidas
  const [globalSetsLog, setGlobalSetsLog] = useState<SetLogDto[]>([]);

  // Trava enquanto o POST /sessions/log está em andamento: sem isso, toques repetidos
  // em "Finalizar treino" registram a mesma sessão mais de uma vez. O ref bloqueia na
  // hora (dois toques no mesmo frame veriam o state ainda false); o state só desenha o botão.
  const savingRef = useRef(false);
  // Um id por treino, igual em toda tentativa de envio: se a resposta se perder e o
  // usuário tentar de novo, o backend reconhece o treino e não grava outro.
  const clientSessionIdRef = useRef<string>('');
  if (!clientSessionIdRef.current) clientSessionIdRef.current = uuidv4();
  const [saving, setSaving] = useState(false);
  // Treino salvo: abre a folha "Treino concluído" (postar ou sair).
  const [finished, setFinished] = useState<FinishedWorkout | null>(null);
  const startSaving = () => {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    return true;
  };
  const stopSaving = () => {
    savingRef.current = false;
    setSaving(false);
  };

  useEffect(() => {
    if (exercises.length === 0) return;
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exercises.length]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentExercise = exercises[currentIndex];
  const numSets = parseInt(currentExercise?.sets, 10) || 3;
  const loadType = loadTypeOf(currentExercise);
  // Carga externa com valor prescrito pede o peso; sem prescrição, o aluno escolhe.
  const weightRequired = loadType === 'EXTERNAL' && /\d/.test(String(currentExercise?.weight ?? ''));

  const isLastExercise = currentIndex === exercises.length - 1;
  const [setsData, setSetsData] = useState<SetData[]>([]);

  // Descanso após confirmar uma série: a próxima (inclusive a 1ª do exercício
  // seguinte) só libera quando zerar. Fica fora do estado do exercício de propósito.
  const [rest, setRest] = useState<{ endsAt: number; totalSeconds: number } | null>(null);
  const endRest = useCallback(() => setRest(null), []);

  useEffect(() => {
    const initialSets: SetData[] = Array.from({ length: numSets }, () => ({
      weight: '',
      reps: '',
      completed: false
    }));
    setSetsData(initialSets);
  }, [currentIndex, numSets]);

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
    const newSets = [...setsData];
    newSets[index][field] = value;
    setSetsData(newSets);
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

    const newSets = [...setsData];
    newSets[index].completed = true;
    setSetsData(newSets);

    // Última série do treino: nada a esperar.
    const lastOfWorkout = isLastExercise && index === setsData.length - 1;
    const restSeconds = parseRestSeconds(currentExercise.restTime);
    if (!lastOfWorkout && restSeconds) setRest({ endsAt: Date.now() + restSeconds * 1000, totalSeconds: restSeconds });
  };

  // Editar uma série anterior invalida a confirmação de todas as séries seguintes:
  // o modelo sequencial assume que "confirmada" é sempre um prefixo contíguo, então
  // deixar séries posteriores confirmadas com uma anterior reaberta quebraria essa invariante.
  const editSet = (index: number) => {
    const newSets = setsData.map((s, i) => (i >= index ? { ...s, completed: false } : s));
    setSetsData(newSets);
    // A série reaberta volta a ser a atual: o descanso que vinha dela não vale mais.
    setRest(null);
  };

  const accumulateCurrentExerciseSets = () => {
    const mappedLogs = confirmedLogs(setsData, currentExercise.id);
    setGlobalSetsLog(prev => [...prev, ...mappedLogs]);
  };

  // Mesmo corpo de POST /sessions/log ao sair salvando e ao finalizar.
  const sessionPayload = (exercisesLog: SetLogDto[]): LogSessionRequestDTO => ({
    durationInSeconds: Math.min(elapsedTime, MAX_SESSION_SECONDS),
    date: localDateString(),
    exercisesLog,
    clientSessionId: clientSessionIdRef.current,
  });

  const handleNextAction = () => {
    // O CTA só fica ativo com todas as séries confirmadas; guarda por segurança.
    if (!allConfirmed || savingRef.current) return;

    if (isLastExercise) {
      // finishWorkoutSession já junta as séries da tela atual; acumular aqui também
      // duplicaria o último exercício numa nova tentativa após erro.
      finishWorkoutSession();
      return;
    }

    accumulateCurrentExerciseSets();
    setCurrentIndex(prev => prev + 1);
  };

  // Saída deliberada da tela: marca a flag para o beforeRemove não interceptar de novo.
  // Se a saída veio de um voltar bloqueado (gesto/botão do Android), redespacha a ação original.
  const allowLeaveRef = useRef(false);
  const leaveScreen = (pendingAction?: any) => {
    allowLeaveRef.current = true;
    if (pendingAction) {
      navigation.dispatch(pendingAction);
    } else {
      navigation.goBack();
    }
  };

  const handleExitSession = (pendingAction?: any) => {
    if (savingRef.current) return;

    const allLogs = [...globalSetsLog, ...confirmedLogs(setsData, currentExercise.id)];

    const discardAndLeave = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      leaveScreen(pendingAction);
    };

    // Nada confirmado: não há o que guardar, só confirma a saída.
    if (allLogs.length === 0) {
      showAlert('Sair do treino?', 'Nenhuma série foi confirmada, então nada será registrado.', [
        { text: 'Continuar treino', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: discardAndLeave },
      ]);
      return;
    }

    const saveAndLeave = () => {
      if (!startSaving()) return;
      if (timerRef.current) clearInterval(timerRef.current);

      api.post('/sessions/log', sessionPayload(allLogs))
        .then(() => {
          markSaved();
          showAlert('Treino salvo', 'As séries concluídas entraram no seu histórico.');
          leaveScreen(pendingAction);
        })
        .catch((error: unknown) => {
          stopSaving();
          console.error('Erro ao salvar sessão parcial', error);
          showAlert('Erro', 'Não foi possível salvar os dados do treino.');
        });
    };

    const total = allLogs.length;
    showAlert(
      'Treino incompleto',
      `Você confirmou ${total} ${total === 1 ? 'série' : 'séries'}. Quer que elas contem no seu histórico e nas estatísticas?`,
      [
        { text: 'Salvar e sair', onPress: saveAndLeave },
        { text: 'Sair sem salvar', style: 'destructive', onPress: discardAndLeave },
        { text: 'Continuar treino', style: 'cancel' },
      ]
    );
  };

  // Intercepta QUALQUER tentativa de sair da tela (botão/gesto de voltar do Android,
  // goBack programático) e força o fluxo de confirmação — sem isso o usuário sai
  // arrastando pro lado e as séries concluídas nunca são salvas. O ref evita que o
  // listener capture state desatualizado (séries, cronômetro) entre renders.
  const exitHandlerRef = useRef(handleExitSession);
  exitHandlerRef.current = handleExitSession;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Saída já autorizada (pós-confirmação/salvamento) ou sessão sem exercícios: deixa passar.
      if (allowLeaveRef.current || exercises.length === 0) return;
      e.preventDefault();
      // Salvando: segura a tela até a resposta, sem abrir outro fluxo de saída/gravação.
      if (savingRef.current) return;
      exitHandlerRef.current(e.data.action);
    });
    return unsubscribe;
  }, [navigation, exercises.length]);

  const finishWorkoutSession = async () => {
    if (!startSaving()) return;
    if (timerRef.current) clearInterval(timerRef.current);

    // O globalSetsLog já contém os exercícios anteriores.
    // Como accumulateCurrentExerciseSets pode não ter refletido no state imediato devido ao batching,
    // vamos pegar os dados da tela atual também para garantir:
    const finalLogs = [...globalSetsLog, ...confirmedLogs(setsData, currentExercise.id)];

    if (finalLogs.length === 0) {
      stopSaving();
      leaveScreen();
      return;
    }

    try {
      await api.post('/sessions/log', sessionPayload(finalLogs));
      markSaved();
      // Mesmo cálculo de volume do backend (TrainingSummaryService): Σ carga × reps.
      setFinished({
        clientSessionId: clientSessionIdRef.current,
        title: workoutData?.title || 'Treino',
        volumeKg: finalLogs.reduce((sum, l) => sum + l.weightUsed * l.repsPerformed, 0),
        durationSeconds: elapsedTime,
        setsCount: finalLogs.length,
        exercisesCount: new Set(finalLogs.map(l => l.exerciseId)).size,
      });
    } catch (error) {
      stopSaving();
      console.error('Erro ao salvar sessão', error);
      showAlert('Erro', 'Não foi possível salvar os dados do treino.');
    }
  };

  if (!currentExercise) {
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
        {/* Barra superior: sair (esq.) · tempo discreto (dir.) · progresso do exercício */}
        <View style={styles.topBar}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.exitBtn}
              onPress={() => handleExitSession()}
              disabled={saving}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.exitIconBox}>
                <Icon name="arrow-left" size={15} color={c.text} strokeWidth={2.4} />
              </View>
              <Text style={styles.exitText}>Sair da sessão</Text>
            </TouchableOpacity>

            <View style={styles.timerBadge}>
              <Icon name="clock" size={11} color={c.textMuted} strokeWidth={2} />
              <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
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
          {rest && <RestTimer endsAt={rest.endsAt} totalSeconds={rest.totalSeconds} onDone={endRest} />}
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
          onSkip={() => leaveScreen()}
          onPost={() => {
            if (!finished) return;
            allowLeaveRef.current = true;
            navigation.replace('WorkoutCamera', { workout: finished });
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
