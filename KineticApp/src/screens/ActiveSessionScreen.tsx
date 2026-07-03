import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { ThemeContext } from '../contexts/ThemeContext';
import { KINETIC } from '../theme/kinetic';
import Icon from '../components/Icon';
import SerieCard, { SerieStatus } from '../components/SerieCard';
import { SetLogDto, LogSessionRequestDTO } from '../types';
import api from '../services/api';
import useWorkoutPresence from '../hooks/useWorkoutPresence';

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
function requiresWeight(weightLabel?: string): boolean {
  return /\d/.test(String(weightLabel ?? ''));
}

// Pequeno relógio de referência para o cabeçalho (discreto, não compete com o fluxo).
function ClockIcon() {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill="none" stroke={KINETIC.textMuted} strokeWidth={2} />
      <Polyline
        points="12 6 12 12 16 14"
        fill="none"
        stroke={KINETIC.textMuted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ActiveSessionScreen({ navigation, route }: any) {
  useContext(ThemeContext);
  const { markSaved } = useWorkoutPresence();

  const workoutData = route?.params?.workoutData;
  const workoutPlanId: string | undefined = route?.params?.workoutPlanId;
  const exercises = workoutData?.data ?? [];

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Armazena todos os logs de todas as séries já preenchidas
  const [globalSetsLog, setGlobalSetsLog] = useState<SetLogDto[]>([]);

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
  const weightRequired = requiresWeight(currentExercise?.weight);

  const [setsData, setSetsData] = useState<SetData[]>([]);

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
    if (i === firstPending) return 'atual';
    return 'locked';
  };

  const updateSet = (index: number, field: 'weight' | 'reps', value: string) => {
    const newSets = [...setsData];
    newSets[index][field] = value;
    setSetsData(newSets);
  };

  const confirmSet = (index: number) => {
    const set = setsData[index];

    // Validação Fail Fast
    const numericReps = parseInt(set.reps, 10);
    if (isNaN(numericReps) || numericReps < 1) {
      Alert.alert('Série Incompleta', 'Insira pelo menos 1 repetição.');
      return;
    }

    if (weightRequired) {
      const numericWeight = parseFloat(set.weight.replace(',', '.'));
      if (isNaN(numericWeight) || numericWeight < 0) {
        Alert.alert('Peso Inválido', 'O peso não pode ser negativo. Use 0 para peso do corpo.');
        return;
      }
    }

    const newSets = [...setsData];
    newSets[index].completed = true;
    setSetsData(newSets);
  };

  const editSet = (index: number) => {
    const newSets = [...setsData];
    newSets[index].completed = false;
    setSetsData(newSets);
  };

  const accumulateCurrentExerciseSets = () => {
    const completedSets = setsData.filter(s => s.completed);
    const mappedLogs: SetLogDto[] = completedSets.map((s, idx) => {
      // Trata vírgula e converte para float
      const parsedWeight = parseFloat(s.weight.replace(',', '.'));
      const parsedReps = parseInt(s.reps, 10);
      return {
        exerciseId: currentExercise.id,
        setNumber: idx + 1,
        repsPerformed: isNaN(parsedReps) ? 0 : parsedReps,
        weightUsed: isNaN(parsedWeight) ? 0 : parsedWeight
      };
    });

    setGlobalSetsLog(prev => [...prev, ...mappedLogs]);
  };

  const isLastExercise = currentIndex === exercises.length - 1;

  const handleNextAction = () => {
    // O CTA só fica ativo com todas as séries confirmadas; guarda por segurança.
    if (!allConfirmed) return;

    accumulateCurrentExerciseSets();

    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishWorkoutSession();
    }
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
    Alert.alert(
      'Tem a certeza que deseja sair?',
      'O seu treino será encerrado. Apenas as séries marcadas como concluídas serão guardadas no seu histórico.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: () => {
            // Acumula séries do exercício atual
            const currentCompleted = setsData.filter(s => s.completed);
            const currentMapped: SetLogDto[] = currentCompleted.map((s, idx) => ({
              exerciseId: currentExercise.id,
              setNumber: idx + 1,
              repsPerformed: parseInt(s.reps, 10) || 0,
              weightUsed: parseFloat(s.weight.replace(',', '.')) || 0
            }));

            const allLogs = [...globalSetsLog, ...currentMapped];

            if (allLogs.length === 0) {
              // Sessão vazia: descarta sem poluir o banco
              if (timerRef.current) clearInterval(timerRef.current);
              leaveScreen(pendingAction);
              return;
            }

            // Gravação parcial
            const payload: LogSessionRequestDTO = {
              durationInSeconds: elapsedTime,
              date: localDateString(),
              exercisesLog: allLogs,
              workoutPlanId,
            };

            if (timerRef.current) clearInterval(timerRef.current);

            api.post('/sessions/log', payload)
              .then(() => {
                markSaved();
                Alert.alert('Treino Salvo', 'As séries concluídas foram guardadas.');
                leaveScreen(pendingAction);
              })
              .catch((error: unknown) => {
                console.error('Erro ao salvar sessão parcial', error);
                Alert.alert('Erro', 'Não foi possível salvar os dados do treino.');
              });
          }
        }
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
      exitHandlerRef.current(e.data.action);
    });
    return unsubscribe;
  }, [navigation, exercises.length]);

  const finishWorkoutSession = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // O globalSetsLog já contém os exercícios anteriores.
    // Como accumulateCurrentExerciseSets pode não ter refletido no state imediato devido ao batching,
    // vamos pegar os dados da tela atual também para garantir:
    const completedSets = setsData.filter(s => s.completed);
    const mappedLogs: SetLogDto[] = completedSets.map((s, idx) => ({
      exerciseId: currentExercise.id,
      setNumber: idx + 1,
      repsPerformed: parseInt(s.reps, 10) || 0,
      weightUsed: parseFloat(s.weight.replace(',', '.')) || 0
    }));

    const finalLogs = [...globalSetsLog, ...mappedLogs];

    if (finalLogs.length === 0) {
      leaveScreen();
      return;
    }

    const payload: LogSessionRequestDTO = {
      durationInSeconds: elapsedTime,
      date: localDateString(),
      exercisesLog: finalLogs,
      workoutPlanId,
    };

    try {
      await api.post('/sessions/log', payload);
      markSaved();
      Alert.alert('Parabéns!', 'Seu treino foi salvo com sucesso.');
      leaveScreen();
    } catch (error) {
      console.error('Erro ao salvar sessão', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados do treino.');
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
      {/* Barra superior: sair (esq.) · tempo discreto (dir.) · progresso do exercício */}
      <View style={styles.topBar}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => handleExitSession()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.exitIconBox}>
              <Icon name="arrow-left" size={15} color={KINETIC.text} strokeWidth={2.4} />
            </View>
            <Text style={styles.exitText}>Sair da sessão</Text>
          </TouchableOpacity>

          <View style={styles.timerBadge}>
            <ClockIcon />
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>
        </View>

        <Text style={styles.progressLabel}>
          Exercício {currentIndex + 1} de {exercises.length}
        </Text>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[KINETIC.primary, '#00bcd4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / exercises.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseTitle}>{currentExercise.name.toUpperCase()}</Text>
          {!!currentExercise.muscles && (
            <View style={styles.focusChip}>
              <Text style={styles.focusChipText}>Foco: {currentExercise.muscles}</Text>
            </View>
          )}
        </View>

        <View style={styles.setsContainer}>
          {setsData.map((setObj, idx) => (
            <SerieCard
              key={idx}
              setNumber={idx + 1}
              targetReps={`${currentExercise.reps} reps`}
              cargaLabel={currentExercise.weight}
              restLabel={`${currentExercise.restTime} descanso`}
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
        {!allConfirmed && (
          <Text style={styles.footerHint}>
            {confirmedCount} de {setsData.length} séries confirmadas
          </Text>
        )}
        {allConfirmed ? (
          <TouchableOpacity activeOpacity={0.85} onPress={handleNextAction}>
            <LinearGradient
              colors={[KINETIC.primary, '#00bcd4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryCta}
            >
              <Text style={[styles.primaryCtaText, { color: '#001f24' }]}>
                {isLastExercise ? 'Finalizar treino' : 'Próximo exercício'}
              </Text>
              <Icon name="arrow-right" size={16} color="#001f24" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={[styles.primaryCta, styles.primaryCtaDisabled]}>
            <Text style={[styles.primaryCtaText, { color: KINETIC.textMuted }]}>
              {isLastExercise ? 'Finalizar treino' : 'Próximo exercício'}
            </Text>
            <Icon name="arrow-right" size={16} color={KINETIC.textMuted} strokeWidth={2.5} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KINETIC.bg },

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
    backgroundColor: KINETIC.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitText: { color: KINETIC.textDim, fontSize: 12.5, fontWeight: '600' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timerText: {
    color: KINETIC.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  progressLabel: {
    color: KINETIC.textDim,
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: KINETIC.ghost,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999 },

  scrollContent: { paddingBottom: 150 },

  exerciseHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  exerciseTitle: {
    color: KINETIC.text,
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
    backgroundColor: KINETIC.primaryDim,
    borderWidth: 1,
    borderColor: KINETIC.primarySoft,
  },
  focusChipText: { color: KINETIC.primary, fontSize: 11, fontWeight: '700' },

  setsContainer: { paddingHorizontal: 16, paddingTop: 14 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 22,
    backgroundColor: KINETIC.bg,
  },
  footerHint: {
    textAlign: 'center',
    color: KINETIC.textMuted,
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
  primaryCtaDisabled: { backgroundColor: KINETIC.surface2 },
  primaryCtaText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: KINETIC.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: KINETIC.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#001f24',
    fontSize: 12,
    fontWeight: '900',
  },
});
