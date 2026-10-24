import { useSyncExternalStore } from 'react';
import type { AiRequestForm, PreviewPlan } from './aiDraft';
import type { AiPlanPreview, WorkoutPlan } from '../../../types';

export type AiFlowStep = 'compose' | 'generating' | 'preview' | 'edit';

/**
 * Rascunho do fluxo "fichas com IA" de um aluno. Fica fora da árvore do React para
 * sobreviver à navegação: o personal sai para outra tela e, ao voltar, o pedido, a
 * geração em andamento ou a prévia continuam onde estavam. Some ao recarregar a página
 * (o aviso de beforeunload cobre esse caso).
 */
export interface AiDraft {
  studentId: string;
  studentName: string;
  studentFirstName: string;
  step: AiFlowStep;
  form: AiRequestForm;
  /** O personal escolheu o nível: o do perfil do aluno não sobrescreve mais. */
  levelTouched: boolean;
  /** Erro da última geração, exibido no compositor. */
  error: string | null;
  preview: AiPlanPreview | null;
  /** Pedido que gerou a prévia atual (o compositor pode estar sendo ajustado). */
  generatedWith: AiRequestForm | null;
  plans: PreviewPlan[];
  reviewed: boolean[];
  active: number;
  agreed: boolean;
  editing: number | null;
  approving: boolean;
  approveError: string | null;
  /** Início da geração em andamento (a tela de espera continua do ponto certo). */
  generatingSince: number | null;
}

type Patch = Partial<AiDraft> | ((draft: AiDraft) => Partial<AiDraft>);

// Chave = `${personal}:${aluno}`: outro login na mesma aba não vê rascunhos alheios.
let drafts: Readonly<Record<string, AiDraft>> = {};
const listeners = new Set<() => void>();
const controllers = new Map<string, AbortController>();
const mounted = new Map<string, number>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => drafts;

export const draftKey = (ownerId: string, studentId: string) => `${ownerId}:${studentId}`;

export const getAiDraft = (key: string): AiDraft | undefined => drafts[key];

export function newAiDraft(studentId: string, studentName: string, currentPlans: WorkoutPlan[]): AiDraft {
  return {
    studentId,
    studentName,
    studentFirstName: studentName.trim().split(/\s+/)[0] ?? studentName,
    step: 'compose',
    form: {
      prompt: '',
      scope: 'full',
      count: 3,
      duration: '60',
      level: 'INTERMEDIÁRIO',
      // Fichas que só a IA do app montou costumam ser trocadas; as de um personal, mantidas.
      replace: currentPlans.length > 0 && currentPlans.every((p) => p.prescribedByName === null),
    },
    levelTouched: false,
    error: null,
    preview: null,
    generatedWith: null,
    plans: [],
    reviewed: [],
    active: 0,
    agreed: false,
    editing: null,
    approving: false,
    approveError: null,
    generatingSince: null,
  };
}

export function startAiDraft(key: string, draft: AiDraft) {
  if (drafts[key]) return;
  drafts = { ...drafts, [key]: draft };
  emit();
}

/** Atualiza um rascunho existente; rascunho já descartado é ignorado (ex.: resposta tardia da IA). */
export function updateAiDraft(key: string, patch: Patch) {
  const current = drafts[key];
  if (!current) return;
  const changes = typeof patch === 'function' ? patch(current) : patch;
  drafts = { ...drafts, [key]: { ...current, ...changes } };
  emit();
}

export function removeAiDraft(key: string) {
  abortAiRequest(key);
  if (!drafts[key]) return;
  const next = { ...drafts };
  delete next[key];
  drafts = next;
  emit();
}

/** Nova requisição à IA para o rascunho: cancela a anterior, se houver. */
export function beginAiRequest(key: string): AbortController {
  abortAiRequest(key);
  const controller = new AbortController();
  controllers.set(key, controller);
  return controller;
}

export function abortAiRequest(key: string) {
  controllers.get(key)?.abort();
  controllers.delete(key);
}

/** O fluxo do aluno está na tela? Sem ele, o fim da geração vira um aviso (toast). */
export const isAiDraftOnScreen = (key: string) => (mounted.get(key) ?? 0) > 0;

export function markAiDraftOnScreen(key: string): () => void {
  mounted.set(key, (mounted.get(key) ?? 0) + 1);
  return () => mounted.set(key, (mounted.get(key) ?? 1) - 1);
}

export function useAiDraft(key: string): AiDraft | undefined {
  return useSyncExternalStore(subscribe, snapshot)[key];
}

/** Rascunhos do personal logado, para a barra lateral. */
export function useAiDrafts(ownerId: string | undefined): AiDraft[] {
  const all = useSyncExternalStore(subscribe, snapshot);
  if (!ownerId) return [];
  const prefix = `${ownerId}:`;
  return Object.entries(all)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, draft]) => draft);
}
