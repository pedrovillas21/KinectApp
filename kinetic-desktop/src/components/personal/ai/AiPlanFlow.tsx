import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { approveAiPlans, generateAiPlanPreview, getAiPlanContext } from '../../../services/trainerService';
import { refreshTrainerData } from '../../../services/queryClient';
import ConfirmDialog from '../ConfirmDialog';
import PlanEditor from '../PlanEditor';
import AiPlanComposer from './AiPlanComposer';
import AiPlanGenerating from './AiPlanGenerating';
import AiPlanPreview from './AiPlanPreview';
import { tagsFor, toPreviewPlans, type AiRequestForm, type PreviewPlan } from './aiDraft';
import {
  abortAiRequest,
  beginAiRequest,
  getAiDraft,
  isAiDraftOnScreen,
  markAiDraftOnScreen,
  removeAiDraft,
  updateAiDraft,
  useAiDraft,
} from './aiDraftStore';
import type { AiPlanContext, WorkoutPlan } from '../../../types';

interface Props {
  /** Chave do rascunho (aiDraftStore.draftKey); quem abre o fluxo cria o rascunho. */
  draftKey: string;
  studentId: string;
  studentFirstName: string;
  studentName: string;
  /** Fichas vigentes do aluno hoje. */
  currentPlans: WorkoutPlan[];
  onExit: () => void;
  onApproved: (plans: WorkoutPlan[], replaced: boolean) => void;
}

type HttpError = { response?: { status?: number; data?: unknown }; code?: string };

const bodyText = (err: unknown): string | null => {
  const data = (err as HttpError).response?.data;
  return typeof data === 'string' && data.trim() ? data : null;
};

const approvedMessage = (count: number, firstName: string, replaced: boolean) => {
  const many = count !== 1;
  return `${count} ${many ? 'fichas aprovadas' : 'ficha aprovada'}. ${many ? 'Já aparecem' : 'Já aparece'} no app de ${firstName}, ${
    many ? 'prescritas' : 'prescrita'
  } por você.${replaced ? ' As fichas anteriores saíram do app.' : ''}`;
};

/**
 * Fluxo de fichas com IA: o personal descreve o treino, a IA monta uma prévia e nada
 * chega ao app do aluno até ele revisar cada ficha e aprovar com a declaração. O estado
 * vive no aiDraftStore: sair para outra tela não perde o pedido, a geração nem a prévia.
 */
