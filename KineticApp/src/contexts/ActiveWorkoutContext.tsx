import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../services/api';
import { RESOURCE_CACHE_PREFIX } from '../services/resourceCache';
import { startWorkoutPresence, endWorkoutPresence } from '../services/socialService';
import { scheduleRestEnd, cancelRestEnd } from '../services/restNotification';
import { showAlert } from '../components/ui/AlertHost';
import { uuidv4 } from '../utils/uuid';
import type { LogSessionRequestDTO, SetLogDto, WorkoutPlanItem } from '../types';

// Teto do backend (LogSessionRequestDTO @Max): cronômetro esquecido aberto não perde o treino.
const MAX_SESSION_SECONDS = 6 * 60 * 60;
// Treino parado há mais que isso ao abrir o app: pergunta se salva ou descarta.
const STALE_MS = 3 * 60 * 60 * 1000;
// Mesmo prefixo do cache das telas: o logout (clearResourceCache) apaga o treino junto.
const STORAGE_KEY = `${RESOURCE_CACHE_PREFIX}active-workout`;

export interface SetData {
  weight: string;
  reps: string;
  completed: boolean;
}

/** Treino em andamento. Vive fora da tela para sobreviver à saída dela (balão) e ao app fechado. */
export interface ActiveWorkout {
  workoutData: WorkoutPlanItem;
  /** Um id por treino, igual em toda tentativa de envio: o backend não grava o mesmo treino duas vezes. */
  clientSessionId: string;
  startedAt: number;
  /** Hora da última série confirmada: fim da duração registrada. */
  lastSetAt: number;
  currentIndex: number;
  /** Séries do exercício atual. */
  setsData: SetData[];
  /** Séries confirmadas dos exercícios anteriores. */
  globalSetsLog: SetLogDto[];
  /** Descanso após confirmar uma série: a próxima só libera quando zerar. */
  rest: { endsAt: number; totalSeconds: number } | null;
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

// Séries confirmadas da tela no formato do backend: vírgula vale como decimal e campo vazio vale 0.
export function confirmedLogs(sets: SetData[], exerciseId: string): SetLogDto[] {
  return sets
    .filter((s) => s.completed)
    .map((s, idx) => ({
      exerciseId,
      setNumber: idx + 1,
      repsPerformed: parseInt(s.reps, 10) || 0,
      weightUsed: parseFloat(s.weight.replace(',', '.')) || 0,
    }));
}

/** Séries vazias de um exercício (ficha sem número de séries: 3). */
export function emptySets(exercise?: { sets?: number | string }): SetData[] {
  const count = parseInt(String(exercise?.sets), 10) || 3;
  return Array.from({ length: count }, () => ({ weight: '', reps: '', completed: false }));
}

/** Todas as séries confirmadas do treino: exercícios anteriores + o atual. */
export function allLogs(w: ActiveWorkout): SetLogDto[] {
  return [...w.globalSetsLog, ...confirmedLogs(w.setsData, w.workoutData.data[w.currentIndex]?.id as string)];
}

/** Do início até a última série: treino esquecido aberto não infla os minutos. */
export function durationOf(w: ActiveWorkout): number {
  return Math.min(Math.round((w.lastSetAt - w.startedAt) / 1000), MAX_SESSION_SECONDS);
}

interface ActiveWorkoutValue {
  workout: ActiveWorkout | null;
  update: (fn: (w: ActiveWorkout) => ActiveWorkout) => void;
  /** Começa a ficha (ou retoma, se for a mesma) e abre a tela do treino. */
  openWorkout: (plan: WorkoutPlanItem, goToScreen: () => void) => void;
  saving: boolean;
  /** POST /sessions/log com as séries confirmadas; limpa o treino se der certo. */
  saveSession: () => Promise<boolean>;
  /** Parar treino: salvar, sair sem salvar ou continuar. */
  stop: (onLeave?: () => void) => void;
  discard: () => void;
  /** Tela do treino aberta: o balão some. */
  screenOpen: boolean;
  setScreenOpen: (open: boolean) => void;
  /** Descanso zerou com a tela do treino fechada: o balão avisa. */
  restDone: boolean;
  clearRestDone: () => void;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutValue | null>(null);

export function useActiveWorkout(): ActiveWorkoutValue {
  const value = useContext(ActiveWorkoutContext);
  if (!value) throw new Error('useActiveWorkout fora do ActiveWorkoutProvider');
  return value;
}

/** Montado no ramo logado das rotas: desmonta no logout e leva o treino da memória junto. */
export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [screenOpen, setScreenOpenState] = useState(false);
  const [restDone, setRestDone] = useState(false);

