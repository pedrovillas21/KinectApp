import React, { useCallback, useContext, useEffect, useState } from 'react';
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
  RankingEntryDTO,
  WeeklyActivityPointDTO,
} from '../types';

interface AuthContextShape {
  currentUser: { id: string | number; nome?: string } | null;
}

interface HomeNavigationProp {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}

interface HomeScreenProps {
  navigation: HomeNavigationProp;
}

const FALLBACK_RANKING: RankingEntryDTO[] = [
  {
    id: 'rk-1',
    position: 1,
    name: 'Alex Sterling',
    minutes: 340,
    delta: 12,
    online: true,
    isCurrentUser: false,
  },
  {
    id: 'rk-2',
    position: 2,
    name: 'Marcus Chen',
    minutes: 290,
    delta: -5,
    online: false,
    isCurrentUser: false,
  },
  {
    id: 'rk-3',
    position: 3,
    name: 'Sarah Jenkins',
    minutes: 215,
    delta: 18,
    online: true,
    isCurrentUser: false,
  },
];

const WEEK_DAYS_PT: ReadonlyArray<string> = [
  'Dom',
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
];

function buildEmptyWeek(todayIndex: number): WeeklyActivityPointDTO[] {
  return WEEK_DAYS_PT.map((day, idx) => ({
    day,
    minutes: 0,
    isToday: idx === todayIndex,
  }));
}

function buildFallbackDashboard(firstName: string): HomeDashboardResponseDTO {
  const todayIndex = new Date().getDay();
  return {
    workoutOnboardingCompleted: false,
    userFirstName: firstName,
    streakDays: 0,
    completedSessions: 0,
    targetSessions: 0,
    efficiencyPercentage: 0,
    nextWorkout: null,
    ranking: FALLBACK_RANKING,
    weeklyActivity: buildEmptyWeek(todayIndex),
  };
}

function extractFirstName(fullName: string | undefined): string {
  if (!fullName) return 'Atleta';
  const [first] = fullName.trim().split(/\s+/);
  return first || 'Atleta';
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { currentUser } = useContext(AuthContext) as AuthContextShape;
  const firstName = extractFirstName(currentUser?.nome);

  const [dashboard, setDashboard] = useState<HomeDashboardResponseDTO>(() =>
    buildFallbackDashboard(firstName),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<HomeDashboardResponseDTO>('/home/dashboard');
      setDashboard({
        workoutOnboardingCompleted: Boolean(data.workoutOnboardingCompleted),
        userFirstName: data.userFirstName || firstName,
        streakDays: Number(data.streakDays) || 0,
        completedSessions: Number(data.completedSessions) || 0,
        targetSessions: Number(data.targetSessions) || 0,
        efficiencyPercentage: Number(data.efficiencyPercentage) || 0,
        nextWorkout: data.nextWorkout ?? null,
        ranking: Array.isArray(data.ranking) ? data.ranking : FALLBACK_RANKING,
        weeklyActivity:
          Array.isArray(data.weeklyActivity) && data.weeklyActivity.length === 7
            ? data.weeklyActivity
            : buildEmptyWeek(new Date().getDay()),
      });
    } catch (error) {
      console.warn(
        '[HomeScreen] /home/dashboard indisponível, usando estado vazio:',
        error,
      );
      setDashboard(buildFallbackDashboard(firstName));
    } finally {
      setIsLoading(false);
    }
  }, [firstName]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const handleStartWorkout = useCallback(
    (workout: NextWorkoutDTO): void => {
      navigation.navigate('ActiveSession', {
        workoutPlanId: workout.workoutPlanId,
      });
    },
    [navigation],
  );

  const handleGenerateWorkout = useCallback((): void => {
    navigation.navigate('Train');
  }, [navigation]);

  const handleViewAllRanking = useCallback((): void => {
    navigation.navigate('Social');
  }, [navigation]);

  const showOnboarding =
    !dashboard.workoutOnboardingCompleted || dashboard.nextWorkout === null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader streakDays={showOnboarding ? 0 : dashboard.streakDays} />

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
              name={dashboard.userFirstName || firstName}
              onGenerateWorkout={handleGenerateWorkout}
            />
          ) : (
            <>
              <HomeGreeting
                name={dashboard.userFirstName || firstName}
                streakDays={dashboard.streakDays}
              />

              {dashboard.nextWorkout && (
                <NextWorkoutCard
                  workout={dashboard.nextWorkout}
                  onStart={() => handleStartWorkout(dashboard.nextWorkout!)}
                />
              )}

              <AdherenceCard
                completed={dashboard.completedSessions}
                target={dashboard.targetSessions}
              />

              <RankingCard
                items={dashboard.ranking}
                onPressViewAll={handleViewAllRanking}
              />

              <WeeklyChart data={dashboard.weeklyActivity} />
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
    height: 100,
  },
});
