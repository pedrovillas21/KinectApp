import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FeedPostData } from '../types';

/** Abas do app logado, na ordem da barra. */
export type MainTabParamList = {
  Home: undefined;
  Train: undefined;
  /** `refreshAt` muda → recarrega o feed (ex.: logo após publicar um treino). */
  Social: { refreshAt?: number } | undefined;
  Stats: undefined;
  Profile: undefined;
};

/** Treino recém-salvo, levado do fim da sessão até o post. */
export type FinishedWorkout = {
  /** O mesmo id enviado em /sessions/log; o post usa para se ligar ao treino. */
  clientSessionId: string;
  title: string;
  volumeKg: number;
  durationSeconds: number;
  setsCount: number;
  exercisesCount: number;
};

/** Pilha do app logado (abas + telas empilhadas por cima). */
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  /** O treino vem do ActiveWorkoutContext (começado por openWorkout). */
  ActiveSession: undefined;
  /** Câmera em tela cheia para a foto do treino recém-concluído. */
  WorkoutCamera: { workout: FinishedWorkout };
  /** Prévia do post com a faixa de dados do treino. */
  NewWorkoutPost: { workout: FinishedWorkout; photoUri: string };
  /** Perfil público de outro usuário (estilo Instagram/Hevy). */
  UserProfile: { userId: string };
  /** Comparar progresso de treino com um amigo (só amizade aceita). */
  CompareProgress: { friendId: string };
  Settings: undefined;
  /** Objetivo, métricas, nível, frequência e anamnese (o que alimenta a IA). */
  Protocol: undefined;
  /** Anamnese registrada (pelo personal ou pelo aluno), para o aluno conferir. */
  Anamnesis: undefined;
  /** Perfil profissional do personal do aluno logado. */
  TrainerProfile: undefined;
  /**
   * Publicações de um perfil em lista (estilo Instagram), abrindo no post tocado.
   * Recebe o que a grade já carregou para não buscar de novo.
   */
  ProfilePosts: { userId: string; startId: string; items: FeedPostData[]; page: number; last: boolean };
};

/** Telas de entrada (usuário deslogado). */
export type AuthStackParamList = {
  Welcome: undefined;
  RecurringUser: undefined;
  Login: { email?: string } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyCode: { email: string };
  ResetPassword: { email: string; code: string };
  ConfirmEmail: { email: string };
};

export type AuthScreenProps<R extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, R>;

export type MainStackScreenProps<R extends keyof MainStackParamList> = NativeStackScreenProps<MainStackParamList, R>;

/** Props de uma aba: navega entre abas e também para as telas da pilha. */
export type MainTabScreenProps<R extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, R>,
  NativeStackScreenProps<MainStackParamList>
>;
