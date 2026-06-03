// Kinetic — Auth Flow (3 screens)
// Welcome → Login → Returning User
// Follows DESIGN.md tokens + all P0/P1/P2 fixes from parecer

// ─── Tokens ────────────────────────────────────────────────────
const A = {
  bg: '#131313',
  s1: '#1c1b1b',
  s2: '#2a2a2a',
  s3: '#353534',
  primary: '#00E5FF',
  primaryDeep: '#00daf3',
  primaryDim: 'rgba(0,229,255,0.08)',
  primarySoft: 'rgba(0,229,255,0.22)',
  primaryGrad: 'linear-gradient(45deg, #00E5FF 0%, #00daf3 100%)',
  secondary: '#98d0da',
  gold: '#ffeac0',
  error: '#ffb4ab',
  errorDim: 'rgba(255,180,171,0.14)',
  text: '#f5f6f7',
  text2: 'rgba(245,246,247,0.60)',
  text3: 'rgba(245,246,247,0.34)',
  ghost: 'rgba(255,255,255,0.07)',
  ghostHi: 'rgba(255,255,255,0.13)',
  font: 'Inter, -apple-system, system-ui, sans-serif',
};

// ─── Shared atoms ───────────────────────────────────────────────
function PrimaryCTA({ children, onClick, loading, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      all: 'unset', cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
      width: '100%', boxSizing: 'border-box',
      padding: '17px 20px', borderRadius: 16,
      background: (disabled || loading) ? A.s2 : A.primaryGrad,
      color: (disabled || loading) ? A.text3 : '#00161a',
      fontFamily: A.font, fontWeight: 800, fontSize: 16, letterSpacing: 0.2,
      textAlign: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: (disabled || loading) ? 'none'
        : `0 6px 32px ${A.primarySoft}, 0 0 0 1px rgba(0,229,255,0.22) inset`,
      transition: 'all 200ms ease',
      ...style,
    }}>
      {loading ? <Spinner color="#00161a"/> : children}
    </button>
  );
}

function SecondaryCTA({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      width: '100%', boxSizing: 'border-box',
      padding: '17px 20px', borderRadius: 16,
      background: 'transparent',
      color: A.text,
      fontFamily: A.font, fontWeight: 700, fontSize: 16, letterSpacing: 0.1,
      textAlign: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: `0 0 0 1.5px ${A.ghostHi} inset`,
      transition: 'all 180ms ease',
      ...style,
    }}>{children}</button>
  );
}

function Spinner({ color = A.primary, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin 700ms linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2.5"
        strokeDasharray="40 20" strokeLinecap="round"/>
    </svg>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: A.ghost }}/>
      <span style={{ fontFamily: A.font, fontSize: 12, color: A.text3, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: A.ghost }}/>
    </div>
  );
}

function SocialBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      flex: 1, padding: '13px 12px',
      borderRadius: 14,
      background: A.s1,
      boxShadow: `0 0 0 1px ${A.ghostHi} inset`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      fontFamily: A.font, fontSize: 13, fontWeight: 600, color: A.text,
      transition: 'all 140ms ease',
    }}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Apple + Google inline SVG icons
const AppleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const GoogleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ─── Input field ────────────────────────────────────────────────
function InputField({ label, type, value, onChange, placeholder, icon, right, error, autoComplete }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: A.font, fontSize: 11, fontWeight: 700,
            letterSpacing: 0.8, textTransform: 'uppercase',
            color: error ? A.error : (focused ? A.primary : A.text2),
            transition: 'color 160ms',
          }}>{label}</span>
          {right}
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: focused ? A.s2 : A.s1,
        borderRadius: 14,
        boxShadow: error
          ? `0 0 0 1.5px ${A.error} inset, 0 0 16px ${A.errorDim}`
          : focused
            ? `0 0 0 1.5px ${A.primary} inset, 0 0 20px ${A.primaryDim}`
            : `0 0 0 1px ${A.ghostHi} inset`,
        padding: '0 14px',
        transition: 'all 160ms ease',
      }}>
        <span style={{ color: error ? A.error : (focused ? A.primary : A.text3), flexShrink: 0, transition: 'color 160ms', display: 'flex' }}>
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            all: 'unset', flex: 1,
            fontFamily: A.font, fontSize: 15, color: A.text,
            padding: '15px 0',
          }}
        />
        {right && !label && right}
      </div>
      {error && (
        <div style={{
          fontFamily: A.font, fontSize: 12, color: A.error,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Icons (line, 18px) ─────────────────────────────────────────
const Ic = {
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 7l10 7 10-7"/></svg>,
  lock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>,
  eye: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  face: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3H5a2 2 0 00-2 2v2M17 3h2a2 2 0 012 2v2M7 21H5a2 2 0 01-2-2v-2M17 21h2a2 2 0 002-2v-2"/><circle cx="9" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none"/><path d="M9 15s1 1.5 3 1.5 3-1.5 3-1.5"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>,
  bolt: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>,
};

// ─────────────────────────────────────────────────────────────────
// SCREEN 1 — Welcome (primeira abertura, novo usuário)
// ─────────────────────────────────────────────────────────────────
function ScreenWelcome({ onLogin, onRegister }) {
  const features = [
    'Treinos gerados por IA, calibrados para você',
    'Progressão automática de carga e volume',
    'Anamnese profunda para resultados reais',
  ];

  return (
    <div style={{
      height: '100%', background: A.bg,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow orb */}
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 340, height: 340, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(0,229,255,0.13) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>

      {/* Top area — logo + hero */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 32px 20px',
        textAlign: 'center',
      }}>
        {/* Logomark placeholder */}
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: A.primaryGrad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          boxShadow: `0 16px 48px ${A.primarySoft}`,
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00161a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
          </svg>
        </div>

        {/* Wordmark */}
        <div style={{
          fontFamily: A.font, fontWeight: 900, fontSize: 42,
          color: A.text, letterSpacing: -2.5, lineHeight: 1,
          marginBottom: 10,
        }}>
          KINETIC
        </div>
        <div style={{
          fontFamily: A.font, fontSize: 15, color: A.text2,
          lineHeight: 1.5, maxWidth: 260, letterSpacing: -0.2,
        }}>
          O protocolo de treino que evolui com você.
        </div>

        {/* Feature list */}
        <div style={{
          marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12,
          alignItems: 'flex-start', width: '100%', maxWidth: 300,
        }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 8, flexShrink: 0,
                background: A.primaryDim,
                border: `1px solid rgba(0,229,255,0.2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: A.primary,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </div>
              <span style={{ fontFamily: A.font, fontSize: 13, color: A.text2, lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTAs */}
      <div style={{ padding: '0 24px 44px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PrimaryCTA onClick={onRegister}>
          {Ic.bolt} Criar conta grátis
        </PrimaryCTA>
        <SecondaryCTA onClick={onLogin}>
          Já tenho conta · Entrar
        </SecondaryCTA>
        <p style={{
          margin: '4px 0 0', fontFamily: A.font, fontSize: 11, color: A.text3,
          textAlign: 'center', lineHeight: 1.5,
        }}>
          Ao criar conta, você concorda com os{' '}
          <span style={{ color: A.text2, textDecoration: 'underline' }}>Termos de Uso</span>
          {' '}e{' '}
          <span style={{ color: A.text2, textDecoration: 'underline' }}>Privacidade</span>.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SCREEN 2 — Login (email + senha, social)
// ─────────────────────────────────────────────────────────────────
function ScreenLogin({ onBack, onSuccess, onRegister }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const validate = () => {
    const e = {};
    if (!email.includes('@')) e.email = 'Digite um e-mail válido.';
    if (password.length < 6) e.password = 'Senha deve ter pelo menos 6 caracteres.';
    return e;
  };

  const handleLogin = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(); }, 2000);
  };

  const eyeBtn = (
    <button onClick={() => setShowPw(!showPw)} style={{
      all: 'unset', cursor: 'pointer', color: A.text3,
      display: 'flex', alignItems: 'center', padding: '4px',
    }} aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}>
      {showPw ? Ic.eyeOff : Ic.eye}
    </button>
  );

  const canSubmit = email.length > 0 && password.length > 0;

  return (
    <div style={{
      height: '100%', background: A.bg,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Nav */}
      <div style={{ padding: '54px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} aria-label="Voltar" style={{
          all: 'unset', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 12,
          background: A.s1, color: A.text2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 1px ${A.ghostHi} inset`,
        }}>{Ic.back}</button>
        <span style={{ fontFamily: A.font, fontSize: 12, color: A.text3 }}>Bem-vindo de volta</span>
      </div>

      {/* Scroll content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 0' }} className="kinetic-scroll">
        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            margin: 0, fontFamily: A.font, fontWeight: 800,
            fontSize: 30, letterSpacing: -1, color: A.text, lineHeight: 1.1,
          }}>Entrar na<br/><span style={{ color: A.primary }}>Kinetic</span></h1>
        </div>

        {/* Social login — primary */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <SocialBtn icon={AppleIcon} label="Apple" onClick={() => {}}/>
          <SocialBtn icon={GoogleIcon} label="Google" onClick={() => {}}/>
        </div>

        <Divider label="ou com e-mail"/>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
          <InputField
            label="E-mail"
            type="email"
            value={email}
            onChange={v => { setEmail(v); setErrors(p => ({ ...p, email: null })); }}
            placeholder="nome@email.com"
            icon={Ic.mail}
            autoComplete="email"
            error={errors.email}
          />
          <InputField
            label="Senha"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={v => { setPassword(v); setErrors(p => ({ ...p, password: null })); }}
            placeholder="••••••••"
            icon={Ic.lock}
            autoComplete="current-password"
            error={errors.password}
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => {}} style={{
                  all: 'unset', cursor: 'pointer',
                  fontFamily: A.font, fontSize: 12, fontWeight: 600, color: A.primary,
                  whiteSpace: 'nowrap',
                }}>Esqueci a senha</button>
              </div>
            }
          />
        </div>

        {/* Show password toggle below fields */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <button onClick={() => setShowPw(!showPw)} style={{
            all: 'unset', cursor: 'pointer',
            width: 20, height: 20, borderRadius: 6,
            background: showPw ? A.primary : A.s2,
            boxShadow: showPw ? 'none' : `0 0 0 1px ${A.ghostHi} inset`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 160ms ease',
          }}>
            {showPw && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00161a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>}
          </button>
          <span style={{ fontFamily: A.font, fontSize: 12, color: A.text2 }}>Mostrar senha</span>
        </div>

        <div style={{ height: 32 }}/>
      </div>

      {/* Sticky footer */}
      <div style={{
        padding: '12px 24px 38px',
        background: `linear-gradient(180deg, rgba(19,19,19,0) 0%, ${A.bg} 24%)`,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <PrimaryCTA onClick={handleLogin} loading={loading} disabled={!canSubmit}>
          {!loading && 'Entrar'}
        </PrimaryCTA>
        <div style={{ textAlign: 'center', fontFamily: A.font, fontSize: 13, color: A.text2 }}>
          Não tem conta?{' '}
          <button onClick={onRegister} style={{
            all: 'unset', cursor: 'pointer',
            color: A.primary, fontWeight: 700,
          }}>Criar conta</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SCREEN 3 — Returning User (biometria + conta salva)
// ─────────────────────────────────────────────────────────────────
const FAKE_USER = {
  name: 'Rafael Mendes',
  email: 'rafael@email.com',
  avatar: 'RM',
  streak: 18,
};

function ScreenReturning({ onSuccess, onSwitchAccount }) {
  const [biometricState, setBiometricState] = React.useState('idle'); // idle | scanning | success | error
  const [showFallback, setShowFallback] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const triggerBiometric = () => {
    setBiometricState('scanning');
    setTimeout(() => {
      setBiometricState('success');
      setTimeout(onSuccess, 700);
    }, 1800);
  };

  const handleFallback = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(); }, 1600);
  };

  const ringColor = biometricState === 'success' ? A.primary
    : biometricState === 'error' ? A.error
    : biometricState === 'scanning' ? A.primary
    : A.ghostHi;

  return (
    <div style={{
      height: '100%', background: A.bg,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', bottom: -100, left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: `radial-gradient(circle, ${biometricState === 'success'
          ? 'rgba(0,229,255,0.18)'
          : biometricState === 'scanning'
            ? 'rgba(0,229,255,0.10)'
            : 'rgba(0,229,255,0.05)'} 0%, transparent 70%)`,
        transition: 'all 400ms ease',
        pointerEvents: 'none',
      }}/>

      {/* Top: account info */}
      <div style={{
        padding: '60px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: A.font, fontSize: 11, fontWeight: 700,
          letterSpacing: 0.8, textTransform: 'uppercase', color: A.text3,
        }}>Conta ativa</div>
        <button onClick={onSwitchAccount} style={{
          all: 'unset', cursor: 'pointer',
          fontFamily: A.font, fontSize: 12, fontWeight: 600, color: A.text2,
        }}>Trocar conta</button>
      </div>

      {/* User card */}
      <div style={{
        margin: '12px 24px 0',
        padding: '14px 16px',
        background: A.s1, borderRadius: 18,
        boxShadow: `0 0 0 1px ${A.ghostHi} inset`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {/* Avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: 16,
          background: A.primaryGrad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: A.font, fontWeight: 800, fontSize: 16, color: '#001a1f',
          flexShrink: 0,
        }}>{FAKE_USER.avatar}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: A.font, fontWeight: 700, fontSize: 16, color: A.text, letterSpacing: -0.3 }}>{FAKE_USER.name}</div>
          <div style={{ fontFamily: A.font, fontSize: 12, color: A.text2, marginTop: 2 }}>{FAKE_USER.email}</div>
        </div>
        {/* Streak badge */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '6px 10px', borderRadius: 10,
          background: 'rgba(255,234,192,0.08)',
          border: '1px solid rgba(255,234,192,0.15)',
        }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontFamily: A.font, fontSize: 11, fontWeight: 700, color: A.gold }}>{FAKE_USER.streak}</span>
        </div>
      </div>

      {/* Biometric CTA area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px',
      }}>
        {/* Ring + icon */}
        <div
          onClick={biometricState === 'idle' ? triggerBiometric : undefined}
          style={{
            position: 'relative', width: 130, height: 130,
            cursor: biometricState === 'idle' ? 'pointer' : 'default',
          }}
        >
          {/* Animated ring */}
          <svg width="130" height="130" viewBox="0 0 130 130" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={A.primary}/>
                <stop offset="100%" stopColor={A.primaryDeep}/>
              </linearGradient>
            </defs>
            <circle cx="65" cy="65" r="56" fill="none" stroke={A.ghost} strokeWidth="4"/>
            {biometricState !== 'idle' && (
              <circle cx="65" cy="65" r="56" fill="none" stroke="url(#rg)" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={biometricState === 'success' ? '352 0' : '120 232'}
                transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dasharray 600ms ease', animation: biometricState === 'scanning' ? 'rotateRing 1000ms linear infinite' : 'none' }}
              />
            )}
          </svg>
          <style>{`
            @keyframes rotateRing {
              to { transform: rotate(360deg); transform-origin: 65px 65px; }
            }
          `}</style>

          {/* Center face icon */}
          <div style={{
            position: 'absolute', inset: 14,
            borderRadius: '50%',
            background: biometricState === 'success' ? A.primaryGrad : A.s1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: biometricState === 'success' ? '#001a1f' : A.primary,
            boxShadow: biometricState !== 'idle'
              ? `0 0 40px ${A.primarySoft}`
              : 'none',
            transition: 'all 300ms ease',
          }}>
            {biometricState === 'success'
              ? <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              : Ic.face
            }
          </div>
        </div>

        {/* State label */}
        <div style={{
          marginTop: 20, textAlign: 'center',
          fontFamily: A.font, fontWeight: 700, fontSize: 18,
          color: biometricState === 'success' ? A.primary : A.text,
          letterSpacing: -0.4, transition: 'color 200ms',
        }}>
          {biometricState === 'idle' && 'Entrar com Face ID'}
          {biometricState === 'scanning' && 'Verificando…'}
          {biometricState === 'success' && 'Identidade confirmada'}
          {biometricState === 'error' && 'Não reconhecido'}
        </div>
        <div style={{
          marginTop: 6, fontFamily: A.font, fontSize: 13, color: A.text2,
          textAlign: 'center',
        }}>
          {biometricState === 'idle' && 'Toque no ícone para autenticar'}
          {biometricState === 'scanning' && 'Olhe para o dispositivo'}
          {biometricState === 'success' && 'Abrindo seu protocolo…'}
          {biometricState === 'error' && 'Tente novamente ou use sua senha'}
        </div>

        {/* Fallback link */}
        {(biometricState === 'idle' || biometricState === 'error') && (
          <button onClick={() => setShowFallback(!showFallback)} style={{
            all: 'unset', cursor: 'pointer', marginTop: 28,
            fontFamily: A.font, fontSize: 13, color: A.text2, fontWeight: 600,
            padding: '10px 20px', borderRadius: 12,
            background: showFallback ? A.s1 : 'transparent',
            transition: 'all 160ms',
          }}>
            {showFallback ? 'Ocultar' : 'Usar e-mail e senha'}
          </button>
        )}

        {/* Fallback form — inline, collapses */}
        {showFallback && (
          <div style={{
            width: '100%', marginTop: 16,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <InputField
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="Senha"
              icon={Ic.lock}
              autoComplete="current-password"
              right={
                <button onClick={() => setShowPw(!showPw)} style={{
                  all: 'unset', cursor: 'pointer', color: A.text3,
                  display: 'flex', padding: 4,
                }}>{showPw ? Ic.eyeOff : Ic.eye}</button>
              }
            />
            <PrimaryCTA onClick={handleFallback} loading={loading} disabled={password.length < 6}>
              {!loading && 'Entrar'}
            </PrimaryCTA>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SCREEN 4 — Post-login success flash
// ─────────────────────────────────────────────────────────────────
function ScreenSuccess({ name, onReset }) {
  React.useEffect(() => {
    const t = setTimeout(onReset, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      height: '100%', background: A.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 32px', textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 26,
        background: A.primaryGrad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: `0 20px 60px ${A.primarySoft}`,
        animation: 'popIn 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
      }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#001a1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
      </div>
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{ fontFamily: A.font, fontWeight: 800, fontSize: 26, color: A.text, letterSpacing: -0.8 }}>
        Bem-vindo{name ? `, ${name.split(' ')[0]}` : ''}!
      </div>
      <div style={{ fontFamily: A.font, fontSize: 14, color: A.text2, marginTop: 8, lineHeight: 1.5 }}>
        Seu protocolo está pronto.
      </div>
      <button onClick={onReset} style={{
        all: 'unset', cursor: 'pointer', marginTop: 48,
        fontFamily: A.font, fontSize: 12, color: A.text3,
      }}>← Voltar ao início (demo)</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Root — routes between screens
// ─────────────────────────────────────────────────────────────────
function AuthFlow({ startAt }) {
  const [screen, setScreen] = React.useState(startAt || 'welcome');
  const [successName, setSuccessName] = React.useState('');

  const goSuccess = (name) => { setSuccessName(name || ''); setScreen('success'); };

  return (
    <>
      {screen === 'welcome' && (
        <ScreenWelcome
          onLogin={() => setScreen('login')}
          onRegister={() => setScreen('returning')}
        />
      )}
      {screen === 'login' && (
        <ScreenLogin
          onBack={() => setScreen('welcome')}
          onSuccess={() => goSuccess('')}
          onRegister={() => setScreen('welcome')}
        />
      )}
      {screen === 'returning' && (
        <ScreenReturning
          onSuccess={() => goSuccess(FAKE_USER.name)}
          onSwitchAccount={() => setScreen('login')}
        />
      )}
      {screen === 'success' && (
        <ScreenSuccess name={successName} onReset={() => setScreen('welcome')}/>
      )}
    </>
  );
}

window.AuthFlow = AuthFlow;
