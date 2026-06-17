import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import Icon from '../components/Icon';
import SerieCard from '../components/SerieCard';
import AppHeader from '../components/AppHeader';
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

export default function ActiveSessionScreen({ navigation, route }: any) {
  useContext(ThemeContext);
  const { markSaved } = useWorkoutPresence();

  const bgColor = '#121212';

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

  const [setsData, setSetsData] = useState<SetData[]>([]);

  useEffect(() => {
    const initialSets: SetData[] = Array.from({ length: numSets }, () => ({
      weight: '',
      reps: '',
      completed: false
    }));
    setSetsData(initialSets);
  }, [currentIndex, numSets]);

  const activeSetIndex = setsData.findIndex(s => !s.completed);
  const currentActiveSet = activeSetIndex === -1 ? numSets - 1 : activeSetIndex;

  const updateSet = (index: number, field: keyof SetData, value: string | boolean) => {
    const newSets = [...setsData];
    (newSets[index][field] as any) = value;
    setSetsData(newSets);
  };

  const toggleSetComplete = (index: number) => {
    const set = setsData[index];

    // Se já está completa, permite desmarcar
    if (set.completed) {
      const newSets = [...setsData];
      newSets[index].completed = false;
      setSetsData(newSets);
      return;
    }

    // Validação Fail Fast
    const numericReps = parseInt(set.reps, 10);
    const numericWeight = parseFloat(set.weight.replace(',', '.'));

    if (isNaN(numericReps) || numericReps < 1) {
      Alert.alert('Série Incompleta', 'Insira pelo menos 1 repetição.');
      return;
    }

    if (isNaN(numericWeight) || numericWeight < 0) {
      Alert.alert('Peso Inválido', 'O peso não pode ser negativo. Use 0 para peso do corpo.');
      return;
    }

    const newSets = [...setsData];
    newSets[index].completed = true;
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
    const hasAnyCompleted = setsData.some(s => s.completed);

    if (isLastExercise) {
      // Último exercício: verificar se há algo para enviar (este ex. ou anteriores)
      if (!hasAnyCompleted && globalSetsLog.length === 0) {
        Alert.alert('Treino Vazio', 'Marque pelo menos uma série como concluída antes de finalizar o treino.');
        return;
      }
    } else {
      // Exercício intermediário: exige pelo menos 1 série marcada para avançar
      if (!hasAnyCompleted) {
        Alert.alert('Treino Incompleto', 'Complete e marque (✓) pelo menos uma série deste exercício para avançar.');
        return;
      }
    }

    accumulateCurrentExerciseSets();

    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishWorkoutSession();
    }
  };

  const handleExitSession = () => {
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
              navigation.goBack();
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
                navigation.goBack();
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
      navigation.goBack();
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
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar sessão', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados do treino.');
    }
  };

  if (!currentExercise) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <AppHeader />
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
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.timerSection}>
          <Text style={styles.elapsedLabel}>ELAPSED TIME</Text>
          <Text style={styles.timeValue}>{formatTime(elapsedTime)}</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>⤡ {currentIndex + 1}/{exercises.length} Exercícios</Text>
          </View>
        </View>

        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseTitle}>{currentExercise.name.toUpperCase()}</Text>
          <Text style={styles.exerciseFocus}>Focus: {currentExercise.muscles}</Text>
        </View>

        <View style={styles.setsContainer}>
          {setsData.map((setObj, idx) => (
            <SerieCard 
              key={idx}
              setNumber={idx + 1}
              targetReps={currentExercise.reps + ' reps'}
              targetWeight={currentExercise.weight}
              restTime={currentExercise.restTime + ' rest'}
              isActive={idx === currentActiveSet}
              isCompleted={setObj.completed}
              weightValue={setObj.weight}
              repsValue={setObj.reps}
              onWeightChange={(val: string) => updateSet(idx, 'weight', val)}
              onRepsChange={(val: string) => updateSet(idx, 'reps', val)}
              onToggleComplete={() => toggleSetComplete(idx)}
            />
          ))}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryCta, isLastExercise && { backgroundColor: COLORS.neonBlue }]}
          onPress={handleNextAction}
        >
          <View style={styles.primaryCtaContent}>
            <Text style={styles.primaryCtaText}>
              {isLastExercise ? 'FINALIZAR TREINO' : 'PRÓXIMO EXERCÍCIO'}
            </Text>
            {!isLastExercise && <Icon name="arrow-right" size={18} color="#000" strokeWidth={2.4} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryCta} onPress={handleExitSession}>
          <Text style={styles.secondaryCtaText}>Sair da Sessão</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  timerSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  elapsedLabel: {
    color: '#CCC',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  timeValue: {
    color: COLORS.neonBlue,
    fontSize: 56,
    fontWeight: '900',
    marginBottom: 16,
  },
  progressBadge: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  progressBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exerciseHeader: {
    marginBottom: 24,
  },
  exerciseTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  exerciseFocus: {
    color: '#00E5FF',
    fontSize: 14,
  },
  setsContainer: {
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#121212',
  },
  primaryCta: {
    backgroundColor: COLORS.neonBlue,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryCtaText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryCta: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  secondaryCtaText: {
    color: '#CCC',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: COLORS.neonBlue,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
  }
});
