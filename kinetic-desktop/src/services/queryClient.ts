import { QueryClient } from '@tanstack/react-query';
import type { StatsPeriodId } from '../types';

/**
 * Cache das telas do personal. Trocar de tela mostra na hora o que já foi
 * buscado; a atualização vem dos eventos em tempo real (useTrainerLiveUpdates)
 * e das próprias ações do painel, que invalidam as chaves abaixo.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Rede de segurança caso um evento se perca: depois de 1 min a tela rebusca ao montar/focar.
      staleTime: 60_000,
      retry: 1,
    },
  },
});

/** Tudo do personal fica sob ['trainer']: uma invalidação recarrega só o que está na tela. */
export const qk = {
  /** Celular da própria conta: fora de ['trainer'], muda só pelo PhoneDialog. */
  myPhone: ['me', 'phone'] as const,
  trainer: ['trainer'] as const,
  students: ['trainer', 'students'] as const,
  monthlyStats: ['trainer', 'monthly-stats'] as const,
  engagement: ['trainer', 'engagement'] as const,
  today: ['trainer', 'today'] as const,
  inviteCodes: ['trainer', 'invite-codes'] as const,
  billing: ['trainer', 'billing'] as const,
  profile: ['trainer', 'profile'] as const,
  finance: (month: string) => ['trainer', 'finance', month] as const,
  student: (id: string) => ['trainer', 'student', id] as const,
  studentStats: (id: string, period: StatsPeriodId) => ['trainer', 'student', id, 'stats', period] as const,
  protocol: (id: string) => ['trainer', 'student', id, 'protocol'] as const,
  planEvolution: (id: string) => ['trainer', 'student', id, 'plan-evolution'] as const,
  plans: (id: string) => ['trainer', 'student', id, 'plans'] as const,
  assessments: (id: string) => ['trainer', 'student', id, 'assessments'] as const,
};

/** Depois de uma ação do personal: recarrega a tela aberta e marca o resto como velho. */
export const refreshTrainerData = () => queryClient.invalidateQueries({ queryKey: qk.trainer });
