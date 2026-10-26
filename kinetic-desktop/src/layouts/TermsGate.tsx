import { useEffect, useState, type ReactNode } from 'react';
import { Check, FileText, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { acceptTerms, getTermsAccepted } from '../services/userService';
import { TERMS_REQUIRED_EVENT } from '../services/api';

type TermsState = 'checking' | 'pending' | 'ok';

/**
 * Antes de qualquer tela logada: a conta precisa ter aceitado a versão vigente dos
 * Termos de Uso e da Política de Privacidade. Vale para quem foi cadastrado por
 * terceiros (empresa, ROOT) e para todos quando os termos mudam. O backend também
 * barra a API (TERMS_REQUIRED) e, se isso acontecer com a tela aberta, o aviso volta.
 */
export default function TermsGate({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const [state, setState] = useState<TermsState>('checking');
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getTermsAccepted()
      .then((accepted) => active && setState(accepted ? 'ok' : 'pending'))
      // Falha de rede não bloqueia: se faltar o aceite, a API responde TERMS_REQUIRED e o aviso aparece.
      .catch(() => active && setState('ok'));
    const onRequired = () => setState('pending');
    window.addEventListener(TERMS_REQUIRED_EVENT, onRequired);
    return () => {
      active = false;
      window.removeEventListener(TERMS_REQUIRED_EVENT, onRequired);
    };
  }, []);

  const handleAccept = async () => {
    setSaving(true);
    try {
      await acceptTerms();
      setState('ok');
    } catch {
      toast.error('Não foi possível registrar o aceite. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (state === 'checking') return <div className="h-screen w-screen bg-k-bg" />;
  if (state === 'ok') return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-k-bg p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-gate-title"
        className="flex w-full max-w-[480px] flex-col gap-5 rounded-[22px] border border-white/10 bg-k-surface1 p-7 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.7)]"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-k-primary/[0.12] text-k-primary">
          <FileText className="h-[22px] w-[22px]" />
        </span>
        <div>
          <h2 id="terms-gate-title" className="font-display text-2xl font-extrabold tracking-tight font-stretch-semi-expanded">
            Termos de Uso e Privacidade
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-k-text-dim">
            Para continuar usando o Kinetic, leia e aceite a versão atual dos nossos termos. Eles explicam como
            tratamos os seus dados e os dos seus alunos, por quanto tempo guardamos e como você exerce os seus
            direitos.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-k-primary hover:underline">
            Termos de Uso
          </a>
          <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-k-primary hover:underline">
            Política de Privacidade
          </a>
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-k-text-soft">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#00E5FF]"
          />
          Li e aceito os Termos de Uso e a Política de Privacidade.
        </label>
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={saving}
            className="mr-auto flex h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-k-text-muted transition-colors hover:text-k-alert disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={!checked || saving}
            className="flex h-11 items-center gap-2 rounded-xl bg-k-primary px-5 text-sm font-bold text-k-on-primary transition-[box-shadow,opacity] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_10px_26px_-10px_rgba(0,229,255,0.8)] disabled:pointer-events-none disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {saving ? 'Salvando…' : 'Aceitar e continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
