import { useState } from 'react';
import { toast } from 'sonner';
import { Download, Trash2 } from 'lucide-react';
import FormDialog, { formInputClass, formLabelClass } from './FormDialog';
import { useAuth } from '../../contexts/AuthContext';
import { deleteMyAccount, downloadMyData } from '../../services/userService';
import { errorMessage } from '../../utils/errors';

/** Direitos do titular no painel (LGPD art. 18): baixar uma cópia dos dados e excluir a conta. */
export default function AccountPrivacySection() {
  const { signOut } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadMyData();
    } catch {
      toast.error('Não foi possível gerar a cópia dos seus dados. Tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteMyAccount(password);
      toast.success('Sua conta foi excluída.');
      await signOut();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Não foi possível excluir a conta. Tente novamente.'));
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-[18px] border border-k-ghost bg-k-surface1 p-6">
      <div>
        <h2 className="font-display text-[17px] font-extrabold tracking-tight font-stretch-semi-expanded">
          Privacidade e dados
        </h2>
        <p className="mt-1 text-[13px] text-k-text-muted">
          Veja como tratamos seus dados na{' '}
          <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-k-primary hover:underline">
            Política de Privacidade
          </a>
          .
        </p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {downloading ? 'Gerando…' : 'Baixar meus dados'}
        </button>
        <button
          type="button"
          onClick={() => setDeleting(true)}
          className="flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-k-text-dim transition-colors hover:border-k-alert/40 hover:text-k-alert"
        >
          <Trash2 className="h-4 w-4" />
          Excluir minha conta
        </button>
      </div>

      <FormDialog
        open={deleting}
        title="Excluir sua conta?"
        description={
          <>
            A exclusão é imediata e não pode ser desfeita: seu perfil, seus alunos, mensalidades, fichas e
            avaliações saem do Kinetic, e a assinatura é cancelada. Baixe uma cópia dos seus dados antes, se
            precisar dos registros financeiros. Por obrigação legal ficam guardados, sem acesso pelo app: os
            registros de acesso (6 meses), as fichas aprovadas por IA com a sua declaração de responsabilidade
            (5 anos) e o registro da conta excluída.
          </>
        }
        submitLabel="Excluir definitivamente"
        busy={busy}
        submitDisabled={password.length === 0}
        onSubmit={() => void handleDelete()}
        onCancel={() => {
          setDeleting(false);
          setPassword('');
        }}
      >
        <label className="flex flex-col gap-2">
          <span className={formLabelClass}>Confirme com a sua senha</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={formInputClass}
          />
        </label>
      </FormDialog>
    </section>
  );
}
