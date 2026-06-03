import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import AppHeader from '../components/AppHeader';
import HomeGreeting from '../components/home/HomeGreeting';
import NextWorkoutCard from '../components/home/NextWorkoutCard';
import AdherenceCard from '../components/home/AdherenceCard';
import RankingCard from '../components/home/RankingCard';
import WeeklyChart from '../components/home/WeeklyChart';
import OnboardingPrompt from '../components/home/OnboardingPrompt';

import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { KINETIC } from '../theme/kinetic';
import type {
  HomeDashboardResponseDTO,
  NextWorkoutDTO,
} from '../types';

// ─── Tipos locais (usados apenas para navegar ao ActiveSession) ───────────────

interface ExerciseAPI {
  id: string;
  name: string;
  muscles: string;
  type: string;
  sets: number;
  reps: string;
  weight: string;
  restTime: string;
}

interface WorkoutPlanAPI {
  id: string;
  title: string;
  subtitle?: string | null;
  tag?: string | null;
  level?: string | null;
  createdAt?: string | null;
  data: ExerciseAPI[];
}

// ─── Tipos de navegação ───────────────────────────────────────────────────────

interface HomeNavigationProp {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}

interface HomeScreenProps {
  navigation: HomeNavigationProp;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractFirstName(fullName: string | undefined): string {
  if (!fullName) return 'Atleta';
  const [first] = fullName.trim().split(/\s+/);
  return first || 'Atleta';
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { currentUser } = useContext(AuthContext);

  const [dashboard, setDashboard] = useState<HomeDashboardResponseDTO | null>(null);
  const [plans, setPlans] = useState<WorkoutPlanAPI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDashboard = useCallback(async (): Promise<void> => {
    const [dashboardResult, plansResult] = await Promise.allSettled([
      api.get<HomeDashboardResponseDTO>('/home/dashboard'),
      api.get<WorkoutPlanAPI[]>('/workouts/my-plans'),
    ]);

    if (dashboardResult.status === 'fulfilled') {
      setDashboard(dashboardResult.value.data);
    } else {
      console.warn('[HomeScreen] /home/dashboard falhou:', dashboardResult.reason);
    }

    if (plansResult.status === 'fulfilled') {
      setPlans(
        Array.isArray(plansResult.value.data) ? plansResult.value.data : [],
      );
    } else {
      console.warn('[HomeScreen] /workouts/my-plans falhou:', plansResult.reason);
      setPlans([]);
    }

    setIsLoading(false);
  }, []);

  // useFocusEffect já cobre a montagem inicial e cada retorno de foco à tela,
  // então não há useEffect separado (evita o request duplicado no startup).
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const handleStartWorkout = useCallback(
    (workout: NextWorkoutDTO): void => {
      const plan = plans.find(p => p.id === workout.workoutPlanId);
      if (!plan) return;
      navigation.navigate('ActiveSession', {
        workoutData: plan,
        workoutPlanId: workout.workoutPlanId,
      });
    },
    [navigation, plans],
  );

  const handleGenerateWorkout = useCallback((): void => {
    navigation.navigate('Train');
  }, [navigation]);

  const handleViewAllRanking = useCallback((): void => {
    navigation.navigate('Social');
  }, [navigation]);

  const firstName =
    dashboard?.userFirstName ?? extractFirstName(currentUser?.nome);
  const streakDays = dashboard?.streakDays ?? 0;
  const showOnboarding =
    !dashboard?.workoutOnboardingCompleted || dashboard?.nextWorkout === null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader streakDays={showOnboarding ? 0 : streakDays} />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={KINETIC.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {showOnboarding ? (
            <OnboardingPrompt
              name={firstName}
              onGenerateWorkout={handleGenerateWorkout}
            />
          ) : (
            <>
              <HomeGreeting
                name={firstName}
                streakDays={streakDays}
              />

              {dashboard?.nextWorkout && (
                <NextWorkoutCard
                  workout={dashboard.nextWorkout}
                  onStart={() => handleStartWorkout(dashboard.nextWorkout!)}
                />
              )}

              <AdherenceCard
                completed={dashboard?.completedSessions ?? 0}
                target={dashboard?.targetSessions ?? 0}
              />

              <RankingCard
                items={dashboard?.ranking ?? []}
                onPressViewAll={handleViewAllRanking}
              />

              <WeeklyChart data={dashboard?.weeklyActivity ?? []} />
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KINETIC.bg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  bottomSpacer: {
    height: 140,
  },
});