export default function AiPlanFlow({
  draftKey: key,
  studentId,
  studentFirstName,
  studentName,
  currentPlans,
  onExit,
  onApproved,
}: Props) {
  const draft = useAiDraft(key);
  const navigate = useNavigate();
  const set = (patch: Parameters<typeof updateAiDraft>[1]) => updateAiDraft(key, patch);

  const [context, setContext] = useState<AiPlanContext | null>(null);
  const [contextError, setContextError] = useState(false);
  const [contextKey, setContextKey] = useState(0);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onApprovedRef = useRef<Props['onApproved'] | null>(onApproved);
  onApprovedRef.current = onApproved;

  // Na tela: o fim da geração aparece aqui. Fora dela, vira um aviso com atalho.
  useEffect(() => {
    const unmark = markAiDraftOnScreen(key);
    return () => {
      unmark();
      onApprovedRef.current = null;
    };
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    setContextError(false);
    getAiPlanContext(studentId)
      .then((data) => {
        if (cancelled) return;
        setContext(data);
        // O nível do perfil vira o padrão, a menos que o personal já tenha escolhido outro.
        if (!getAiDraft(key)?.levelTouched) set((d) => ({ form: { ...d.form, level: data.level } }));
      })
      .catch(() => {
        if (!cancelled) setContextError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, contextKey, key]);

  const step = draft?.step;
  // Cada etapa começa do topo do painel.
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: 'start' });
  }, [step]);

  if (!draft) return null;
  const { form, preview, plans } = draft;
  const replaceCurrent = currentPlans.length > 0 && form.replace;
  const reviewPath = `/students/${studentId}?aba=treinos`;

  const updateForm = (changes: Partial<AiRequestForm>) =>
    set((d) => {
      const next: Partial<typeof d> = { form: { ...d.form, ...changes } };
      if (changes.level !== undefined) next.levelTouched = true;
      // Substituir ou manter muda as letras das fichas novas; as que o personal editou ficam como ele deixou.
      if (changes.replace !== undefined && changes.replace !== d.form.replace && d.plans.length > 0) {
        const tags = tagsFor(d.plans.length, changes.replace, currentPlans);
        next.plans = d.plans.map((p, i) => (p.edited ? p : { ...p, input: { ...p.input, tag: tags[i] ?? null } }));
        next.agreed = false;
      }
      return next;
    });

  // O fluxo pode estar minimizado (o personal voltou para a lista durante a geração).
  const reopen = () => {
    set({ minimized: false });
    navigate(reviewPath);
  };

  // Tudo abaixo escreve no rascunho, não no componente: continua valendo se o personal sair da tela.
  const generate = async () => {
    const current = getAiDraft(key);
    if (!current) return;
    const controller = beginAiRequest(key);
    const request = { ...current.form };
    const planCount = request.scope === 'full' ? request.count : 1;

    set({ error: null, step: 'generating', generatingSince: Date.now() });
    try {
      const result = await generateAiPlanPreview(
        studentId,
        {
          prompt: request.prompt.trim(),
          planCount,
          durationMinutes: request.duration.trim() ? Number(request.duration) : null,
          level: request.level || null,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      const tags = tagsFor(result.plans.length, request.replace, currentPlans);
      set({
        preview: result,
        generatedWith: request,
        plans: toPreviewPlans(result.plans, tags, request.level),
        reviewed: result.plans.map(() => false),
        active: 0,
        agreed: false,
        approveError: null,
        step: 'preview',
        generatingSince: null,
      });
      if (!isAiDraftOnScreen(key)) {
        toast.success(`Prévia de ${studentFirstName} pronta`, {
          description: `${result.plans.length} ${result.plans.length === 1 ? 'ficha aguardando' : 'fichas aguardando'} sua revisão.`,
          action: { label: 'Revisar', onClick: () => reopen() },
        });
      }
    } catch (err: unknown) {
      if (controller.signal.aborted || axios.isCancel(err)) return;
      const status = (err as HttpError).response?.status;
      const message =
        status === 404
          ? `O vínculo com ${studentFirstName} não está mais ativo.`
          : (err as HttpError).code === 'ECONNABORTED'
            ? 'A IA demorou demais para responder. Tente gerar de novo.'
            : (bodyText(err) ?? 'Não foi possível gerar a prévia. Verifique sua conexão e tente de novo.');
      set({ error: message, step: 'compose', generatingSince: null });
      if (!isAiDraftOnScreen(key)) {
        toast.error(`A prévia de ${studentFirstName} não foi gerada`, {
          description: message,
          action: { label: 'Ver pedido', onClick: () => reopen() },
        });
      }
    }
  };

  const cancelGeneration = () => {
    abortAiRequest(key);
    set((d) => ({ step: d.preview ? 'preview' : 'compose', generatingSince: null }));
  };

  const toggleReviewed = (index: number) =>
    set((d) => {
      const next = d.reviewed.map((r, i) => (i === index ? !r : r));
      // A declaração cobre todas as fichas revisadas: desmarcar uma desfaz o aceite.
      return { reviewed: next, agreed: next.every(Boolean) ? d.agreed : false };
    });

  const applyEdit = (index: number, input: PreviewPlan['input']) =>
    set((d) => ({
      plans: d.plans.map((p, i) => (i === index ? { ...p, input, edited: true } : p)),
      // O aceite valia para a versão anterior da ficha.
      agreed: false,
      approveError: null,
      editing: null,
      step: 'preview',
    }));

  const approve = async () => {
    const current = getAiDraft(key);
    if (!current?.preview || current.approving) return;
    set({ approving: true, approveError: null });
    try {
      const saved = await approveAiPlans(studentId, current.preview.generationId, {
        replaceCurrent,
        declarationAccepted: true,
        plans: current.plans.map((p) => p.input),
      });
      const done = onApprovedRef.current;
      if (done) {
        done(saved, replaceCurrent);
      } else {
        removeAiDraft(key);
        toast.success(approvedMessage(saved.length, studentFirstName, replaceCurrent));
        void refreshTrainerData();
      }
    } catch (err: unknown) {
      const status = (err as HttpError).response?.status;
      set({
        approving: false,
        approveError:
          status === 404
            ? `Não foi possível aprovar: o vínculo com ${studentFirstName} não está mais ativo ou a prévia não existe.`
            : (bodyText(err) ?? 'Não foi possível aprovar. Verifique sua conexão e tente de novo.'),
      });
    }
  };

  const requestExit = () => (preview ? setConfirmDiscard(true) : onExit());

  return (
    <div ref={rootRef}>
      {draft.step === 'compose' && (
        <AiPlanComposer
          studentId={studentId}
          studentFirstName={studentFirstName}
          form={form}
          onChange={updateForm}
          currentPlans={currentPlans}
          context={context}
          contextError={contextError}
          onRetryContext={() => setContextKey((k) => k + 1)}
          onProtocolSaved={() => setContextKey((k) => k + 1)}
          error={draft.error}
          hasPreview={!!preview}
          onBackToPreview={() => set({ step: 'preview' })}
          onGenerate={() => void generate()}
          onExit={requestExit}
        />
      )}

      {draft.step === 'generating' && (
        <AiPlanGenerating
          studentFirstName={studentFirstName}
          planCount={form.scope === 'full' ? form.count : 1}
          startedAt={draft.generatingSince ?? Date.now()}
          onCancel={cancelGeneration}
          onBack={() => set({ minimized: true })}
        />
      )}

      {draft.step === 'preview' && preview && draft.generatedWith && plans.length > 0 && (
        <AiPlanPreview
          studentId={studentId}
          studentFirstName={studentFirstName}
          studentName={studentName}
          plans={plans}
          understood={preview.understood}
          attentionPoints={preview.attentionPoints}
          form={{ ...draft.generatedWith, replace: form.replace }}
          currentPlanCount={currentPlans.length}
          active={Math.min(draft.active, plans.length - 1)}
          onSelect={(active) => set({ active })}
          reviewed={draft.reviewed}
          onToggleReviewed={toggleReviewed}
          agreed={draft.agreed}
          onToggleAgreed={() => set((d) => ({ agreed: !d.agreed }))}
          approving={draft.approving}
          approveError={draft.approveError}
          onApprove={() => void approve()}
          onRegenerate={() => void generate()}
          onAdjust={() => set({ step: 'compose' })}
          onEdit={(index) => set({ editing: index, step: 'edit' })}
          onDiscard={() => setConfirmDiscard(true)}
        />
      )}

      {draft.step === 'edit' && draft.editing !== null && plans[draft.editing] && (
        <PlanEditor
          key={`draft-${draft.editing}`}
          studentId={studentId}
          studentFirstName={studentFirstName}
          mode={{ kind: 'draft', input: plans[draft.editing].input }}
          onCancel={() => set({ editing: null, step: 'preview' })}
          onDraftSaved={(input) => applyEdit(draft.editing!, input)}
        />
      )}

      <ConfirmDialog
        open={confirmDiscard}
        title="Descartar a prévia?"
        description={`As fichas geradas pela IA não serão enviadas para ${studentFirstName}. Para usar a IA de novo, será preciso gerar outra prévia.`}
        confirmLabel="Descartar prévia"
        destructive
        onConfirm={() => {
          setConfirmDiscard(false);
          onExit();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
}
