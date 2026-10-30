import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight } from 'lucide-react';
import FormDialog, { formLabelClass } from './FormDialog';
import { pauseAlerts, resumeAlerts } from '../../services/trainerService';
import { qk, queryClient } from '../../services/queryClient';
import type { AlertPause, AlertPauseReason } from '../../types';
import { errorMessage } from '../../utils/errors';
import { firstNameOf } from '../../utils/names';

/** Motivos da pausa, com a duração sugerida para cada um. */
export const PAUSE_REASONS: { value: AlertPauseReason; label: string; days: number }[] = [
  { value: 'CONTATO', label: 'Já conversei com o aluno', days: 7 },
  { value: 'LESAO', label: 'Lesão ou doença', days: 30 },
  { value: 'VIAGEM', label: 'Viagem ou férias', days: 14 },
  { value: 'OUTRO', label: 'Outro motivo', days: 7 },
];

const DAY_OPTIONS = [3, 7, 14, 30];
const NOTE_MAX = 500;

export const pauseReasonLabel = (reason: AlertPauseReason | null) =>
  PAUSE_REASONS.find((r) => r.value === reason)?.label ?? 'Pausado';

/** Desfaz a pausa: o aluno volta para a fila de hoje e para os alertas de risco. */
export const resumeStudentAlerts = async (studentId: string) => {
  try {
    await resumeAlerts(studentId);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.engagement }),
      queryClient.invalidateQueries({ queryKey: qk.today }),
    ]);
  } catch {
    toast.error('Não foi possível reativar o alerta. Tente novamente.');
  }
};

/**
 * Resolver um alerta de risco: o personal anota o motivo (lesão, viagem, já
 * conversou…) e o alerta some da fila e do painel de risco pelo tempo escolhido.
 */
export default function PauseAlertDialog({
  open,
  studentId,
  studentName,
  alertMessage,
  current,
  onClose,
}: {
  open: boolean;
  studentId: string;
  studentName: string;
  alertMessage?: string;
  /** Pausa em vigor, para editar a anotação. */
  current?: AlertPause | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<AlertPauseReason>('CONTATO');
  const [days, setDays] = useState(7);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason(current?.reason ?? 'CONTATO');
    setDays(PAUSE_REASONS.find((r) => r.value === (current?.reason ?? 'CONTATO'))?.days ?? 7);
    setNote(current?.note ?? '');
  }, [open, current]);

  const chooseReason = (r: (typeof PAUSE_REASONS)[number]) => {
    setReason(r.value);
    setDays(r.days);
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await pauseAlerts(studentId, { reason, days, note: note.trim() });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.engagement }),
        queryClient.invalidateQueries({ queryKey: qk.today }),
      ]);
      toast.success('Alerta pausado', { description: `${studentName} volta para a fila em ${days} dias.` });
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível salvar. Tente novamente.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title={`Resolver alerta de ${firstNameOf(studentName)}`}
      description={alertMessage}
      submitLabel={`Pausar por ${days} dias`}
      busy={busy}
      onSubmit={() => void handleSubmit()}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-2">
        <span className={formLabelClass}>O que aconteceu?</span>
        <div role="radiogroup" aria-label="Motivo" className="grid grid-cols-2 gap-2">
          {PAUSE_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={reason === r.value}
              onClick={() => chooseReason(r)}
              className={`h-10 rounded-xl border px-3 text-left text-[13px] transition-colors ${
                reason === r.value
                  ? 'border-k-primary bg-k-primary/[0.08] font-semibold text-k-text'
                  : 'border-white/10 text-k-text-dim hover:text-k-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className={formLabelClass}>Anotação</span>
        <textarea
          rows={3}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex.: torceu o tornozelo, volta depois do fisioterapeuta"
          className="w-full rounded-xl border border-white/10 bg-k-bg px-4 py-3 text-[15px] placeholder:text-k-text-muted focus:border-k-primary"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className={formLabelClass}>Esconder o alerta por</span>
        <div role="radiogroup" aria-label="Duração" className="flex rounded-[10px] border border-white/10 bg-k-bg p-[3px]">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={days === d}
              onClick={() => setDays(d)}
              className={`h-8 flex-1 rounded-[7px] font-mono text-[12.5px] transition-colors ${
                days === d ? 'bg-k-surface2 font-semibold text-k-text' : 'text-k-text-dim hover:text-k-text'
              }`}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>

      <Link
        to={`/students/${studentId}`}
        className="flex items-center gap-1 self-start text-[13px] text-k-text-dim hover:text-k-text"
      >
        Abrir página do aluno
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </FormDialog>
  );
}
