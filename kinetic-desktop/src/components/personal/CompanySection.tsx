import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import FormDialog from './FormDialog';
import {
  acceptCompanyInvite,
  declineCompanyInvite,
  getMyCompany,
  leaveCompany,
} from '../../services/trainerProfileService';
import type { TrainerCompany } from '../../types';

/**
 * Empresa do personal: o convite de uma empresa só vale depois do aceite aqui, e o
 * personal pode sair quando quiser. Sem empresa e sem convite, a seção não aparece.
 */
export default function CompanySection() {
  const [company, setCompany] = useState<TrainerCompany | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const load = async () => {
    try {
      setCompany(await getMyCompany());
    } catch {
      setCompany(null);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      setLeaving(false);
      await load();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } }).response?.data;
      toast.error(typeof data === 'string' && data ? data : 'Não foi possível concluir. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  if (!company || (!company.current && !company.pending)) return null;

  const buttonClass =
    'flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text disabled:opacity-50';

  return (
    <section className="flex flex-col gap-4 rounded-[18px] border border-k-ghost bg-k-surface1 p-6">
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-k-primary" />
        <div>
          <h2 className="font-display text-[17px] font-extrabold tracking-tight font-stretch-semi-expanded">Empresa</h2>
          {company.current ? (
            <p className="mt-1 text-[13px] text-k-text-muted">
              Você é funcionário de <strong className="text-k-text">{company.current.nome}</strong>. A empresa pode
              atribuir alunos a você e cobre o seu plano.
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-k-text-muted">
              <strong className="text-k-text">{company.pending?.nome}</strong> convidou você para ser funcionário. Ao
              aceitar, a empresa passa a poder atribuir alunos a você e a cobrir o seu plano.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {company.current ? (
          <button type="button" onClick={() => setLeaving(true)} className={buttonClass}>
            Sair da empresa
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(acceptCompanyInvite, 'Convite aceito.')}
              className="h-11 rounded-xl bg-k-primary px-5 text-sm font-bold text-k-on-primary disabled:opacity-50"
            >
              Aceitar convite
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(declineCompanyInvite, 'Convite recusado.')}
              className={buttonClass}
            >
              Recusar
            </button>
          </>
        )}
      </div>

      <FormDialog
        open={leaving}
        title="Sair da empresa?"
        description={
          <>
            Você volta ao seu plano individual, e os alunos que <strong>{company.current?.nome}</strong> atribuiu a
            você deixam de ser acompanhados por você. Os alunos que você convidou continuam na sua carteira.
          </>
        }
        submitLabel="Sair da empresa"
        busy={busy}
        onSubmit={() => void run(leaveCompany, 'Você saiu da empresa.')}
        onCancel={() => setLeaving(false)}
      >
        {null}
      </FormDialog>
    </section>
  );
}
