import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Snowflake } from 'lucide-react';
import Avatar from '../Avatar';
import { billingErrorMessage, chooseActiveStudents, formatDate } from '../../services/billingService';
import { listStudents } from '../../services/trainerService';
import { qk, queryClient } from '../../services/queryClient';
import type { BillingOverview } from '../../types';

/**
 * Carteira acima do limite do plano Grátis: o personal escolhe quem continua
 * editável. Os demais ficam congelados (ele vê o histórico, não edita nada) até
 * assinar; o aluno não perde nada no app.
 */
export default function ActiveStudentsPicker({ billing }: { billing: BillingOverview }) {
  const limit = billing.studentLimit ?? 0;
  const studentsQ = useQuery({ queryKey: qk.students, queryFn: listStudents });
  const students = (studentsQ.data ?? []).filter((l) => l.source !== 'COMPANY');
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Começa pelo que vale hoje: quem não está congelado (no prazo, os primeiros da lista).
  useEffect(() => {
    if (!studentsQ.data) return;
    const current = students.filter((l) => !l.frozen).slice(0, limit).map((l) => l.peer.id);
    setChosen(new Set(current));
  }, [studentsQ.data, limit]);

  const toggle = (id: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < limit) next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    try {
      queryClient.setQueryData(qk.billing, await chooseActiveStudents([...chosen]));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.students }),
        queryClient.invalidateQueries({ queryKey: qk.today }),
      ]);
      toast.success('Alunos ativos salvos');
    } catch (err) {
      toast.error(billingErrorMessage(err, 'Não foi possível salvar. Tente novamente.'));
    } finally {
      setSaving(false);
    }
  };

  const inWindow = !!billing.chooseActiveUntil;

  return (
    <section id="carteira" aria-labelledby="carteira-titulo" className="flex scroll-mt-24 flex-col rounded-xl border border-k-warn/30">
      <div className="flex flex-col gap-1.5 border-b border-white/[0.07] p-5">
        <h2 id="carteira-titulo" className="flex items-center gap-2 text-[17px] font-semibold">
          <Snowflake className="h-4 w-4 text-k-warn" />
          Sua carteira passou do limite do plano Grátis
        </h2>
        <p className="text-[13px] leading-relaxed text-k-text-dim">
          Você tem {billing.activeStudents} alunos e o Grátis permite {limit}.{' '}
          {inWindow
            ? `Escolha até ${formatDate(billing.chooseActiveUntil)} quais continuam ativos. Depois disso, os outros ficam congelados.`
            : `${billing.frozenStudents} ${billing.frozenStudents === 1 ? 'aluno está congelado' : 'alunos estão congelados'}.`}{' '}
          Congelado, você vê o histórico mas não edita ficha, avaliação, protocolo nem mensalidade; o aluno continua
          treinando normalmente no app. Assine um plano para liberar todos.
          {!inWindow && ' Depois do prazo, dá para trocar os ativos uma vez a cada 30 dias.'}
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-white/[0.06]">
        {students.map((l) => {
          const on = chosen.has(l.peer.id);
          const full = !on && chosen.size >= limit;
          return (
            <li key={l.peer.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={full}
                onClick={() => toggle(l.peer.id)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    on ? 'border-k-primary bg-k-primary text-k-on-primary' : 'border-white/20'
                  }`}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
                <Avatar name={l.peer.nome} avatarUrl={l.peer.avatarUrl} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm">{l.peer.nome}</span>
                {l.frozen && <span className="text-xs text-k-warn">Congelado</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-3.5">
        <span className="font-mono text-xs text-k-text-muted">
          {chosen.size} / {limit} ativos
        </span>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || chosen.size === 0}
          className="h-9 rounded-lg bg-k-primary px-4 text-[13px] font-semibold text-k-on-primary hover:bg-[#7df1ff] disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar alunos ativos'}
        </button>
      </div>
    </section>
  );
}
