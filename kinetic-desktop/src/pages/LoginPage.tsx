import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, Activity } from 'lucide-react';

export default function LoginPage() {
  const { signIn, isLoggedIn, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoadingAuth && isLoggedIn) return <Navigate to="/students" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn({ email, password });
      if (result.success) {
        navigate('/students', { replace: true });
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative h-screen flex items-center justify-center bg-k-bg text-k-text overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-k-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-k-primary/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-[420px] mx-4 z-10">
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-6 bg-k-surface1/85 backdrop-blur-xl border border-k-ghost rounded-2xl p-8 shadow-2xl hover:border-k-ghost-hi transition-colors duration-300"
        >
          {/* Header/Brand Section */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-k-primary to-k-primary-deep text-k-on-primary shadow-[0_0_20px_rgba(0,229,255,0.35)]">
              <Activity className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-k-text-dim bg-clip-text text-transparent">
                Kinetic
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-k-primary mt-1">
                Painel do Personal
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Email Field */}
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
                  autoFocus
                  required
                  className="w-full pl-12 pr-4 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-k-text-dim uppercase tracking-wider">
                Senha
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-k-text-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-k-surface2/60 border border-k-ghost rounded-xl outline-none focus:border-k-primary focus:ring-1 focus:ring-k-primary/30 transition-all text-sm placeholder:text-k-text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute right-4 text-k-text-muted hover:text-k-primary focus-visible:text-k-primary transition-colors outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-k-error/10 border border-k-error/30 text-k-error text-xs leading-relaxed"
              role="alert"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-k-error shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full mt-2 py-3.5 rounded-xl bg-k-primary hover:bg-k-primary-deep text-k-on-primary font-extrabold text-sm tracking-wide shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? 'Entrando…' : 'Entrar no Painel'}
          </button>

          {/* Footer Note */}
          <p className="text-[11px] text-k-text-muted text-center leading-normal mt-2">
            Acesso exclusivo para personal trainers.<br />
            Alunos devem utilizar o aplicativo mobile Kinetic.
          </p>
        </form>
      </div>
    </div>
  );
}
