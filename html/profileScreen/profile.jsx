// profile.jsx — Kinetic · Tela de Perfil
// Organizada por prioridade: identidade → protocolo de treino → conta → prefs → comunidade → dados → suporte → sair

// ─── Tokens ───────────────────────────────────────────────────
const PF = {
  bg: '#131313', s1: '#1c1b1b', s2: '#2a2a2a', s3: '#353534',
  primary: '#00E5FF', primaryDeep: '#00daf3',
  primaryDim: 'rgba(0,229,255,0.10)', primarySoft: 'rgba(0,229,255,0.20)',
  primaryGrad: 'linear-gradient(45deg, #00E5FF 0%, #00daf3 100%)',
  text: '#f5f6f7', text2: 'rgba(245,246,247,0.62)', text3: 'rgba(245,246,247,0.36)',
  ghost: 'rgba(255,255,255,0.08)', ghostHi: 'rgba(255,255,255,0.15)',
  success: '#4ade80', warn: '#f5b945',
  danger: '#ff6b7a', dangerDim: 'rgba(255,107,122,0.12)',
  gold: '#F5C518',
  font: 'Inter, -apple-system, system-ui, sans-serif',
};

// ─── Mock user ────────────────────────────────────────────────
const USER = {
  name: 'Gabriel Souza',
  email: 'gabriel@kinetic.app',
  memberSince: 'Membro desde Abr 2025',
  initial: 'G',
  streak: 3,
  totalWorkouts: 47,
  goal: 'mass',
  goalLabel: 'Ganho de Massa',
  age: 25, weight: 78, height: 175,
  level: 'Intermediário',
  daysPerWeek: 4,
  anamneseQuestions: 12,
  anamneseAnswered: 10,
  plan: 'free', // 'free' | 'pro'
};

