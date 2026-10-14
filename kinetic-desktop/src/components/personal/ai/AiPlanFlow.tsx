import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { approveAiPlans, generateAiPlanPreview, getAiPlanContext } from '../../../services/trainerService';
import ConfirmDialog from '../ConfirmDialog';
import PlanEditor from '../PlanEditor';
import AiPlanComposer from './AiPlanComposer';
import AiPlanGenerating from './AiPlanGenerating';
import AiPlanPreview from './AiPlanPreview';
import { tagsFor, toPreviewPlans, type AiRequestForm, type PreviewPlan } from './aiDraft';
import type { AiPlanContext, AiPlanPreview as AiPlanPreviewData, WorkoutPlan } from '../../../types';

interface Props {
  studentId: string;
  studentFirstName: string;
  studentName: string;
  /** Fichas vigentes do aluno hoje. */
  currentPlans: WorkoutPlan[];
  onExit: () => void;
  onApproved: (plans: WorkoutPlan[], replaced: boolean) => void;
}

type Step = 'compose' | 'generating' | 'preview' | 'edit';

type HttpError = { response?: { status?: number; data?: unknown }; code?: string };

const bodyText = (err: unknown): string | null => {
  const data = (err as HttpError).response?.data;
  return typeof data === 'string' && data.trim() ? data : null;
};

/**
 * Fluxo de fichas com IA: o personal descreve o treino, a IA monta uma prévia e nada
 * chega ao app do aluno até ele revisar cada ficha e aprovar com a declaração.
 */
