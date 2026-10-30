import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ClipboardList, FileText, Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import FormDialog, { formInputClass, formLabelClass } from './FormDialog';
import ConfirmDialog from './ConfirmDialog';
import { EASE_OUT } from '../motion/primitives';
import { MEASURE_FIELDS, delta, formatMeasure } from './assessmentFields';
import {
  createAssessment,
  deleteAssessment,
  listAssessments,
  updateAssessment,
} from '../../services/assessmentService';
import { qk, refreshTrainerData } from '../../services/queryClient';
import { dayMonth, fullDate, todayIso } from '../../utils/dates';
import type { AssessmentInput, AssessmentMeasures, PhysicalAssessment } from '../../types';
import { errorMessage } from '../../utils/errors';

type Draft = Record<keyof AssessmentMeasures, string> & { assessedOn: string; notes: string };

const emptyDraft = (base?: PhysicalAssessment | null): Draft => {
  const draft = { assessedOn: todayIso(), notes: '' } as Draft;
  for (const f of MEASURE_FIELDS) {
    // Altura raramente muda: a nova avaliação já vem com a última altura.
    const value = f.key === 'heightCm' ? base?.heightCm : null;
    draft[f.key] = value != null ? String(value).replace('.', ',') : '';
  }
  return draft;
};

const toDraft = (a: PhysicalAssessment): Draft => {
  const draft = { assessedOn: a.assessedOn, notes: a.notes ?? '' } as Draft;
  for (const f of MEASURE_FIELDS) {
    const v = a[f.key];
    draft[f.key] = v == null ? '' : String(v).replace('.', ',');
  }
  return draft;
};

