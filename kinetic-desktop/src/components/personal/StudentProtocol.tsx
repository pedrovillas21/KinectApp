import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lock, Pencil } from 'lucide-react';
import { getStudentProtocol, updateStudentProtocol } from '../../services/trainerService';
import { qk } from '../../services/queryClient';
import FormDialog from './FormDialog';
import { LEVELS } from './workoutVocab';
import type { StudentProtocol } from '../../types';
import { errorMessage } from '../../utils/errors';
import { firstNameOf } from '../../utils/names';

/** Mesmos valores canônicos do app (KineticApp/src/constants/protocol.ts) e do backend. */
export const GOALS: { value: string; label: string; detail: string }[] = [
  { value: 'Ganho de Massa', label: 'Ganho de massa', detail: 'Hipertrofia e sobrecarga progressiva' },
  { value: 'Perda de Gordura', label: 'Perda de gordura', detail: 'Déficit calórico e condicionamento metabólico' },
  { value: 'Performance', label: 'Performance', detail: 'Força máxima, explosão e resistência' },
];

export const goalLabel = (value: string | null | undefined): string =>
  GOALS.find((g) => g.value === value)?.label ?? value ?? 'Não informado';

const levelLabel = (value: string | null | undefined): string =>
  LEVELS.find((l) => l.value === value)?.label ?? value ?? 'Não informado';

const FREQUENCIES = [1, 2, 3, 4, 5, 6, 7];
const ANAMNESIS_MAX = 2000;

const shortDate = (iso: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '');
};

const firstNameOrNull = (name: string | null) => (name ? firstNameOf(name) : null);

/** "Por você · 15 out 2026" / "Pelo aluno · 12 jul 2026". */
function authorLine(byStudent: boolean, byName: string | null, at: string | null, studentFirstName: string): string | null {
  const date = shortDate(at);
  if (!at && !byName) return null;
  const who = byStudent ? `Por ${studentFirstName}` : byName ? `Por ${firstNameOrNull(byName)}` : null;
  return [who, date].filter(Boolean).join(' · ') || null;
}

export function useStudentProtocol(studentId: string, enabled = true) {
  return useQuery({ queryKey: qk.protocol(studentId), queryFn: () => getStudentProtocol(studentId), enabled });
}

