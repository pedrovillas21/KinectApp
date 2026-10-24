import React, { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import HomeHeader from '../components/home/HomeHeader';
import WeekStrip from '../components/home/WeekStrip';
import TodayWorkoutCard from '../components/home/TodayWorkoutCard';
import HomeStatsRow from '../components/home/HomeStatsRow';
import TrainerRow from '../components/home/TrainerRow';
import OnboardingPrompt from '../components/home/OnboardingPrompt';
import { Screen, StaleBanner } from '../components/ui';
import useFocusResource from '../hooks/useFocusResource';

import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { getMyTrainer } from '../services/trainerService';
import { KINETIC } from '../theme/kinetic';
import type { MainTabScreenProps } from '../navigation/types';
import type { HomeDashboardResponseDTO, NextWorkoutDTO, TrainerPeer } from '../types';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractFirstName(fullName: string | undefined): string {
  if (!fullName) return 'Atleta';
  const [first] = fullName.trim().split(/\s+/);
  return first || 'Atleta';
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { currentUser } = useContext(AuthContext);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Cada fonte tem cache e falha independentes: sem o personal, a Home continua.
  const dashboardRes = useFocusResource('home/dashboard', () =>
    api.get<HomeDashboardResponseDTO>('/home/dashboard').then((r) => r.data),
  );
  const plansRes = useFocusResource('workouts/my-plans', () =>
    api.get<WorkoutPlanAPI[]>('/workouts/my-plans').then((r) => (Array.isArray(r.data) ? r.data : [])),
  );
  const trainerRes = useFocusResource('me/trainer', () =>
    getMyTrainer().then((link) => (link?.status === 'ATIVO' ? link.peer : null)),
  );

  const dashboard = dashboardRes.data ?? null;
  const plans = plansRes.data ?? [];
  const trainer: TrainerPeer | null = trainerRes.data ?? null;
  const isLoading = dashboardRes.loading;

  const refreshAll = useCallback(
    () => Promise.all([dashboardRes.refresh(), plansRes.refresh(), trainerRes.refresh()]),
    [dashboardRes.refresh, plansRes.refresh, trainerRes.refresh],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshAll();
    setIsRefreshing(false);
  }, [refreshAll]);

  const handleStartWorkout = useCallback(
    (workout: NextWorkoutDTO): void => {
      const plan = plans.find((p) => p.id === workout.workoutPlanId);
      if (!plan) return;
      navigation.navigate('ActiveSession', {
        workoutData: plan,
        workoutPlanId: workout.workoutPlanId,
      });
    },
    [navigation, plans],
  );

  const firstName = dashboard?.userFirstName ?? extractFirstName(currentUser?.nome);
  const streakDays = dashboard?.streakDays ?? 0;
  const nextWorkout = dashboard?.nextWorkout ?? null;
  const showOnboarding = !dashboard?.workoutOnboardingCompleted || nextWorkout === null;

  return (
    <Screen
      scroll={!isLoading}
      contentStyle={isLoading ? styles.loading : styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={KINETIC.primary} />
      }
    >
      {isLoading ? (
        <ActivityIndicator color={KINETIC.primary} />
      ) : !dashboard ? (
        <StaleBanner visible hasData={false} onRetry={refreshAll} />
      ) : (
        <>
          <StaleBanner visible={dashboardRes.error || plansRes.error} onRetry={refreshAll} />
          <HomeHeader
            firstName={firstName}
            fullName={currentUser?.nome}
            userId={currentUser?.id}
            onPressAvatar={() => navigation.navigate('Profile')}
          />

          {showOnboarding ? (
            <OnboardingPrompt name={firstName} onGenerateWorkout={() => navigation.navigate('Train')} />
          ) : (
            <View style={styles.sections}>
              {dashboard?.week && dashboard.week.length > 0 ? <WeekStrip days={dashboard.week} /> : null}

              {nextWorkout ? (
                <TodayWorkoutCard
                  workout={nextWorkout}
                  canStart={plans.some((p) => p.id === nextWorkout.workoutPlanId)}
                  onStart={() => handleStartWorkout(nextWorkout)}
                />
              ) : null}

              <HomeStatsRow
                monthSessions={dashboard?.monthSessions ?? dashboard?.completedSessions ?? 0}
                monthTarget={dashboard?.targetSessions ?? 0}
                streakDays={streakDays}
                volume7dKg={dashboard?.volume7dKg ?? 0}
              />

              {trainer ? (
                <TrainerRow trainer={trainer} onOpenProfile={() => navigation.navigate('TrainerProfile')} />
              ) : null}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 24 },
  sections: { gap: 12 },
});
