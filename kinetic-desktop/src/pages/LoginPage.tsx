import { useState, type CSSProperties, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { KINETIC } from '../theme/kinetic';

/** Login do painel do personal — barra papéis ≠ PERSONAL com mensagem clara. */
export default function LoginPage() {
  const { signIn, isLoggedIn, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div style={st.page}>
      <form style={st.card} onSubmit={handleSubmit}>
        <div style={st.brandRow}>
          <span style={st.brandMark}>K</span>
          <div>
            <h1 style={st.title}>Kinetic</h1>
            <p style={st.subtitle}>Painel do Personal</p>
          </div>
        </div>

        <label style={st.label} htmlFor="email">
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
        />

        <label style={st.label} htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div style={st.errorBox} role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            ...st.submitBtn,
            opacity: submitting || !email || !password ? 0.5 : 1,
          }}
          disabled={submitting || !email || !password}
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>

        <p style={st.footerNote}>
          Acesso exclusivo para personal trainers. Alunos usam o app Kinetic no
          celular.
        </p>
      </form>
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  page: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `radial-gradient(1200px 600px at 50% -10%, ${KINETIC.primaryDim}, transparent), ${KINETIC.bg}`,
  },
  card: {
    width: 380,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: KINETIC.surface1,
    border: `1px solid ${KINETIC.ghost}`,
    borderRadius: 20,
    padding: '32px 28px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: KINETIC.primary,
    color: '#001a1f',
    fontWeight: 900,
    fontSize: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: KINETIC.textMuted,
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: KINETIC.textDim,
    marginTop: 8,
  },
  errorBox: {
    marginTop: 10,
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(255,68,68,0.10)',
    border: '1px solid rgba(255,68,68,0.35)',
    color: '#ff8a8a',
    fontSize: 13,
    lineHeight: 1.4,
  },
  submitBtn: {
    marginTop: 16,
    padding: '12px 0',
    borderRadius: 12,
    background: KINETIC.primary,
    color: '#001a1f',
    fontWeight: 800,
    fontSize: 15,
  },
  footerNote: {
    marginTop: 14,
    fontSize: 11.5,
    color: KINETIC.textMuted,
    textAlign: 'center',
    lineHeight: 1.5,
  },
};
