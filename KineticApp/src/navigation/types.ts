import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

/** Abas do app logado, na ordem da barra. */
export type MainTabParamList = {
  Home: undefined;
  Train: undefined;
  Social: undefined;
  Stats: undefined;
  Profile: undefined;
};

/** Pilha do app logado (abas + telas empilhadas por cima). */
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ActiveSession: { workoutData?: unknown; workoutPlanId?: string } | undefined;
  /** Perfil público de outro usuário (estilo Instagram/Hevy). */
  UserProfile: { userId: string };
  /** Comparar progresso de treino com um amigo (só amizade aceita). */
  CompareProgress: { friendId: string };
  Settings: undefined;
  /** Objetivo, métricas, nível, frequência e anamnese (o que alimenta a IA). */
  Protocol: undefined;
  /** Perfil profissional do personal do aluno logado. */
  TrainerProfile: undefined;
};

export type MainStackScreenProps<R extends keyof MainStackParamList> = NativeStackScreenProps<MainStackParamList, R>;
export type MainStackNavigation = NativeStackNavigationProp<MainStackParamList>;

/** Props de uma aba: navega entre abas e também para as telas da pilha. */
export type MainTabScreenProps<R extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, R>,
  NativeStackScreenProps<MainStackParamList>
>;