export default function AiPlanFlow({ studentId, studentFirstName, studentName, currentPlans, onExit, onApproved }: Props) {
  const [step, setStep] = useState<Step>('compose');
  const [form, setForm] = useState<AiRequestForm>(() => ({
    prompt: '',
    scope: 'full',
    count: 3,
    duration: '60',
    level: 'INTERMEDIÁRIO',
    // Fichas que só a IA do app montou costumam ser trocadas; as de um personal, mantidas.
    replace: currentPlans.length > 0 && currentPlans.every((p) => p.prescribedByName === null),
  }));
  const levelTouched = useRef(false);

  const [context, setContext] = useState<AiPlanContext | null>(null);
  const [contextError, setContextError] = useState(false);
  const [contextKey, setContextKey] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AiPlanPreviewData | null>(null);
  /** Pedido que gerou a prévia atual (o compositor pode estar sendo ajustado). */
  const [generatedWith, setGeneratedWith] = useState<AiRequestForm | null>(null);
  const [plans, setPlans] = useState<PreviewPlan[]>([]);
  const [reviewed, setReviewed] = useState<boolean[]>([]);
  const [active, setActive] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setContextError(false);
    getAiPlanContext(studentId)
      .then((data) => {
        if (cancelled) return;
        setContext(data);
        // O nível do perfil vira o padrão, a menos que o personal já tenha escolhido outro.
        if (!levelTouched.current) setForm((f) => ({ ...f, level: data.level }));
      })
      .catch(() => {
        if (!cancelled) setContextError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, contextKey]);

  // Cada etapa começa do topo do painel.
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: 'start' });
  }, [step]);

  // Sair da aba com a requisição em andamento não deixa resposta chegando num componente morto.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Prévia ainda não aprovada: avisa antes de fechar a janela.
  useEffect(() => {
    if (!preview) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [preview]);

  const replaceCurrent = currentPlans.length > 0 && form.replace;

  const updateForm = (changes: Partial<AiRequestForm>) => {
    if (changes.level !== undefined) levelTouched.current = true;
    setForm((f) => ({ ...f, ...changes }));
    // Substituir ou manter muda as letras das fichas novas; as que o personal editou ficam como ele deixou.
    if (changes.replace !== undefined && changes.replace !== form.replace && plans.length > 0) {
      const tags = tagsFor(plans.length, changes.replace, currentPlans);
      setPlans((list) => list.map((p, i) => (p.edited ? p : { ...p, input: { ...p.input, tag: tags[i] ?? null } })));
      setAgreed(false);
    }
  };

  const generate = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const request = { ...form };
    const planCount = request.scope === 'full' ? request.count : 1;

    setError(null);
    setStep('generating');
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
      setPreview(result);
      setGeneratedWith(request);
      setPlans(toPreviewPlans(result.plans, tags, request.level));
      setReviewed(result.plans.map(() => false));
      setActive(0);
      setAgreed(false);
      setApproveError(null);
      setStep('preview');
    } catch (err: unknown) {
      if (controller.signal.aborted || axios.isCancel(err)) return;
      const status = (err as HttpError).response?.status;
      if (status === 404) {
        setError(`O vínculo com ${studentFirstName} não está mais ativo.`);
      } else if ((err as HttpError).code === 'ECONNABORTED') {
        setError('A IA demorou demais para responder. Tente gerar de novo.');
      } else {
        setError(
          bodyText(err) ?? 'Não foi possível gerar a prévia. Verifique sua conexão e tente de novo.',
        );
      }
      setStep('compose');
    }
  };

  const cancelGeneration = () => {
    abortRef.current?.abort();
    setStep(preview ? 'preview' : 'compose');
  };

  const toggleReviewed = (index: number) => {
    const next = reviewed.map((r, i) => (i === index ? !r : r));
    setReviewed(next);
    // A declaração cobre todas as fichas revisadas: desmarcar uma desfaz o aceite.
    if (!next.every(Boolean)) setAgreed(false);
  };

  const applyEdit = (index: number, input: PreviewPlan['input']) => {
    setPlans((list) => list.map((p, i) => (i === index ? { ...p, input, edited: true } : p)));
    // O aceite valia para a versão anterior da ficha.
    setAgreed(false);
    setApproveError(null);
    setEditing(null);
    setStep('preview');
  };

  const approve = async () => {
    if (!preview || approving) return;
    setApproving(true);
    setApproveError(null);
    try {
      const saved = await approveAiPlans(studentId, preview.generationId, {
        replaceCurrent,
        declarationAccepted: true,
        plans: plans.map((p) => p.input),
      });
      onApproved(saved, replaceCurrent);
    } catch (err: unknown) {
      const status = (err as HttpError).response?.status;
      if (status === 404) {
        setApproveError(
          `Não foi possível aprovar: o vínculo com ${studentFirstName} não está mais ativo ou a prévia não existe.`,
        );
      } else {
        setApproveError(bodyText(err) ?? 'Não foi possível aprovar. Verifique sua conexão e tente de novo.');
      }
      setApproving(false);
    }
  };

  const requestExit = () => (preview ? setConfirmDiscard(true) : onExit());

  return (
    <div ref={rootRef}>
      {step === 'compose' && (
        <AiPlanComposer
          studentFirstName={studentFirstName}
          form={form}
          onChange={updateForm}
          currentPlans={currentPlans}
          context={context}
          contextError={contextError}
          onRetryContext={() => setContextKey((k) => k + 1)}
          error={error}
          hasPreview={!!preview}
          onBackToPreview={() => setStep('preview')}
          onGenerate={() => void generate()}
          onExit={requestExit}
        />
      )}

      {step === 'generating' && (
        <AiPlanGenerating
          studentFirstName={studentFirstName}
          planCount={form.scope === 'full' ? form.count : 1}
          onCancel={cancelGeneration}
        />
      )}

      {step === 'preview' && preview && generatedWith && plans.length > 0 && (
        <AiPlanPreview
          studentFirstName={studentFirstName}
          studentName={studentName}
          plans={plans}
          understood={preview.understood}
          attentionPoints={preview.attentionPoints}
          form={{ ...generatedWith, replace: form.replace }}
          currentPlanCount={currentPlans.length}
          active={Math.min(active, plans.length - 1)}
          onSelect={setActive}
          reviewed={reviewed}
          onToggleReviewed={toggleReviewed}
          agreed={agreed}
          onToggleAgreed={() => setAgreed((a) => !a)}
          approving={approving}
          approveError={approveError}
          onApprove={() => void approve()}
          onRegenerate={() => void generate()}
          onAdjust={() => setStep('compose')}
          onEdit={(index) => {
            setEditing(index);
            setStep('edit');
          }}
          onDiscard={() => setConfirmDiscard(true)}
        />
      )}

      {step === 'edit' && editing !== null && plans[editing] && (
        <PlanEditor
          key={`draft-${editing}`}
          studentId={studentId}
          studentFirstName={studentFirstName}
          mode={{ kind: 'draft', input: plans[editing].input }}
          onCancel={() => {
            setEditing(null);
            setStep('preview');
          }}
          onDraftSaved={(input) => applyEdit(editing, input)}
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
