import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../contexts/ThemeContext';
import { COLORS } from '../theme/colors';
import SerieCard from '../components/SerieCard';
import AppHeader from '../components/AppHeader';

export default function ActiveSessionScreen({ navigation, route }) {
  const { isDarkMode } = useContext(ThemeContext);
  
  // Background predominante na imagem é bem escuro
  const bgColor = '#121212'; 

  // Recupera lista de exercícios
  const workoutData = route?.params?.workoutData;
  const exercises = workoutData?.data ?? [];

  // Estado do Cronômetro
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Paginação
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentExercise = exercises[currentIndex];
  const numSets = parseInt(currentExercise?.sets, 10) || 3;

  // Estado das Séries do Exercício Atual
  const [setsData, setSetsData] = useState([]);

  useEffect(() => {
    const initialSets = Array.from({ length: numSets }, () => ({
      weight: '',
      reps: '',
      completed: false
    }));
    setSetsData(initialSets);
  }, [currentIndex, numSets]);

  const activeSetIndex = setsData.findIndex(s => !s.completed);
  const currentActiveSet = activeSetIndex === -1 ? numSets - 1 : activeSetIndex;

  const updateSet = (index, field, value) => {
    const newSets = [...setsData];
    newSets[index][field] = value;
    setSetsData(newSets);
  };

  const toggleSetComplete = (index) => {
    const set = setsData[index];
    if (!set.weight || !set.reps) {
      Alert.alert('Atenção', 'Preencha o peso e as reps realizadas antes de concluir a série.');
      return;
    }
    const newSets = [...setsData];
    newSets[index].completed = !newSets[index].completed;
    setSetsData(newSets);
  };

  const handleNextAction = () => {
    // Requisito obrigatório do usuário: precisa ter preenchido pelo menos alguma série
    const hasAnyCompleted = setsData.some(s => s.completed);
    if (!hasAnyCompleted) {
      Alert.alert('Treino Incompleto', 'Complete e marque (✓) pelo menos uma série deste exercício para avançar.');
      return;
    }

    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinishWorkout();
    }
  };

  const handleFinishWorkout = () => {
    clearInterval(timerRef.current);
    navigation.goBack();
  };

  const isLastExercise = currentIndex === exercises.length - 1;

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
        
        {/* TIMER SECTION */}
        <View style={styles.timerSection}>
          <Text style={styles.elapsedLabel}>ELAPSED TIME</Text>
          <Text style={styles.timeValue}>{formatTime(elapsedTime)}</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>⤡ {currentIndex + 1}/{exercises.length} Exercícios</Text>
          </View>
        </View>

        {/* EXERCISE HEADER */}
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseTitle}>{currentExercise.name.toUpperCase()}</Text>
          <Text style={styles.exerciseFocus}>Focus: {currentExercise.muscles}</Text>
        </View>

        {/* SETS LIST */}
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
              onWeightChange={(val) => updateSet(idx, 'weight', val)}
              onRepsChange={(val) => updateSet(idx, 'reps', val)}
              onToggleComplete={() => toggleSetComplete(idx)}
            />
          ))}
        </View>

      </ScrollView>

      {/* FIXED FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryCta, isLastExercise && { backgroundColor: COLORS.neonBlue }]}
          onPress={handleNextAction}
        >
          <Text style={styles.primaryCtaText}>
            {isLastExercise ? 'FINALIZAR TREINO' : 'PRÓXIMO EXERCÍCIO →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryCta} onPress={handleFinishWorkout}>
          <Text style={styles.secondaryCtaText}>◉ Finalizar Treino</Text>
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
    backgroundColor: '#121212', // matches bg
    // add subtle top border or fade edge if desired, but image is flat dark
  },
  primaryCta: {
    backgroundColor: COLORS.neonBlue,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24, // spacing to the secondary button
  },
  primaryCtaText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryCta: {
    alignItems: 'center',
    paddingBottom: 8, // Give space near bottom edge
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
