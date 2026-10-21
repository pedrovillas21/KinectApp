import { useState, type FormEvent } from 'react';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { homeForRole } from '../config/nav';
import { ArrowRight, Eye, EyeOff, Loader2, Smartphone, Sparkles, Users, Wallet } from 'lucide-react';
import KineticLogo from '../components/KineticLogo';
import { riseItem, staggerContainer } from '../components/motion/primitives';
import AuthBrandPanel, { authInputClass } from '../components/AuthBrandPanel';

const HIGHLIGHTS = [
  { icon: Sparkles, title: 'Prescrição com IA', text: 'Monte planos de treino em minutos.' },
  { icon: Users, title: 'Alunos em tempo real', text: 'Cargas, frequência e evolução num só lugar.' },
  { icon: Wallet, title: 'Cobrança integrada', text: 'Mensalidades e financeiro sem planilha.' },
];

export default function LoginPage() {
  const { signIn, isLoggedIn, isLoadingAuth, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailConfirmed = (location.state as { emailConfirmed?: boolean } | null)?.emailConfirmed ?? false;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirect role-aware: cada papel cai na sua home. Ao logar com sucesso o
  // AuthContext marca isLoggedIn/currentUser → este guard reavalia e navega.
  if (!isLoadingAuth && isLoggedIn) {
    return <Navigate to={homeForRole(currentUser?.role)} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn({ email, password });
      if (!result.success) {
        if (result.needsEmailVerification) {
          // O backend já reenviou o código; a página de confirmação recebe o e-mail via state.
          navigate('/confirm-email', { state: { email: email.trim() } });
          return;
        }
        setError(result.error);
      }
      // Em caso de sucesso, o <Navigate> acima assume o redirect por papel.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-k-bg text-k-text">
      <aside className="hidden lg:block border-r border-k-ghost">
        <AuthBrandPanel
          contentKey="login"
          eyebrow="Painel do Personal"
          title={
            <>
              Treine mais alunos.
              <br />
              <span className="text-k-text-muted">Com menos esforço.</span>
            </>
          }
          highlights={HIGHLIGHTS}
        />
      </aside>

      {/* Formulário */}
      <main className="flex items-center justify-center px-6 py-12">
        <motion.form
          onSubmit={handleSubmit}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="w-full max-w-[380px] flex flex-col"
        >
          <motion.div variants={riseItem} className="lg:hidden mb-10">
            <KineticLogo size={20} />
          </motion.div>

          <motion.div variants={riseItem}>
            <h1 className="font-display font-bold text-[28px] leading-tight tracking-tight">Bem-vindo de volta</h1>
            <p className="mt-1.5 text-sm text-k-text-dim">Entre com seu e-mail para acessar o painel.</p>
          </motion.div>

          <motion.div variants={riseItem} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
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
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-k-text-soft">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>
          </motion.div>

          {emailConfirmed && !error && (
            <div
              className="mt-5 flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-k-success/10 border border-k-success/30 text-k-success text-sm"
              role="status"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-k-success shrink-0" />
              <span>E-mail confirmado. Agora é só entrar.</span>
            </div>
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

          <motion.div variants={riseItem} className="mt-7">
            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="group w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-k-primary text-k-on-primary font-semibold text-sm transition-[background-color,box-shadow,transform] hover:bg-k-primary-deep hover:shadow-[0_8px_24px_-8px_rgba(0,229,255,0.55)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-k-primary/30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar no painel
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <p className="mt-6 text-center text-sm text-k-text-dim">
              Ainda não tem conta?{' '}
              <Link to="/register" className="font-semibold text-k-primary hover:underline underline-offset-4">
                Cadastre-se
              </Link>
            </p>
          </motion.div>

          <motion.div
            variants={riseItem}
            className="mt-10 pt-6 border-t border-k-ghost flex items-start gap-3 text-xs text-k-text-muted leading-relaxed"
          >
            <Smartphone className="w-4 h-4 shrink-0 mt-px" />
            <span>
              Acesso exclusivo para personal trainers. Alunos usam o aplicativo mobile Kinetic.
            </span>
          </motion.div>
        </motion.form>
      </main>
    </div>
  );
}
