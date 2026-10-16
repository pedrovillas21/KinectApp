import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listAssessments } from '../services/assessmentService';
import { getEngagement, listStudents } from '../services/trainerService';
import {
  DERIVED_FIELDS,
  MEASURE_FIELDS,
  delta,
  firstAndLast,
  formatMeasure,
} from '../components/personal/assessmentFields';
import { dayMonth, fullDate, todayIso } from '../utils/dates';
import type { PhysicalAssessment, StudentEngagement, TrainerLink } from '../types';

/** Medidas do "antes e depois", na ordem do relatório. */
const HIGHLIGHTS: { key: keyof PhysicalAssessment; label: string; unit: string; better: 'up' | 'down' | 'neutral'; digits: number }[] = [
  ...MEASURE_FIELDS.filter((f) => ['weightKg', 'bodyFatPct', 'muscleMassKg'].includes(f.key)),
  ...DERIVED_FIELDS.filter((f) => f.key !== 'bmi').map((f) => ({ ...f, digits: 1 })),
  ...MEASURE_FIELDS.filter((f) => ['waistCm', 'abdomenCm', 'hipCm'].includes(f.key)),
  { key: 'bmi', label: 'IMC', unit: '', better: 'neutral', digits: 1 },
];

const TABLE_COLUMNS = MEASURE_FIELDS.filter((f) =>
  ['weightKg', 'bodyFatPct', 'muscleMassKg', 'waistCm', 'abdomenCm', 'hipCm'].includes(f.key),
);

/**
 * Relatório de evolução do aluno, em layout claro para imprimir ou salvar em
 * PDF (Ctrl+P) e mandar ao aluno — o "prove o resultado" que segura a mensalidade.
 */