/** Draft → corpo da API; null em "erro" quando algum número não é válido. */
function toInput(d: Draft): AssessmentInput | 'erro' {
  const input = { assessedOn: d.assessedOn, notes: d.notes.trim() || null } as AssessmentInput;
  for (const f of MEASURE_FIELDS) {
    const raw = d[f.key].trim().replace(',', '.');
    if (!raw) {
      input[f.key] = null;
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return 'erro';
    input[f.key] = f.key === 'restingHr' ? Math.round(n) : n;
  }
  return input;
}

const tooltipStyle = {
  background: '#1c1b1b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  fontSize: 12,
};

/** Aba "Avaliações" do aluno: histórico, gráfico de evolução e cadastro de novas avaliações. */
export default function AssessmentsTab({ studentId, studentFirstName }: { studentId: string; studentFirstName: string }) {
  const listQ = useQuery({ queryKey: qk.assessments(studentId), queryFn: () => listAssessments(studentId) });
  const list = listQ.data ?? null;
  const loadError = listQ.isError && !list;
  const [editing, setEditing] = useState<PhysicalAssessment | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [showCircumferences, setShowCircumferences] = useState(false);
  const [deleting, setDeleting] = useState<PhysicalAssessment | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Avaliação também mexe na caixa "Hoje" (reavaliação pendente): recarrega o que estiver na tela.
  const load = () => void refreshTrainerData();

  const latest = list && list.length > 0 ? list[list.length - 1] : null;

  const openNew = () => {
    setDraft(emptyDraft(latest));
    setShowCircumferences(false);
    setEditing('new');
  };

  const openEdit = (a: PhysicalAssessment) => {
    setDraft(toDraft(a));
    setShowCircumferences(MEASURE_FIELDS.some((f) => f.group === 'circunferencias' && a[f.key] != null));
    setEditing(a);
  };

  const input = toInput(draft);
  const hasMeasure = input !== 'erro' && MEASURE_FIELDS.some((f) => input[f.key] != null);

  const handleSave = async () => {
    if (input === 'erro' || !hasMeasure || !editing) return;
    setSaving(true);
    try {
      if (editing === 'new') await createAssessment(studentId, input);
      else await updateAssessment(studentId, editing.id, input);
      toast.success(editing === 'new' ? 'Avaliação registrada' : 'Avaliação atualizada');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível salvar a avaliação.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteAssessment(studentId, deleting.id);
      toast.success('Avaliação apagada');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível apagar.'));
    } finally {
      setDeleteBusy(false);
    }
  };

  const chartData = (list ?? [])
    .filter((a) => a.weightKg != null || a.bodyFatPct != null)
    .map((a) => ({ date: dayMonth(a.assessedOn), peso: a.weightKg, gordura: a.bodyFatPct }));

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 md:px-8 pb-16 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-extrabold tracking-tight font-stretch-semi-expanded">
            Avaliações físicas
          </h2>
          <p className="text-sm text-k-text-muted">
            {latest ? `Última em ${fullDate(latest.assessedOn)}` : `Nenhuma avaliação de ${studentFirstName} ainda.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {list && list.length > 0 && (
            <Link
              to={`/students/${studentId}/relatorio`}
              className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-k-surface1 px-4 text-sm font-semibold text-k-text-dim transition-colors hover:border-k-primary/45 hover:text-k-primary"
            >
              <FileText className="h-4 w-4" />
              Relatório de evolução
            </Link>
          )}
          <button
            type="button"
            onClick={openNew}
            className="flex h-11 items-center gap-2 rounded-xl bg-k-primary px-4 text-sm font-bold text-k-on-primary"
          >
            <Plus className="h-4 w-4" />
            Nova avaliação
          </button>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-[18px] border border-dashed border-white/[0.14] p-8 text-center text-sm text-k-text-dim">
          Não foi possível carregar as avaliações.{' '}
          <button type="button" onClick={load} className="font-semibold text-k-primary hover:underline">
            Tentar de novo
          </button>
        </div>
      ) : !list ? (
        <div role="status" aria-label="Carregando avaliações" className="k-skeleton h-40 rounded-[18px] bg-k-surface1" />
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-white/[0.14] px-6 py-12 text-center">
          <ClipboardList className="h-8 w-8 text-k-primary" />
          <p className="max-w-md text-sm text-k-text-dim">
            Registre peso, % de gordura e circunferências para acompanhar a evolução de {studentFirstName} e gerar
            um relatório para mostrar a ele.
          </p>
        </div>
      ) : (
        <>
          {chartData.length >= 2 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="rounded-[18px] border border-k-ghost bg-k-surface1 p-5"
            >
              <h3 className="font-display text-base font-bold font-stretch-semi-expanded">Evolução</h3>
              <p className="mb-3 text-[12.5px] text-k-text-muted">Peso (kg) e gordura corporal (%) por avaliação</p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4" />
                    <XAxis dataKey="date" tick={{ fill: '#8e8f90', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="peso" domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#8e8f90', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                    <YAxis yAxisId="gordura" orientation="right" domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#8e8f90', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#8e8f90' }} />
                    <Line yAxisId="peso" type="monotone" dataKey="peso" name="Peso (kg)" stroke="#00e5ff" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                    <Line yAxisId="gordura" type="monotone" dataKey="gordura" name="Gordura (%)" stroke="#f5b945" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
          )}

          <ul className="flex flex-col gap-3">
            {[...list].reverse().map((a, i, arr) => {
              const previous = arr[i + 1];
              const filled = MEASURE_FIELDS.filter((f) => a[f.key] != null);
              return (
                <li key={a.id} className="flex flex-col gap-3 rounded-[16px] border border-k-ghost bg-k-surface1 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{fullDate(a.assessedOn)}</span>
                    {a.trainerName && <span className="text-[12.5px] text-k-text-muted">por {a.trainerName}</span>}
                    {a.bmi != null && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[12px] text-k-text-dim">IMC {formatMeasure(a.bmi, '')}</span>
                    )}
                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        aria-label="Corrigir avaliação"
                        onClick={() => openEdit(a)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-k-text-dim hover:text-k-text"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Apagar avaliação"
                        onClick={() => setDeleting(a)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-k-text-dim hover:border-k-alert/40 hover:text-k-alert"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-2">
                    {filled.map((f) => {
                      const d = previous ? delta(previous[f.key], a[f.key], f.unit, f.better, f.digits) : null;
                      return (
                        <div key={f.key} className="rounded-xl bg-k-bg px-3 py-2">
                          <p className="text-[11.5px] text-k-text-muted">{f.label}</p>
                          <p className="text-sm font-semibold">{formatMeasure(a[f.key], f.unit, f.digits)}</p>
                          {d && (
                            <p
                              className={`text-[11.5px] ${
                                d.tone === 'good' ? 'text-k-success' : d.tone === 'bad' ? 'text-k-alert' : 'text-k-text-muted'
                              }`}
                            >
                              {d.text}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {a.notes && <p className="text-[13px] text-k-text-dim">{a.notes}</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <FormDialog
        open={editing !== null}
        title={editing === 'new' ? 'Nova avaliação' : 'Corrigir avaliação'}
        description="Preencha só o que você mediu. Use vírgula ou ponto nas casas decimais."
        submitLabel={editing === 'new' ? 'Registrar avaliação' : 'Salvar'}
        busy={saving}
        submitDisabled={input === 'erro' || !hasMeasure}
        onSubmit={() => void handleSave()}
        onCancel={() => setEditing(null)}
      >
        <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
          <label className="flex flex-col gap-2">
            <span className={formLabelClass}>Data</span>
            <input
              type="date"
              max={todayIso()}
              value={draft.assessedOn}
              onChange={(e) => setDraft({ ...draft, assessedOn: e.target.value })}
              className={formInputClass}
            />
          </label>
          <MeasureGrid draft={draft} setDraft={setDraft} group="composicao" />
          <button
            type="button"
            onClick={() => setShowCircumferences((v) => !v)}
            className="flex items-center gap-2 self-start text-[13px] font-semibold text-k-primary hover:underline"
          >
            <Ruler className="h-4 w-4" />
            {showCircumferences ? 'Ocultar circunferências' : 'Adicionar circunferências'}
          </button>
          {showCircumferences && <MeasureGrid draft={draft} setDraft={setDraft} group="circunferencias" />}
          <label className="flex flex-col gap-2">
            <span className={formLabelClass}>Observações</span>
            <textarea
              rows={3}
              maxLength={2000}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Protocolo usado, condições da medição, pontos de atenção…"
              className="w-full rounded-xl border border-white/10 bg-k-bg px-4 py-3 text-[15px] placeholder:text-k-text-muted focus:border-k-primary"
            />
          </label>
          {input === 'erro' && <p className="text-[13px] text-k-alert">Confira os números: use só valores positivos.</p>}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        title="Apagar esta avaliação?"
        description={deleting ? `A avaliação de ${fullDate(deleting.assessedOn)} sai do histórico e do relatório.` : ''}
        confirmLabel="Apagar"
        destructive
        busy={deleteBusy}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function MeasureGrid({
  draft,
  setDraft,
  group,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  group: 'composicao' | 'circunferencias';
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {MEASURE_FIELDS.filter((f) => f.group === group).map((f) => (
        <label key={f.key} className="flex flex-col gap-1.5">
          <span className={formLabelClass}>
            {f.label} <span className="font-normal text-k-text-muted">({f.unit})</span>
          </span>
          <input
            inputMode="decimal"
            value={draft[f.key]}
            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            className={formInputClass}
          />
        </label>
      ))}
    </div>
  );
}
