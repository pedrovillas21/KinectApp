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
  WeeklyActivityApiResponseDTO,
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

// ─── Tipos do back-end existente ──────────────────────────────────────────────
// O endpoint /api/workouts/my-plans devolve uma lista de planos. Mapeamos para
// NextWorkoutDTO pegando o primeiro plano como "próxima ficha pendente"; a
// lógica de ciclo completo é uma tarefa futura do back-end (cf. plano).
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

interface MonthlyStatsAPI {
  completedSessions: number;
  targetSessions: number;
  efficiency: number;
}

// ─── Constantes ──────────────────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildEmptyWeek(todayIndex: number): WeeklyActivityPointDTO[] {
  return WEEK_DAYS_PT.map((day, idx) => ({
    day,
    minutes: 0,
    isToday: idx === todayIndex,
  }));
}

/**
 * Mapeia a resposta crua do back-end (datas + minutos) para os pontos consumidos
 * pelo BarChart, marcando o dia atual com isToday. A ordem segue Domingo → Sábado.
 */
function mapWeeklyActivity(
  response: WeeklyActivityApiResponseDTO,
  todayIso: string,
): WeeklyActivityPointDTO[] {
  if (!Array.isArray(response.days) || response.days.length !== 7) {
    return buildEmptyWeek(new Date().getDay());
  }
  return response.days.map((entry, idx) => ({
    day: WEEK_DAYS_PT[idx],
    minutes: Number(entry.minutes) || 0,
    isToday: entry.date === todayIso,
  }));
}

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractFirstName(fullName: string | undefined): string {
  if (!fullName) return 'Atleta';
  const [first] = fullName.trim().split(/\s+/);
  return first || 'Atleta';
}

/**
 * Converte o WorkoutPlan vindo do back-end no NextWorkoutDTO consumido pelo card.
 * - duração estimada: ~1.2min por série (heurística; até o BE expor o campo).
 * - grupos musculares: deduplicação preservando ordem dos exercícios.
 */
function mapPlanToNextWorkout(plan: WorkoutPlanAPI): NextWorkoutDTO {
  const exercises = plan.data ?? [];
  const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets ?? 0), 0);
  const durationInMinutes = Math.max(20, Math.round(totalSets * 1.2));

  const muscleSet = new Set<string>();
  const muscleGroups: string[] = [];
  exercises.forEach(ex => {
    const m = (ex.muscles ?? '').trim();
    if (!m) return;
    const key = m.toLowerCase();
    if (!muscleSet.has(key)) {
      muscleSet.add(key);
      muscleGroups.push(m);
    }
  });

  const tag = (plan.tag ?? plan.subtitle ?? 'TREINO').toUpperCase();
  const name = plan.title || 'Próximo treino';

  return {
    tag,
    name,
    durationInMinutes,
    exerciseCount: exercises.length,
    muscleGroups: muscleGroups.length > 0 ? muscleGroups : ['Corpo inteiro'],
    workoutPlanId: plan.id,
  };
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { currentUser } = useContext(AuthContext) as AuthContextShape;
  const firstName = extractFirstName(currentUser?.nome);

  const [plans, setPlans] = useState<WorkoutPlanAPI[]>([]);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [targetSessions, setTargetSessions] = useState<number>(0);
  const [efficiency, setEfficiency] = useState<number>(0);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityPointDTO[]>(
    () => buildEmptyWeek(new Date().getDay()),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDashboard = useCallback(async (): Promise<void> => {
    const [plansResult, statsResult, weeklyResult] = await Promise.allSettled([
      api.get<WorkoutPlanAPI[]>('/workouts/my-plans'),
      api.get<MonthlyStatsAPI>('/sessions/monthly-stats'),
      api.get<WeeklyActivityApiResponseDTO>('/sessions/weekly-activity'),
    ]);

    if (plansResult.status === 'fulfilled') {
      setPlans(
        Array.isArray(plansResult.value.data) ? plansResult.value.data : [],
      );
    } else {
      console.warn('[HomeScreen] /workouts/my-plans falhou:', plansResult.reason);
      setPlans([]);
    }

    if (statsResult.status === 'fulfilled') {
      const raw = statsResult.value.data;
      setCompletedSessions(Number(raw.completedSessions) || 0);
      setTargetSessions(Number(raw.targetSessions) || 0);
      setEfficiency(Number(raw.efficiency) || 0);
    } else {
      console.warn(
        '[HomeScreen] /sessions/monthly-stats falhou:',
        statsResult.reason,
      );
    }

    if (weeklyResult.status === 'fulfilled') {
      setWeeklyActivity(mapWeeklyActivity(weeklyResult.value.data, todayIsoDate()));
    } else {
      console.warn(
        '[HomeScreen] /sessions/weekly-activity falhou:',
        weeklyResult.reason,
      );
      setWeeklyActivity(buildEmptyWeek(new Date().getDay()));
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const nextWorkout: NextWorkoutDTO | null =
    plans.length > 0 ? mapPlanToNextWorkout(plans[0]) : null;

  const dashboard: HomeDashboardResponseDTO = {
    workoutOnboardingCompleted: plans.length > 0,
    userFirstName: firstName,
    streakDays: 0,
    completedSessions,
    targetSessions,
    efficiencyPercentage: efficiency,
    nextWorkout,
    ranking: FALLBACK_RANKING,
    weeklyActivity,
  };

  const handleStartWorkout = useCallback(
    (workout: NextWorkoutDTO): void => {
      const plan = plans.find(p => p.id === workout.workoutPlanId) ?? plans[0];
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

  const showOnboarding = dashboard.nextWorkout === null;

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
              name={dashboard.userFirstName}
              onGenerateWorkout={handleGenerateWorkout}
            />
          ) : (
            <>
              <HomeGreeting
                name={dashboard.userFirstName}
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
    height: 140,
  },
});