export default function EvolutionReportPage() {
  const { id = '' } = useParams();
  const { currentUser } = useAuth();
  const [link, setLink] = useState<TrainerLink | null | undefined>(undefined);
  const [list, setList] = useState<PhysicalAssessment[] | null>(null);
  const [engagement, setEngagement] = useState<StudentEngagement | null>(null);

  useEffect(() => {
    listStudents()
      .then((links) => setLink(links.find((l) => l.peer.id === id) ?? null))
      .catch(() => setLink(null));
    listAssessments(id)
      .then(setList)
      .catch(() => setList([]));
    getEngagement()
      .then((all) => setEngagement(all.find((e) => e.studentId === id) ?? null))
      .catch(() => setEngagement(null));
  }, [id]);

  if (link === undefined || list === null) {
    return <div className="min-h-screen bg-k-bg p-10 text-k-text-dim">Montando o relatório…</div>;
  }
  if (link === null) {
    return (
      <div className="min-h-screen bg-k-bg p-10 text-k-text">
        Aluno não encontrado na sua carteira.{' '}
        <Link to="/students" className="text-k-primary hover:underline">
          Voltar
        </Link>
      </div>
    );
  }

  const first = list[0];
  const last = list[list.length - 1];
  const chartData = list
    .filter((a) => a.weightKg != null || a.bodyFatPct != null)
    .map((a) => ({ date: dayMonth(a.assessedOn), peso: a.weightKg, gordura: a.bodyFatPct }));

  return (
    <div className="min-h-screen bg-k-bg print:bg-white">
      <div className="flex items-center gap-3 border-b border-k-ghost px-8 py-3.5 print:hidden">
        <Link
          to={`/students/${id}?aba=avaliacoes`}
          aria-label="Voltar para o aluno"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-k-surface1 text-k-text-dim hover:text-k-text"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <p className="text-sm text-k-text-dim">
          Use <strong className="text-k-text">Imprimir → Salvar como PDF</strong> e mande o arquivo para o aluno.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto flex h-11 items-center gap-2 rounded-xl bg-k-primary px-4 text-sm font-bold text-k-on-primary"
        >
          <Printer className="h-4 w-4" />
          Imprimir / salvar PDF
        </button>
      </div>

      <article className="mx-auto my-8 max-w-[820px] rounded-2xl bg-white p-10 text-neutral-900 shadow-2xl print:my-0 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Relatório de evolução</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{link.peer.nome}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {list.length === 0
                ? 'Sem avaliações registradas'
                : list.length === 1
                  ? `Avaliação de ${fullDate(first.assessedOn)}`
                  : `De ${fullDate(first.assessedOn)} a ${fullDate(last.assessedOn)} · ${list.length} avaliações`}
            </p>
          </div>
          <div className="text-right text-sm text-neutral-500">
            <p className="font-extrabold tracking-tight text-neutral-900">Kinetic</p>
            {currentUser?.nome && <p>Personal: {currentUser.nome}</p>}
          </div>
        </header>

        {list.length === 0 ? (
          <p className="py-10 text-center text-neutral-500">Registre avaliações na aba "Avaliações" do aluno.</p>
        ) : (
          <>
            <section className="mt-8">
              <h2 className="text-lg font-bold">{list.length > 1 ? 'Antes e agora' : 'Medidas'}</h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {HIGHLIGHTS.map((f) => {
                  const pair = firstAndLast(list, f.key);
                  if (!pair) return null;
                  const from = pair.first[f.key] as number;
                  const to = pair.last[f.key] as number;
                  const d = pair.first.id !== pair.last.id ? delta(from, to, f.unit, f.better, f.digits) : null;
                  return (
                    <div key={f.key} className="rounded-xl border border-neutral-200 p-3">
                      <p className="text-xs text-neutral-500">{f.label}</p>
                      <p className="text-lg font-bold">{formatMeasure(to, f.unit, f.digits)}</p>
                      {d && (
                        <p
                          className={`text-xs font-semibold ${
                            d.tone === 'good' ? 'text-emerald-600' : d.tone === 'bad' ? 'text-red-600' : 'text-neutral-500'
                          }`}
                        >
                          {d.text} desde {dayMonth(pair.first.assessedOn)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {chartData.length >= 2 && (
              <section className="mt-8 break-inside-avoid">
                <h2 className="text-lg font-bold">Peso e gordura corporal</h2>
                <div className="mt-3 h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: -8 }}>
                      <CartesianGrid vertical={false} stroke="#e5e5e5" strokeDasharray="4 4" />
                      <XAxis dataKey="date" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="peso" domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                      <YAxis yAxisId="gordura" orientation="right" domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip />
                      <Line yAxisId="peso" type="monotone" dataKey="peso" name="Peso (kg)" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 4 }} connectNulls isAnimationActive={false} />
                      <Line yAxisId="gordura" type="monotone" dataKey="gordura" name="Gordura (%)" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4 }} connectNulls isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-1 text-xs text-neutral-500">Azul: peso (kg) · Laranja: gordura corporal (%)</p>
              </section>
            )}

            <section className="mt-8 break-inside-avoid">
              <h2 className="text-lg font-bold">Histórico de avaliações</h2>
              <table className="mt-3 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                    <th className="py-2 font-semibold">Data</th>
                    {TABLE_COLUMNS.map((c) => (
                      <th key={c.key} className="py-2 font-semibold">
                        {c.label} ({c.unit})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((a) => (
                    <tr key={a.id} className="border-b border-neutral-100">
                      <td className="py-2 font-medium">{fullDate(a.assessedOn)}</td>
                      {TABLE_COLUMNS.map((c) => (
                        <td key={c.key} className="py-2">
                          {formatMeasure(a[c.key], '', c.digits)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {engagement && (
              <section className="mt-8 break-inside-avoid">
                <h2 className="text-lg font-bold">Constância nos treinos</h2>
                <p className="mt-2 text-sm text-neutral-700">
                  {engagement.sessionsLast7Days} {engagement.sessionsLast7Days === 1 ? 'treino' : 'treinos'} nos últimos 7 dias
                  {engagement.adherencePercent !== null &&
                    ` · ${engagement.adherencePercent}% da meta nos últimos ${engagement.adherenceWindowDays} dias`}
                  {engagement.weeklyTarget !== null && ` (meta: ${engagement.weeklyTarget}x por semana)`}.
                </p>
              </section>
            )}

            {last.notes && (
              <section className="mt-8 break-inside-avoid">
                <h2 className="text-lg font-bold">Observações da última avaliação</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{last.notes}</p>
              </section>
            )}
          </>
        )}

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
          Gerado pelo Kinetic em {fullDate(todayIso())}.
        </footer>
      </article>
    </div>
  );
}
