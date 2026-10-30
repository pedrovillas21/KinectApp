import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import KineticLogo from '../components/KineticLogo';
import { riseItem, staggerContainer } from '../components/motion/primitives';
import AuthBrandPanel, { authInputClass } from '../components/AuthBrandPanel';
import { requestPasswordReset, resetPassword } from '../services/authService';

const HIGHLIGHTS = [
  { icon: MailCheck, title: 'Código no seu e-mail', text: 'Enviamos 6 dígitos que valem por 15 minutos.' },
  { icon: ShieldCheck, title: 'Uso único', text: 'O código só funciona uma vez e trava após 5 erros.' },
  { icon: KeyRound, title: 'Sessões encerradas', text: 'Ao trocar a senha, todos os acessos abertos saem.' },
];

// Mesma regra do ResetPasswordDTO no backend.
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,20}$/;

// Dois passos na mesma página: pedir o código (resposta uniforme, exista a conta ou
// não) e depois informar código + nova senha. O e-mail fica em memória, nunca na URL.
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email ?? '';

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const isCodeValid = /^\d{6}$/.test(code);
  const isPasswordValid = PASSWORD_RULE.test(password);
  const passwordsMatch = password === confirm;

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !email) return;
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setStep('reset');
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !isCodeValid || !isPasswordValid || !passwordsMatch) return;
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const result = await resetPassword(email, code, password);
      if (result.success) {
        navigate('/login', { replace: true, state: { passwordReset: true } });
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setInfo('Se houver uma conta com este e-mail, um novo código chegará em instantes. Aguarde 1 minuto entre os pedidos.');
      } else {
        setError(result.error);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-k-bg text-k-text">
      <aside className="hidden lg:block border-r border-k-ghost">
        <AuthBrandPanel
          contentKey="forgot-password"
          eyebrow="Recuperar acesso"
          title={
            <>
              Esqueceu a senha?
              <br />
              <span className="text-k-text-muted">A gente confirma que é você.</span>
            </>
          }
          highlights={HIGHLIGHTS}
        />
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <motion.form
          key={step}
          onSubmit={step === 'email' ? handleRequest : handleReset}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="w-full max-w-[380px] flex flex-col"
        >
          <motion.div variants={riseItem} className="lg:hidden mb-10">
            <KineticLogo size={20} />
          </motion.div>

          {step === 'email' ? (
            <>
              <motion.div variants={riseItem}>
                <h1 className="font-display font-bold text-[28px] leading-tight tracking-tight">Redefinir senha</h1>
                <p className="mt-1.5 text-sm text-k-text-dim">
                  Informe o e-mail da sua conta. Enviaremos um código de 6 dígitos.
                </p>
              </motion.div>

              <motion.div variants={riseItem} className="mt-8 flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-k-text-soft">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  className={authInputClass}
                />
              </motion.div>
            </>
          ) : (
            <>
              <motion.div variants={riseItem}>
                <h1 className="font-display font-bold text-[28px] leading-tight tracking-tight">Digite o código</h1>
                <p className="mt-1.5 text-sm text-k-text-dim">
                  Se houver uma conta com <span className="text-k-text-soft font-medium">{email.trim()}</span>, o
                  código chegou por e-mail. Ele vale por 15 minutos.
                </p>
              </motion.div>

              <motion.div variants={riseItem} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="code" className="text-sm font-medium text-k-text-soft">
                    Código de verificação
                  </label>
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
                    className={`${authInputClass} tracking-[0.4em] placeholder:tracking-normal`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-sm font-medium text-k-text-soft">
                    Nova senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Sua nova senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      aria-describedby="password-rule"
                      className={`${authInputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                      className="absolute inset-y-0 right-0 w-11 grid place-items-center text-k-text-muted hover:text-k-text transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p
                    id="password-rule"
                    className={`text-xs ${password && !isPasswordValid ? 'text-k-alert' : 'text-k-text-muted'}`}
                  >
                    8 a 20 caracteres, com maiúscula, minúscula e um especial (!@#$%^&*_=+-).
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="confirm" className="text-sm font-medium text-k-text-soft">
                    Confirmar nova senha
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repita a nova senha"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className={authInputClass}
                  />
                  {confirm && !passwordsMatch && <p className="text-xs text-k-alert">As senhas não conferem.</p>}
                </div>
              </motion.div>
            </>
          )}

          {error && (
            <div
              className="mt-5 flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-k-error/10 border border-k-error/30 text-k-alert text-sm"
              role="alert"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-k-error shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div
              className="mt-5 flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-k-primary/10 border border-k-primary/30 text-k-primary text-sm"
              role="status"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-k-primary shrink-0" />
              <span>{info}</span>
            </div>
          )}

          <motion.div variants={riseItem} className="mt-7">
            <button
              type="submit"
              disabled={
                submitting ||
                (step === 'email' ? !email : !isCodeValid || !isPasswordValid || !passwordsMatch)
              }
              className="group w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-k-primary text-k-on-primary font-semibold text-sm transition-[background-color,box-shadow,transform] hover:bg-k-primary-deep hover:shadow-[0_8px_24px_-8px_rgba(0,229,255,0.55)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-k-primary/30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {step === 'email' ? 'Enviando…' : 'Salvando…'}
                </>
              ) : (
                <>
                  {step === 'email' ? 'Enviar código' : 'Redefinir senha'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="mt-6 flex flex-col items-center gap-3 text-sm">
              {step === 'reset' && (
                <div className="flex items-center gap-4 text-k-text-dim">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="font-medium hover:text-k-text transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {resending ? 'Reenviando…' : 'Reenviar código'}
                  </button>
                  <span className="text-k-ghost-hi">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setCode('');
                      setError(null);
                      setInfo(null);
                    }}
                    className="font-medium hover:text-k-text transition-colors cursor-pointer"
                  >
                    Trocar e-mail
                  </button>
                </div>
              )}
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 font-semibold text-k-primary hover:underline underline-offset-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para o login
              </Link>
            </div>
          </motion.div>
        </motion.form>
      </main>
    </div>
  );
}