// ─── Atoms ────────────────────────────────────────────────────
function SectionTitle({ children, sub }) {
  return (
    <div style={{ padding: '0 4px 8px' }}>
      <div style={{
        fontFamily: PF.font, fontSize: 11, fontWeight: 700,
        color: PF.text3, letterSpacing: 1.4, textTransform: 'uppercase',
      }}>{children}</div>
      {sub && (
        <div style={{ fontFamily: PF.font, fontSize: 11, color: PF.text3, marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

function RowGroup({ children }) {
  // Wraps rows with rounded corners and tonal separation (no 1px dividers per DS)
  const arr = React.Children.toArray(children);
  return (
    <div style={{
      background: PF.s1, borderRadius: 18, overflow: 'hidden',
    }}>
      {arr.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div style={{ height: 1, background: PF.ghost, margin: '0 16px' }}/>}
          {c}
        </React.Fragment>
      ))}
    </div>
  );
}

function Row({ icon, label, value, sub, onClick, accent, danger, badge, rightLabel }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: onClick ? 'pointer' : 'default',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 16px', width: '100%', boxSizing: 'border-box',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: danger ? PF.dangerDim : (accent ? PF.primaryDim : PF.s2),
        color: danger ? PF.danger : (accent ? PF.primary : PF.text2),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>

      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <div style={{
          fontFamily: PF.font, fontSize: 14, fontWeight: 600,
          color: danger ? PF.danger : PF.text, letterSpacing: -0.1,
        }}>{label}</div>
        {sub && (
          <div style={{
            fontFamily: PF.font, fontSize: 11, color: PF.text2, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{sub}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {badge && (
          <span style={{
            padding: '3px 8px', borderRadius: 999,
            background: badge.bg || PF.primaryDim,
            color: badge.color || PF.primary,
            fontFamily: PF.font, fontSize: 10, fontWeight: 700,
            letterSpacing: 0.3, textTransform: 'uppercase',
          }}>{badge.text}</span>
        )}
        {value && (
          <span style={{
            fontFamily: PF.font, fontSize: 13, color: PF.text2, fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
          }}>{value}</span>
        )}
        {rightLabel && (
          <span style={{ fontFamily: PF.font, fontSize: 12, color: PF.text3 }}>{rightLabel}</span>
        )}
        {onClick && !danger && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PF.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// Tiny icon set
const Ic = {
  pencil: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  ruler: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3L3 21M14 4l6 6M10 8l6 6M6 12l6 6"/></svg>,
  med: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  level: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h4V10H3zM10 20h4V4h-4zM17 20h4v-7h-4z"/></svg>,
  sparkle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>,
  lock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  crown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  scale: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M5 6l2 13a2 2 0 002 2h6a2 2 0 002-2l2-13M10 11v6M14 11v6"/></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  help: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>,
  star: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>,
  info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>,
};

// ─── Top bar ──────────────────────────────────────────────────
function PFTopBar() {
  return (
    <div style={{
      padding: '56px 20px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: PF.bg, position: 'sticky', top: 0, zIndex: 10,
    }}>
      <span style={{
        fontFamily: PF.font, fontSize: 22, fontWeight: 800, color: PF.text, letterSpacing: -0.5,
      }}>Perfil</span>
      <button aria-label="Configurações avançadas" style={{
        all: 'unset', cursor: 'pointer',
        width: 36, height: 36, borderRadius: 11,
        background: PF.s1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: PF.text2,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>
    </div>
  );
}

// ─── Identity Hero ────────────────────────────────────────────
function IdentityHero({ user }) {
  return (
    <div style={{
      margin: '0 16px', padding: '20px',
      background: PF.s1, borderRadius: 22,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Avatar (initial) */}
        <div style={{
          width: 64, height: 64, borderRadius: 18, flexShrink: 0,
          background: PF.primaryGrad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: PF.font, fontWeight: 800, fontSize: 28, color: '#001a1f',
          letterSpacing: -0.5,
          boxShadow: `0 6px 22px ${PF.primarySoft}`,
        }}>{user.initial}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: PF.font, fontSize: 18, fontWeight: 800,
            color: PF.text, letterSpacing: -0.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{user.name}</div>
          <div style={{
            fontFamily: PF.font, fontSize: 12, color: PF.text2, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{user.email}</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
            padding: '3px 8px', borderRadius: 999,
            background: PF.ghost,
            fontFamily: PF.font, fontSize: 10, color: PF.text3, fontWeight: 600,
            letterSpacing: 0.3,
          }}>{user.memberSince}</div>
        </div>

        <button aria-label="Editar perfil" style={{
          all: 'unset', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: PF.primaryDim,
          color: PF.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${PF.primarySoft}`,
        }}>{Ic.pencil}</button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
        {[
          { v: user.streak, u: 'dias seguidos', color: PF.gold },
          { v: user.totalWorkouts, u: 'treinos no total', color: PF.text },
          { v: user.goalLabel.split(' ')[0], u: user.goalLabel.split(' ').slice(1).join(' '), color: PF.primary, isText: true },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '4px 8px',
            borderLeft: i > 0 ? `1px solid ${PF.ghost}` : 'none',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: PF.font,
              fontSize: s.isText ? 14 : 22,
              fontWeight: 800,
              color: s.color, letterSpacing: -0.4,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}>{s.v}</div>
            <div style={{
              fontFamily: PF.font, fontSize: 10, color: PF.text3,
              marginTop: 4, letterSpacing: 0.3,
            }}>{s.u}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Protocolo de Treino (core for fitness app) ───────────────
function ProtocolSection({ user }) {
  const anamComplete = user.anamneseAnswered === user.anamneseQuestions;
  return (
    <div>
      <SectionTitle sub="O que alimenta sua IA">Protocolo de Treino</SectionTitle>
      <RowGroup>
        <Row icon={Ic.target} label="Objetivo" value={user.goalLabel} onClick={() => {}} accent/>
        <Row icon={Ic.scale} label="Métricas" value={`${user.weight}kg · ${user.height}cm · ${user.age}a`} onClick={() => {}}/>
        <Row icon={Ic.level} label="Nível de experiência" value={user.level} onClick={() => {}}/>
        <Row icon={Ic.calendar} label="Frequência semanal" value={`${user.daysPerWeek} dias`} onClick={() => {}}/>
        <Row
          icon={Ic.med}
          label="Anamnese"
          sub={anamComplete ? 'Lesões, equipamento, restrições' : `${user.anamneseAnswered} de ${user.anamneseQuestions} respondidas`}
          onClick={() => {}}
          badge={anamComplete
            ? { text: 'completa', color: PF.success, bg: 'rgba(74,222,128,0.14)' }
            : { text: 'pendente', color: PF.warn, bg: 'rgba(245,185,69,0.14)' }
          }
        />
      </RowGroup>

      {/* Regenerate CTA */}
      <button style={{
        all: 'unset', cursor: 'pointer',
        marginTop: 10, width: '100%', boxSizing: 'border-box',
        padding: '13px 16px', borderRadius: 14,
        background: PF.primaryDim,
        border: `1px solid ${PF.primarySoft}`,
        color: PF.primary,
        fontFamily: PF.font, fontWeight: 700, fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {Ic.sparkle}
        Regenerar treino com IA
      </button>
      <div style={{
        fontFamily: PF.font, fontSize: 10, color: PF.text3, marginTop: 6,
        textAlign: 'center',
      }}>
        Recria seu plano baseado nos dados acima
      </div>
    </div>
  );
}

// ─── Conta ────────────────────────────────────────────────────
function AccountSection({ user, onLogout }) {
  const isPro = user.plan === 'pro';
  return (
    <div>
      <SectionTitle>Conta</SectionTitle>
      <RowGroup>
        <Row icon={Ic.mail} label="Email" value={user.email} onClick={() => {}}/>
        <Row icon={Ic.lock} label="Alterar senha" onClick={() => {}}/>
        <Row
          icon={Ic.crown}
          label={isPro ? 'Plano Premium' : 'Plano Gratuito'}
          sub={isPro ? 'Renovação em 12 mai 2026' : 'Treinos com IA limitados a 3/mês'}
          onClick={() => {}}
          badge={isPro
            ? { text: 'PRO', color: PF.gold, bg: 'rgba(245,197,24,0.14)' }
            : { text: 'upgrade', color: PF.primary, bg: PF.primaryDim }
          }
        />
      </RowGroup>
    </div>
  );
}

// ─── Preferências ─────────────────────────────────────────────
function PreferencesSection() {
  return (
    <div>
      <SectionTitle>Preferências</SectionTitle>
      <RowGroup>
        <Row icon={Ic.bell} label="Notificações" sub="Treino, ranking, descanso" onClick={() => {}}/>
        <Row icon={Ic.scale} label="Unidades" value="kg · cm" onClick={() => {}}/>
        <Row icon={Ic.globe} label="Idioma" value="Português (BR)" onClick={() => {}}/>
      </RowGroup>
    </div>
  );
}

// ─── Comunidade ───────────────────────────────────────────────
function CommunitySection() {
  return (
    <div>
      <SectionTitle>Comunidade</SectionTitle>
      <RowGroup>
        <Row icon={Ic.eye} label="Visibilidade no ranking" value="Público" onClick={() => {}}/>
        <Row icon={Ic.users} label="Amigos" value="14" onClick={() => {}}/>
      </RowGroup>
    </div>
  );
}

// ─── Dados & Privacidade ──────────────────────────────────────
function DataSection() {
  return (
    <div>
      <SectionTitle>Dados & Privacidade</SectionTitle>
      <RowGroup>
        <Row icon={Ic.download} label="Exportar meus dados" sub="Treinos, métricas, histórico" onClick={() => {}}/>
        <Row icon={Ic.shield} label="Política de privacidade" onClick={() => {}}/>
      </RowGroup>
    </div>
  );
}

// ─── Suporte & Sobre ──────────────────────────────────────────
function SupportSection() {
  return (
    <div>
      <SectionTitle>Suporte</SectionTitle>
      <RowGroup>
        <Row icon={Ic.help} label="Central de ajuda" onClick={() => {}}/>
        <Row icon={Ic.star} label="Avaliar o Kinetic" onClick={() => {}}/>
        <Row icon={Ic.info} label="Sobre" sub="Versão 1.4.2 · Build 248" onClick={() => {}}/>
      </RowGroup>
    </div>
  );
}

// ─── Sair (destructive) ───────────────────────────────────────
function LogoutSection({ onLogout, onDelete }) {
  return (
    <div>
      <RowGroup>
        <Row icon={Ic.logout} label="Sair da conta" onClick={onLogout} danger/>
      </RowGroup>
      <button onClick={onDelete} style={{
        all: 'unset', cursor: 'pointer',
        marginTop: 14, width: '100%',
        textAlign: 'center', padding: '10px 0',
        fontFamily: PF.font, fontSize: 12, color: PF.text3, fontWeight: 500,
        textDecoration: 'underline', textUnderlineOffset: 3,
      }}>Excluir minha conta</button>
    </div>
  );
}

// ─── Logout confirmation sheet ────────────────────────────────
function LogoutSheet({ open, onCancel, onConfirm }) {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 200ms ease',
      }} onClick={onCancel}/>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 101,
        background: PF.s1, borderRadius: '24px 24px 0 0',
        padding: '14px 20px 28px',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* drag handle */}
        <div style={{
          width: 38, height: 4, borderRadius: 99,
          background: PF.ghostHi, margin: '0 auto 18px',
        }}/>

        <div style={{
          width: 44, height: 44, borderRadius: 14, margin: '0 auto 12px',
          background: PF.dangerDim, color: PF.danger,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Ic.logout}</div>

        <div style={{
          fontFamily: PF.font, fontSize: 18, fontWeight: 800, color: PF.text,
          textAlign: 'center', letterSpacing: -0.3,
        }}>Sair da conta?</div>
        <div style={{
          fontFamily: PF.font, fontSize: 13, color: PF.text2,
          textAlign: 'center', marginTop: 6, lineHeight: 1.5,
        }}>
          Você precisará fazer login novamente para acessar seus treinos e ranking.
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onCancel} style={{
            all: 'unset', flex: 1, cursor: 'pointer',
            padding: '14px 0', borderRadius: 14, textAlign: 'center',
            background: PF.s2, color: PF.text,
            fontFamily: PF.font, fontWeight: 700, fontSize: 14,
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            all: 'unset', flex: 1, cursor: 'pointer',
            padding: '14px 0', borderRadius: 14, textAlign: 'center',
            background: PF.danger, color: '#1a0407',
            fontFamily: PF.font, fontWeight: 800, fontSize: 14,
          }}>Sair</button>
        </div>
      </div>
    </>
  );
}

// ─── Tab bar (reused) ─────────────────────────────────────────
function PFTabBar({ active, onChange }) {
  const tabs = [
    { id: 'home',    label: 'Home',    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: 'train',   label: 'Treinar', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M3 8h3M3 16h3M18 8h3M18 16h3M6 12h12"/></svg> },
    { id: 'stats',   label: 'Stats',   icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18M6 20V10M11 20V4M16 20v-7M21 20V8"/></svg> },
    { id: 'social',  label: 'Social',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
    { id: 'profile', label: 'Perfil',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 70,
      paddingBottom: 26, paddingTop: 0,
      background: `linear-gradient(180deg, rgba(19,19,19,0) 0%, rgba(19,19,19,0.96) 28%, #131313 100%)`,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', padding: '8px 10px 0' }}>
        {tabs.map(t => {
          const a = active === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} style={{
              all: 'unset', cursor: 'pointer', flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 0',
            }}>
              <div style={{
                padding: '5px 14px', borderRadius: 10,
                background: a ? PF.primaryDim : 'transparent',
                border: a ? `1px solid ${PF.primarySoft}` : '1px solid transparent',
                color: a ? PF.primary : PF.text3,
              }}>{t.icon}</div>
              <span style={{
                fontFamily: PF.font, fontSize: 10, fontWeight: a ? 700 : 500,
                color: a ? PF.primary : PF.text3,
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────
function ProfileScreen({ tweaks }) {
  const [tab, setTab] = React.useState('profile');
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const user = { ...USER, plan: tweaks.plan || 'free' };

  return (
    <div style={{
      background: PF.bg, color: PF.text, fontFamily: PF.font,
      height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <PFTopBar/>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 110 }} className="kinetic-scroll">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: '6px 0' }}>
          <IdentityHero user={user}/>

          <div style={{ padding: '0 20px' }}><ProtocolSection user={user}/></div>
          <div style={{ padding: '0 20px' }}><AccountSection user={user} onLogout={() => setLogoutOpen(true)}/></div>
          <div style={{ padding: '0 20px' }}><PreferencesSection/></div>
          <div style={{ padding: '0 20px' }}><CommunitySection/></div>
          <div style={{ padding: '0 20px' }}><DataSection/></div>
          <div style={{ padding: '0 20px' }}><SupportSection/></div>
          <div style={{ padding: '0 20px' }}><LogoutSection
            onLogout={() => setLogoutOpen(true)}
            onDelete={() => {}}
          /></div>
        </div>
      </div>

      <PFTabBar active={tab} onChange={setTab}/>

      <LogoutSheet
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => setLogoutOpen(false)}
      />
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