/** Faixa "Protocolo" + "Anamnese" da página do aluno, com o diálogo de edição. */
export function ProtocolSummary({ studentId, studentFirstName }: { studentId: string; studentFirstName: string }) {
  const q = useStudentProtocol(studentId);
  const [open, setOpen] = useState(false);

  if (q.isPending) return <div className="k-skeleton h-[148px] rounded-xl bg-k-surface1" />;
  if (!q.data) return null;
  const p = q.data;
  const protocolBy = authorLine(p.protocolUpdatedByStudent, p.protocolUpdatedByName, p.protocolUpdatedAt, studentFirstName);
  const anamnesis = p.medicalConditions?.trim() || null;
  const confirmedOn = shortDate(p.anamnesisConfirmedAt);

  return (
    <section aria-label="Protocolo e anamnese" className="overflow-hidden rounded-xl border border-white/[0.08]">
      <div className="grid grid-cols-2 gap-px bg-white/[0.08] sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
        <Field label="Objetivo" value={goalLabel(p.goal)} hint={protocolBy} className="max-sm:col-span-2" />
        <Field label="Nível" value={levelLabel(p.level)} />
        <Field label="Frequência" value={p.frequency ? `${p.frequency}x por semana` : 'Não informada'} />
        <div className="flex items-center bg-k-bg p-3 max-sm:col-span-2 sm:p-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] px-3.5 text-[13px] text-k-text transition-colors hover:bg-white/[0.06] max-sm:w-full"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar protocolo
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-white/[0.08] bg-k-bg px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-k-text-muted">Anamnese</span>
          {anamnesis ? (
            <span className="rounded-md bg-k-success/[0.12] px-1.5 py-0.5 text-[11px] font-semibold text-k-success">
              Completa
            </span>
          ) : (
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-semibold text-k-text-muted">
              Pendente
            </span>
          )}
          {anamnesis && (
            <span className="text-xs text-k-text-muted">
              {confirmedOn
                ? `Conferida por ${studentFirstName} no app · ${confirmedOn}`
                : `${studentFirstName} ainda não conferiu no app`}
            </span>
          )}
        </div>
        <p className="text-[14px] leading-relaxed text-k-text-soft">
          {anamnesis ?? `Sem lesões ou restrições registradas. Registre o que ${studentFirstName} contou na consulta.`}
        </p>
      </div>

      <ProtocolDialog
        open={open}
        studentId={studentId}
        studentFirstName={studentFirstName}
        protocol={p}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}

function Field({
  label,
  value,
  hint,
  className = '',
}: {
  label: string;
  value: string;
  hint?: string | null;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 bg-k-bg px-4 py-3.5 sm:px-5 sm:py-4 ${className}`}>
      <span className="text-xs text-k-text-muted">{label}</span>
      <span className="truncate text-[15px] font-semibold">{value}</span>
      {hint && <span className="truncate text-[11.5px] text-k-text-muted">{hint}</span>}
    </div>
  );
}

/**
 * Edição do protocolo e da anamnese pelo personal. `onSaved` avisa quem abriu
 * (ex.: o compositor da IA recarrega o contexto do aluno).
 */
export function ProtocolDialog({
  open,
  studentId,
  studentFirstName,
  protocol,
  onClose,
  onSaved,
}: {
  open: boolean;
  studentId: string;
  studentFirstName: string;
  protocol: StudentProtocol | undefined;
  onClose: () => void;
  onSaved?: (protocol: StudentProtocol) => void;
}) {
  const queryClient = useQueryClient();
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [frequency, setFrequency] = useState<number | null>(null);
  const [anamnesis, setAnamnesis] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !protocol) return;
    setGoal(protocol.goal ?? '');
    setLevel(protocol.level ?? '');
    setFrequency(protocol.frequency);
    setAnamnesis(protocol.medicalConditions ?? '');
    setError(null);
  }, [open, protocol]);

  const anamnesisChanged = (protocol?.medicalConditions ?? '').trim() !== anamnesis.trim();
  const lastChange = protocol
    ? authorLine(protocol.protocolUpdatedByStudent, protocol.protocolUpdatedByName, protocol.protocolUpdatedAt, studentFirstName)
    : null;

  const save = async () => {
    if (!goal || !level || !frequency) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await updateStudentProtocol(studentId, {
        goal,
        level,
        frequency,
        medicalConditions: anamnesis.trim() || null,
      });
      queryClient.setQueryData(qk.protocol(studentId), saved);
      // Meta do cabeçalho, contexto da IA e lista de alunos mostram o objetivo.
      void queryClient.invalidateQueries({ queryKey: qk.student(studentId) });
      void queryClient.invalidateQueries({ queryKey: qk.students });
      toast.success('Protocolo salvo', {
        description: anamnesisChanged
          ? `${studentFirstName} vai ver a anamnese nova no app para conferir.`
          : `${studentFirstName} já vê o protocolo atualizado no app.`,
      });
      onSaved?.(saved);
      onClose();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Não foi possível salvar. Tente novamente.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title={`Protocolo e anamnese de ${studentFirstName}`}
      description="Base para as fichas que você e a IA prescrevem."
      submitLabel="Salvar protocolo"
      busy={busy}
      submitDisabled={!goal || !level || !frequency || anamnesis.length > ANAMNESIS_MAX}
      onSubmit={() => void save()}
      onCancel={onClose}
    >
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-k-text-muted">Objetivo</legend>
        {GOALS.map((g) => (
          <label
            key={g.value}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
              goal === g.value ? 'border-k-primary/45 bg-k-primary/[0.05]' : 'border-white/10 hover:border-white/15'
            }`}
          >
            <input
              type="radio"
              name="protocol-goal"
              checked={goal === g.value}
              onChange={() => setGoal(g.value)}
              className="h-4 w-4 shrink-0 accent-k-primary"
            />
            <span className="flex flex-col">
              <span className="text-[13.5px] font-semibold">{g.label}</span>
              <span className="text-xs text-k-text-muted">{g.detail}</span>
            </span>
            {protocol?.goal === g.value && <span className="ml-auto text-[11.5px] text-k-text-muted">atual</span>}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-4">
        <Segmented
          label="Nível"
          options={LEVELS.map((l) => ({ value: l.value, label: l.label }))}
          value={level}
          onChange={setLevel}
        />
        <Segmented
          label="Dias por semana"
          options={FREQUENCIES.map((f) => ({ value: String(f), label: String(f) }))}
          value={frequency ? String(frequency) : ''}
          onChange={(v) => setFrequency(Number(v))}
          mono
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="protocol-anamnesis"
          className="text-[11px] font-semibold uppercase tracking-[0.07em] text-k-text-muted"
        >
          Anamnese · lesões e restrições
        </label>
        <textarea
          id="protocol-anamnesis"
          rows={3}
          value={anamnesis}
          maxLength={ANAMNESIS_MAX}
          onChange={(e) => setAnamnesis(e.target.value)}
          placeholder="Ex.: dor no joelho direito ao agachar, hérnia L4-L5, asma…"
          className="w-full resize-y rounded-xl border border-white/10 bg-k-bg px-3.5 py-2.5 text-[13.5px] leading-relaxed outline-none transition-[border-color,box-shadow] placeholder:text-k-text-muted focus:border-k-primary focus:shadow-[0_0_0_3px_rgba(0,229,255,0.12)]"
        />
        <span className="text-[11.5px] text-k-text-muted">
          {anamnesisChanged
            ? `Ao salvar, ${studentFirstName} é avisado no app para conferir a anamnese nova.`
            : 'Registre o que o aluno contou na consulta.'}
        </span>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-k-bg px-3.5 py-3 text-[12.5px] leading-relaxed text-k-text-soft">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-k-primary" />
        <span>
          Enquanto estiver vinculado a você, {studentFirstName} vê o protocolo no app mas não consegue alterá-lo. As
          fichas atuais não mudam: a próxima prescrição já parte daqui.
          {lastChange && <span className="mt-1 block text-k-text-muted">Última alteração: {lastChange}</span>}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-k-alert">
          {error}
        </p>
      )}
    </FormDialog>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
  mono = false,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-k-text-muted">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-[10px] border border-white/10 bg-k-bg p-[3px]">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`h-8 min-w-0 flex-1 rounded-[7px] px-1 text-[12.5px] transition-colors ${mono ? 'font-mono' : ''} ${
              value === o.value ? 'bg-k-surface2 font-semibold text-k-text' : 'text-k-text-dim hover:text-k-text'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
