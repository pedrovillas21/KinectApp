import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, Copy, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth, type SecondFactorChallenge } from '../contexts/AuthContext';
import { homeForRole } from '../config/nav';

const inputClass =
  'w-full pl-12 pr-4 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted';

/**
 * Segunda etapa do login das contas de gestão (dono, filial, ROOT): o código de 6 dígitos
 * do app autenticador. No primeiro acesso mostra o QR code para cadastrar o app e, ao
 * confirmar, os códigos de recuperação. O desafio chega por location.state (não pela URL).
 */
export default function TwoFactorPage() {
  const { totpSetup, totpVerify, isLoggedIn, isLoadingAuth, currentUser } = useAuth();
  const challenge = useLocation().state as SecondFactorChallenge | null;

  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [finish, setFinish] = useState<(() => Promise<unknown>) | null>(null);

  useEffect(() => {
    if (!challenge?.setupRequired) return;
    void (async () => {
      const result = await totpSetup(challenge.challengeToken);
      if ('error' in result) return setError(result.error);
      setSecret(result.secret);
      // QR gerado no navegador: o segredo não passa por nenhum serviço externo.
      setQr(await QRCode.toDataURL(result.otpauthUri, { margin: 1, width: 220 }));
    })();
    // O desafio é fixo para esta tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoadingAuth && isLoggedIn) return <Navigate to={homeForRole(currentUser?.role)} replace />;
  if (!challenge?.challengeToken) return <Navigate to="/login" replace />;

  const codeReady = useRecovery ? code.replace(/[\s-]/g, '').length >= 10 : /^\d{6}$/.test(code);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !codeReady) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await totpVerify(challenge.challengeToken, code, useRecovery);
      if (!result.success) return setError(result.error);
      if (result.recoveryCodes?.length && result.finish) {
        setRecoveryCodes(result.recoveryCodes);
        setFinish(() => result.finish!);
      }
      // Sem códigos novos, a sessão já abriu e o <Navigate> acima redireciona.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-k-bg text-k-text overflow-hidden py-10">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-k-primary/10 blur-[120px] pointer-events-none" />
      <div className="relative w-full max-w-[440px] mx-4 z-10">
        {recoveryCodes ? (
          <div className="flex flex-col gap-5 bg-k-surface1/85 backdrop-blur-xl border border-k-ghost rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-2">
              <ShieldCheck className="w-10 h-10 text-k-primary" />
              <h1 className="text-2xl font-extrabold tracking-tight">App autenticador ativado</h1>
              <p className="text-sm text-k-text-dim leading-relaxed">
                Guarde estes códigos de recuperação fora do celular (papel, gerenciador de senhas). Cada um entra uma
                única vez, caso você perca o celular. Eles não serão mostrados de novo.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
              {recoveryCodes.map((c) => (
                <li key={c} className="rounded-lg bg-k-surface2/70 border border-k-ghost px-3 py-2 text-center">
                  {c}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(recoveryCodes.join('\n'))}
              className="inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-white/10 text-sm font-semibold text-k-text-dim hover:bg-k-surface2 hover:text-k-text"
            >
              <Copy className="w-4 h-4" /> Copiar códigos
            </button>
            <button
              type="button"
              onClick={() => void finish?.()}
              className="w-full py-3.5 rounded-xl bg-k-primary hover:bg-k-primary-deep text-k-on-primary font-extrabold text-sm"
            >
              Guardei os códigos, entrar no painel
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 bg-k-surface1/85 backdrop-blur-xl border border-k-ghost rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <ShieldCheck className="w-10 h-10 text-k-primary" />
              <h1 className="text-2xl font-extrabold tracking-tight">
                {challenge.setupRequired ? 'Cadastre o app autenticador' : 'Código do app autenticador'}
              </h1>
              <p className="text-sm text-k-text-dim leading-relaxed">
                {challenge.setupRequired
                  ? 'Abra o Authy, Google Authenticator ou Microsoft Authenticator, adicione uma conta lendo o QR code e digite o código de 6 dígitos que aparecer.'
                  : useRecovery
                    ? 'Digite um dos códigos de recuperação que você guardou ao ativar o app.'
                    : 'Abra o app autenticador e digite o código de 6 dígitos do Kinetic.'}
              </p>
            </div>

            {challenge.setupRequired && (
              <div className="flex flex-col items-center gap-3">
                {qr ? (
                  <img src={qr} alt="QR code para o app autenticador" className="rounded-xl bg-white p-2" width={220} height={220} />
                ) : (
                  <div className="k-skeleton w-[220px] h-[220px] rounded-xl bg-k-surface2" />
                )}
                {secret && (
                  <p className="text-xs text-k-text-muted text-center">
                    Sem câmera? Digite no app: <span className="font-mono text-k-text break-all">{secret}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="code" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                {useRecovery ? 'Código de recuperação' : 'Código de 6 dígitos'}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-k-text-muted">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  id="code"
                  type="text"
                  inputMode={useRecovery ? 'text' : 'numeric'}
                  autoComplete="one-time-code"
                  placeholder={useRecovery ? 'XXXXX-XXXXX' : '000000'}
                  maxLength={useRecovery ? 11 : 6}
                  value={code}
                  onChange={(e) =>
                    setCode(useRecovery ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))
                  }
                  autoFocus
                  className={`${inputClass} ${useRecovery ? '' : 'tracking-[0.4em] placeholder:tracking-normal'}`}
                />
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-k-error/10 border border-k-error/30 text-k-error text-xs leading-relaxed"
                role="alert"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-k-error shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !codeReady}
              className="w-full py-3.5 rounded-xl bg-k-primary hover:bg-k-primary-deep text-k-on-primary font-extrabold text-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? 'Conferindo…' : 'Entrar'}
            </button>

            <div className="flex flex-col items-center gap-3">
              {!challenge.setupRequired && (
                <button
                  type="button"
                  onClick={() => {
                    setUseRecovery(!useRecovery);
                    setCode('');
                    setError(null);
                  }}
                  className="text-xs font-bold text-k-text-dim hover:text-white transition-colors cursor-pointer"
                >
                  {useRecovery ? 'Usar o código do app' : 'Perdi o celular: usar código de recuperação'}
                </button>
              )}
              <Link
                to="/login"
                replace
                className="inline-flex items-center gap-2 text-xs font-bold text-k-primary hover:text-white transition-colors uppercase tracking-wider"
              >
                <ArrowLeft className="w-3 h-3" />
                Voltar para o Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
