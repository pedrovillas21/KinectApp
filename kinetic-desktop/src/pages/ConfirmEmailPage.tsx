import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ArrowLeft, KeyRound, Mail } from 'lucide-react';

// Aberta depois do cadastro e quando o login recusa uma conta não confirmada; nos
// dois casos o backend já enviou o código. O e-mail chega por location.state (e
// não pela URL, para não ficar no histórico); se faltar, o campo é editável.
export default function ConfirmEmailPage() {
  const { confirmEmail, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const isCodeValid = /^\d{6}$/.test(code);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !isCodeValid || !email) return;
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const result = await confirmEmail(email, code);
      if (result.success) {
        navigate('/login', { replace: true, state: { emailConfirmed: true } });
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resending || !email) return;
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      const result = await resendConfirmation(email);
      if (result.success) {
        setInfo('Se houver uma conta aguardando confirmação, um novo código chegará em instantes. Aguarde 1 minuto entre os pedidos.');
      } else {
        setError(result.error);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative h-screen flex items-center justify-center bg-k-bg text-k-text overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-k-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-k-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-[420px] mx-4 z-10">
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-6 bg-k-surface1/85 backdrop-blur-xl border border-k-ghost rounded-2xl p-8 shadow-2xl hover:border-k-ghost-hi transition-colors duration-300"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-k-primary to-k-primary-deep text-k-on-primary shadow-[0_0_20px_rgba(0,229,255,0.35)]">
              <Activity className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-k-text-dim bg-clip-text text-transparent">
                Confirme seu e-mail
              </h1>
              <p className="text-sm text-k-text-dim mt-2 leading-relaxed">
                Enviamos um código de 6 dígitos para o seu e-mail. Ele vale por 30 minutos.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                E-mail
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-k-text-muted">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="code" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                Código de confirmação
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-k-text-muted">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                  className="w-full pl-12 pr-4 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm tracking-[0.4em] placeholder:text-k-text-muted placeholder:tracking-normal"
                />
              </div>
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

          {info && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-k-primary/10 border border-k-primary/30 text-k-primary text-xs leading-relaxed"
              role="status"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-k-primary shrink-0" />
              <span>{info}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !isCodeValid || !email}
            className="w-full mt-2 py-3.5 rounded-xl bg-k-primary hover:bg-k-primary-deep text-k-on-primary font-extrabold text-sm tracking-wide shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? 'Confirmando…' : 'Confirmar e-mail'}
          </button>

          <div className="flex flex-col items-center gap-3 mt-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email}
              className="text-xs font-bold text-k-text-dim hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Reenviando…' : 'Não recebeu? Reenviar código'}
            </button>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-k-primary hover:text-white transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar para o Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