  // Refs para as ações lerem o valor atual sem se recriarem a cada série digitada.
  const workoutRef = useRef(workout);
  workoutRef.current = workout;
  const screenOpenRef = useRef(false);
  // Trava na hora (dois toques no mesmo frame veriam o state ainda false); o state só desenha.
  const savingRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const saved: ActiveWorkout | null = raw ? JSON.parse(raw) : null;
        if (saved) setWorkout((current) => current ?? saved);
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const write = workout
      ? AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(workout))
      : AsyncStorage.removeItem(STORAGE_KEY);
    write.catch(() => {});
  }, [workout, hydrated]);

  const update = useCallback((fn: (w: ActiveWorkout) => ActiveWorkout) => {
    setWorkout((w) => (w ? fn(w) : w));
  }, []);

  const discard = useCallback(() => {
    setWorkout(null);
    endWorkoutPresence().catch(() => {/* non-critical */});
  }, []);

  const saveSession = useCallback(async (): Promise<boolean> => {
    const w = workoutRef.current;
    if (!w || savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    const payload: LogSessionRequestDTO = {
      durationInSeconds: durationOf(w),
      date: localDateString(),
      exercisesLog: allLogs(w),
      clientSessionId: w.clientSessionId,
    };
    try {
      await api.post('/sessions/log', payload);
      // O backend encerra a presença "treinando" ao gravar a sessão.
      setWorkout(null);
      return true;
    } catch (error) {
      console.error('Erro ao salvar sessão', error);
      showAlert('Erro', 'Não foi possível salvar os dados do treino.');
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, []);

  const stop = useCallback(
    (onLeave?: () => void) => {
      const w = workoutRef.current;
      if (!w || savingRef.current) return;

      const discardAndLeave = () => {
        discard();
        onLeave?.();
      };

      // Nada confirmado: não há o que guardar nem o que perguntar.
      const total = allLogs(w).length;
      if (total === 0) {
        discardAndLeave();
        return;
      }

      showAlert(
        'Treino incompleto',
        `Você confirmou ${total} ${total === 1 ? 'série' : 'séries'}. Quer que elas contem no seu histórico e nas estatísticas?`,
        [
          {
            text: 'Salvar e sair',
            onPress: async () => {
              if (!(await saveSession())) return;
              showAlert('Treino salvo', 'As séries concluídas entraram no seu histórico.');
              onLeave?.();
            },
          },
          { text: 'Sair sem salvar', style: 'destructive', onPress: discardAndLeave },
          { text: 'Continuar treino', style: 'cancel' },
        ],
      );
    },
    [discard, saveSession],
  );

  const openWorkout = useCallback((plan: WorkoutPlanItem, goToScreen: () => void) => {
    const current = workoutRef.current;
    if (current && current.workoutData.id !== plan.id) {
      showAlert('Treino em andamento', `Finalize ou pare "${current.workoutData.title}" antes de começar outro.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Voltar ao treino', onPress: goToScreen },
      ]);
      return;
    }
    // Ficha sem exercícios: a tela mostra o estado vazio, sem treino nem presença.
    if (!current && plan.data?.length) {
      const now = Date.now();
      setWorkout({
        workoutData: plan,
        clientSessionId: uuidv4(),
        startedAt: now,
        lastSetAt: now,
        currentIndex: 0,
        setsData: emptySets(plan.data[0]),
        globalSetsLog: [],
        rest: null,
      });
      startWorkoutPresence().catch(() => {/* non-critical */});
    }
    goToScreen();
  }, []);

  const setScreenOpen = useCallback((open: boolean) => {
    screenOpenRef.current = open;
    setScreenOpenState(open);
    if (open) setRestDone(false);
  }, []);

  const clearRestDone = useCallback(() => setRestDone(false), []);

  // App reaberto com treino salvo: sem série confirmada (fechado com a tela aberta) descarta
  // calado; esquecido há horas, pergunta uma vez se salva ou descarta.
  useEffect(() => {
    const w = workoutRef.current;
    if (hydrated && w && (allLogs(w).length === 0 || Date.now() - w.lastSetAt > STALE_MS)) stop();
  }, [hydrated, stop]);

  // Fim do descanso num lugar só, com a tela aberta ou não: pular, +15s, editar série e
  // logout trocam/zeram o endsAt e a limpeza cancela o timer e a notificação pendente.
  const restEndsAt = workout?.rest?.endsAt;
  useEffect(() => {
    if (!restEndsAt) return;
    let cancelled = false;
    let notificationId: string | null = null;
    scheduleRestEnd(restEndsAt).then((id) => {
      if (id && cancelled) cancelRestEnd(id);
      else notificationId = id;
    });
    const timer = setTimeout(() => {
      Vibration.vibrate(400);
      setWorkout((w) => (w && w.rest?.endsAt === restEndsAt ? { ...w, rest: null } : w));
      if (!screenOpenRef.current) setRestDone(true);
    }, restEndsAt - Date.now());
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (notificationId) cancelRestEnd(notificationId);
    };
  }, [restEndsAt]);

  const value = useMemo(
    () => ({ workout, update, openWorkout, saving, saveSession, stop, discard, screenOpen, setScreenOpen, restDone, clearRestDone }),
    [workout, update, openWorkout, saving, saveSession, stop, discard, screenOpen, setScreenOpen, restDone, clearRestDone],
  );

  return <ActiveWorkoutContext.Provider value={value}>{children}</ActiveWorkoutContext.Provider>;
}
