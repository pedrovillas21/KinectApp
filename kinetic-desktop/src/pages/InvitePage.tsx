import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, Check, Copy, Smartphone } from 'lucide-react';
import Avatar from '../components/Avatar';
import { getInvitePreview } from '../services/publicService';
import { expiryLabel, formatInviteCode } from '../utils/invite';
import type { InviteCodePreview } from '../types';

// Links das lojas: só aparecem quando configurados no .env (app ainda pode não estar publicado).
const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL as string | undefined;
const PLAY_STORE_URL = import.meta.env.VITE_PLAY_STORE_URL as string | undefined;

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; preview: InviteCodePreview }
  | { kind: 'invalid' }
  | { kind: 'error' };

/**
 * Página pública do link de convite (/convite/:code), aberta pelo aluno a
 * partir do WhatsApp. Mostra quem convidou e como usar o código no app.
 */
export default function InvitePage() {
  const { code = '' } = useParams();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [copied, setCopied] = useState(false);
  const displayCode = formatInviteCode(code);

  useEffect(() => {
    let cancelled = false;
    getInvitePreview(code)
      .then((preview) => !cancelled && setState({ kind: 'ok', preview }))
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        setState(status === 404 ? { kind: 'invalid' } : { kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão de clipboard: o código continua visível para copiar à mão.
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-k-bg px-4 py-10 text-k-text">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-k-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-k-primary/5 blur-[120px]" />

      <div className="relative z-10 flex w-full max-w-[440px] flex-col gap-6 rounded-2xl border border-k-ghost bg-k-surface1/85 p-7 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-k-primary to-k-primary-deep text-k-on-primary">
            <Activity className="h-5 w-5 stroke-[2.5]" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">Kinetic</span>
        </div>

        {state.kind === 'loading' && (
          <p role="status" className="py-10 text-center text-sm text-k-text-dim">
            Carregando convite…
          </p>
        )}

        {state.kind === 'invalid' && (
          <div className="flex flex-col gap-2 py-4">
            <h1 className="text-2xl font-extrabold tracking-tight">Convite indisponível</h1>
            <p className="text-sm leading-relaxed text-k-text-dim">
              Este link venceu, já foi usado ou não existe. Peça um novo link ao seu personal.
            </p>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="flex flex-col gap-2 py-4">
            <h1 className="text-2xl font-extrabold tracking-tight">Não foi possível abrir o convite</h1>
            <p className="text-sm leading-relaxed text-k-text-dim">
              Verifique sua conexão e recarregue a página.
            </p>
          </div>
        )}

        {state.kind === 'ok' && (
          <>
            <div className="flex items-center gap-4">
              <Avatar name={state.preview.trainerName} avatarUrl={state.preview.trainerAvatarUrl} size={56} />
              <div className="min-w-0">
                <p className="text-[13px] text-k-text-dim">Você foi convidado por</p>
                <h1 className="truncate text-xl font-extrabold tracking-tight">{state.preview.trainerName}</h1>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-k-text-dim">
              Seu personal vai montar e acompanhar seus treinos pelo app Kinetic.
            </p>

            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-k-bg p-4">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-k-text-muted">
                Seu código de convite
              </span>
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-[26px] font-extrabold tracking-[0.12em] text-k-primary">
                  {displayCode}
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-[13px] font-semibold text-k-text-dim transition-colors hover:bg-k-surface2 hover:text-k-text"
                >
                  {copied ? <Check className="h-4 w-4 text-k-primary" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <span className="text-[12.5px] text-k-text-muted">{expiryLabel(state.preview.expiresAt)}</span>
            </div>

            <ol className="flex flex-col gap-3 text-sm">
              {[
                'Baixe o app Kinetic no seu celular.',
                'Crie sua conta (ou entre, se já tiver uma).',
                'No cadastro ou em Perfil → Convites de personal, digite o código acima.',
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-k-primary-dim text-[12px] font-bold text-k-primary">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-k-text-soft">{step}</span>
                </li>
              ))}
            </ol>

            {(APP_STORE_URL || PLAY_STORE_URL) && (
              <div className="flex flex-wrap gap-2.5">
                {PLAY_STORE_URL && (
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-k-primary text-sm font-bold text-k-on-primary"
                  >
                    <Smartphone className="h-4 w-4" />
                    Google Play
                  </a>
                )}
                {APP_STORE_URL && (
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-k-primary text-sm font-bold text-k-on-primary"
                  >
                    <Smartphone className="h-4 w-4" />
                    App Store
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
