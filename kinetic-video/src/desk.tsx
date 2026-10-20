import React from "react";
import {
  ArrowLeft,
  BellOff,
  Check as CheckIcon,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock,
  Copy,
  CreditCard,
  FileText,
  IdCard,
  KeyRound,
  LayoutDashboard,
  Link2,
  Lock,
  LogOut,
  MessageCircle,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  UserMinus,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { display, K, mono, sans, SEMI } from "./theme";
import { ar, br, IN_OUT, Logo, typed } from "./ui";

/*
 * Painel web do personal (kinetic-desktop) recriado a partir dos prints, com as
 * mesmas classes/tokens das telas reais. Cada tela é função de `t` (segundos).
 * Viewport: 1440×900. Conteúdo central: 1096px, como no painel em tela cheia.
 */

export const CONTENT_W = 1096;
const SIDEBAR_W = 232;
const MAIN_W = 1440 - SIDEBAR_W;
const PAD_X = (MAIN_W - CONTENT_W) / 2;

/* ───────────── primitivas ───────────── */

export const DeskAvatar: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  const parts = name.trim().split(/\s+/);
  const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: K.surface2,
        color: K.primary,
        fontFamily: display,
        fontWeight: 800,
        fontSize: size * 0.34,
      }}
    >
      {initials}
    </div>
  );
};

type BtnKind = "primary" | "outline" | "amber" | "cyanOutline" | "disabled";
export const Btn: React.FC<{
  kind?: BtnKind;
  children: React.ReactNode;
  h?: number;
  style?: React.CSSProperties;
}> = ({ kind = "outline", children, h = 40, style }) => {
  const k = {
    primary: { background: K.primary, color: K.onPrimary, border: "1px solid transparent" },
    outline: { background: K.surface1, color: K.text, border: "1px solid rgba(255,255,255,0.10)" },
    amber: { background: "rgba(245,185,69,0.08)", color: K.warn, border: "1px solid rgba(245,185,69,0.35)" },
    cyanOutline: { background: "rgba(0,229,255,0.06)", color: K.primary, border: "1px solid rgba(0,229,255,0.30)" },
    disabled: { background: K.surface2, color: "rgba(245,246,247,0.38)", border: "1px solid transparent" },
  }[kind];
  return (
    <span
      style={{
        height: h,
        padding: "0 16px",
        borderRadius: 12,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: "nowrap",
        flexShrink: 0,
        ...k,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ borderRadius: 14, border: `1px solid ${K.ghost}`, background: K.surface1, overflow: "hidden", ...style }}>{children}</div>
);

const Pill: React.FC<{ color: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ color, children, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      fontWeight: 600,
      color,
      background: `${color}1f`,
      padding: "4px 10px",
      borderRadius: 999,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

const Dot: React.FC<{ color: string; size?: number }> = ({ color, size = 7 }) => (
  <span style={{ width: size, height: size, borderRadius: size, background: color, flexShrink: 0, display: "inline-block" }} />
);

const H: React.FC<{ size: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ size, children, style }) => (
  <div style={{ fontFamily: display, fontWeight: 800, fontStretch: SEMI, letterSpacing: "-0.02em", fontSize: size, lineHeight: 1.15, ...style }}>
    {children}
  </div>
);

/* ───────────── moldura (PersonalShell) ───────────── */

const NAV = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Financeiro", icon: Wallet },
  { label: "Meu plano", icon: CreditCard },
  { label: "Meu perfil", icon: IdCard },
];

const Meter: React.FC<{ label: string; used: number; limit: number }> = ({ label, used, limit }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: K.textMuted }}>
      <span>{label}</span>
      <span style={{ fontFamily: mono, color: K.textSoft }}>
        {used} / {limit}
      </span>
    </div>
    <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
      <div style={{ height: 4, borderRadius: 4, background: K.primary, width: `${(used / limit) * 100}%` }} />
    </div>
  </div>
);

export const Shell: React.FC<{
  active?: string;
  crumb: React.ReactNode;
  topRight?: React.ReactNode;
  draft?: { label: string; generating: boolean; t: number };
  children: React.ReactNode;
}> = ({ active = "Visão geral", crumb, topRight, draft, children }) => (
  <div style={{ position: "absolute", inset: 0, display: "flex", background: K.bg, fontFamily: sans, color: K.text }}>
    <aside
      style={{
        width: SIDEBAR_W,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        borderRight: "1px solid rgba(255,255,255,0.07)",
        background: "#161616",
        padding: "20px 12px",
      }}
    >
      <div style={{ padding: "4px 10px" }}>
        <Logo size={19} />
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ label, icon: Icon }) => (
          <div
            key={label}
            style={{
              height: 40,
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 8,
              padding: "0 10px",
              fontSize: 14,
              background: label === active ? "rgba(255,255,255,0.06)" : "transparent",
              color: label === active ? K.text : K.textDim,
            }}
          >
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </div>
        ))}
      </nav>
      {draft && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ padding: "0 10px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: K.textMuted }}>
            Em andamento
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 8,
              border: "1px solid rgba(0,229,255,0.2)",
              background: "rgba(0,229,255,0.05)",
              padding: "8px 10px",
            }}
          >
            {draft.generating ? (
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  border: "2px solid rgba(0,229,255,0.25)",
                  borderTopColor: K.primary,
                  rotate: `${draft.t * 400}deg`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <span style={{ margin: "0 2px" }}>
                <Dot color={K.primary} size={8} />
              </span>
            )}
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Ficha · Ana Souza</span>
              <span style={{ fontSize: 11.5, color: K.textMuted }}>{draft.label}</span>
            </span>
          </div>
        </div>
      )}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Plano Plus</span>
            <span style={{ fontSize: 12, color: K.primary }}>Ver planos</span>
          </div>
          <Meter label="Alunos ativos" used={24} limit={30} />
          <Meter label="Fichas com IA" used={38} limit={120} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px" }}>
          <DeskAvatar name="Rafael Costa" size={32} />
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Rafael Costa</div>
            <div style={{ fontSize: 12, color: K.textMuted }}>rafael@kinetic.app</div>
          </div>
          <LogOut size={16} color={K.textMuted} />
        </div>
      </div>
    </aside>
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative" }}>
      <div
        style={{
          height: 58,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          fontSize: 14,
          color: K.textDim,
          background: K.bg,
          zIndex: 5,
        }}
      >
        <span style={{ display: "flex", gap: 10, alignItems: "center" }}>{crumb}</span>
        <span style={{ display: "flex", gap: 12, alignItems: "center" }}>{topRight}</span>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
    </div>
  </div>
);

export const TopRightDefault: React.FC = () => (
  <>
    <Btn h={36} style={{ fontFamily: mono, fontWeight: 400, color: K.textDim, fontSize: 13 }}>
      <MessageCircle size={15} /> (11) 98765-4321
    </Btn>
    <Btn kind="primary" h={36}>
      <UserPlus size={15} /> Convidar aluno
    </Btn>
  </>
);

/** Coluna central rolável (scroll em px). */
export const Content: React.FC<{ scroll?: number; top?: number; children: React.ReactNode }> = ({ scroll = 0, top = 40, children }) => (
  <div style={{ position: "absolute", left: PAD_X, width: CONTENT_W, top: top - scroll, display: "flex", flexDirection: "column", gap: 32 }}>
    {children}
  </div>
);

/* ───────────── Visão geral ───────────── */

const STATUS = {
  emDia: { label: "Em dia", color: K.success },
  regular: { label: "Regular", color: K.warn },
  atencao: { label: "Precisa de atenção", color: K.alert },
} as const;

const ROSTER = [
  { name: "Bruno Lima", email: "bruno.lima@gmail.com", st: "atencao", adh: 18, done: "3 / 20", last: "há 9 dias", since: "mar 2026" },
  { name: "Diego Rocha", email: "diegorocha@gmail.com", st: "atencao", adh: 35, done: "7 / 20", last: "há 5 dias", since: "jun 2026" },
  { name: "Ana Souza", email: "ana.souza@gmail.com", st: "emDia", adh: 92, done: "18 / 20", last: "ontem", since: "mar 2026" },
  { name: "Carla Mendes", email: "carla.mendes@gmail.com", st: "emDia", adh: 88, done: "14 / 16", last: "hoje", since: "jan 2026" },
  { name: "Felipe Nunes", email: "felipenunes@gmail.com", st: "regular", adh: 64, done: "10 / 16", last: "há 2 dias", since: "ago 2026" },
] as const;

export const Dashboard: React.FC<{ t: number; scroll?: number }> = ({ t, scroll = 0 }) => {
  const kpiIn = (i: number) => ar(t, 0.3 + i * 0.1, 0.9 + i * 0.1);
  const count = ar(t, 0.4, 1.8, 0, 1, IN_OUT);
  const KPIS = [
    { label: "Alunos ativos", value: `${Math.round(24 * count)}`, of: "/ 30", sub: "6 vagas livres no plano" },
    { label: "Aderência média · mês", value: `${Math.round(78 * count)}`, of: "%", sub: "Entre alunos com meta de frequência", bar: 78 * count },
    { label: "Treinos concluídos · mês", value: `${Math.round(312 * count)}`, of: "/ 380", sub: "Somando as fichas de todos os alunos" },
    { label: "Precisam de atenção", value: `${Math.round(3 * count)}`, of: "", sub: "Inativos, sem treinar ou com queda", dot: true },
  ];
  const QUEUE = [
    { name: "Ana Souza", text: "Prévia de ficha por IA esperando sua revisão", sub: "Vale por mais 17h", ai: true },
    { name: "Bruno Lima", text: "Não treina há 9 dias", sub: "Risco de abandono · fale com o aluno" },
    { name: "Diego Rocha", text: "Aderência de 35% nos últimos 28 dias (meta: 4x por semana)", sub: "Risco de abandono · fale com o aluno" },
  ];
  const CONTACT = [
    { name: "Bruno Lima", why: "Não treina há 9 dias", meta: "Último treino há 9 dias · aderência 18% (7 dias)" },
    { name: "Diego Rocha", why: "Aderência de 35% nos últimos 28 dias (meta: 4x por semana)", meta: "Último treino há 5 dias · aderência 35% (28 dias)" },
  ];
  return (
    <Content scroll={scroll}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: ar(t, 0, 0.4) }}>
        <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: "0.04em", color: K.textMuted }}>TERÇA-FEIRA, 20 DE OUTUBRO</span>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em" }}>Boa noite, Rafael</div>
        <div style={{ fontSize: 14, color: K.textSoft }}>
          Você tem <b style={{ color: K.alert }}>3 alunos</b> precisando de atenção.
        </div>
      </div>
      <Card style={{ display: "flex" }}>
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            style={{
              flex: 1,
              padding: "22px 20px",
              borderLeft: i ? `1px solid ${K.ghost}` : undefined,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              opacity: kpiIn(i),
              translate: `0 ${(1 - kpiIn(i)) * 12}px`,
            }}
          >
            <span style={{ fontSize: 13, color: K.textDim }}>{k.label}</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: mono, fontSize: 30, fontWeight: 500 }}>{k.value}</span>
              <span style={{ fontFamily: mono, fontSize: 14, color: K.textMuted }}>{k.of}</span>
              {k.dot && <Dot color={K.alert} />}
            </span>
            {k.bar !== undefined && (
              <span style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
                <span style={{ display: "block", height: 4, borderRadius: 4, width: `${k.bar}%`, background: K.primary }} />
              </span>
            )}
            <span style={{ fontSize: 12, color: K.textDim }}>{k.sub}</span>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${K.ghost}` }}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Fila de hoje</span>
            <span style={{ fontFamily: mono, fontSize: 12, color: K.textMuted }}>3 pendências</span>
          </span>
          <span style={{ display: "flex", gap: 2, padding: 3, borderRadius: 10, border: `1px solid ${K.ghost}`, fontSize: 12 }}>
            {[
              ["Tudo", 3],
              ["Em risco", 2],
              ["Prévias de IA", 1],
            ].map(([l, n], i) => (
              <span key={l} style={{ padding: "5px 10px", borderRadius: 8, background: i === 0 ? K.surface2 : undefined, color: i === 0 ? K.text : K.textSoft }}>
                {l} <span style={{ color: K.textMuted, marginLeft: 4 }}>{n}</span>
              </span>
            ))}
          </span>
        </div>
        {QUEUE.map((q, i) => {
          const p = ar(t, 1.0 + i * 0.15, 1.5 + i * 0.15);
          return (
            <div
              key={q.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                borderTop: i ? `1px solid ${K.ghost}` : undefined,
                opacity: p,
                translate: `${(1 - p) * 20}px 0`,
              }}
            >
              <Dot color={K.warn} />
              {q.ai ? <Sparkles size={16} color={K.textMuted} /> : <TriangleAlert size={16} color={K.textMuted} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14 }}>
                  <b style={{ fontWeight: 600 }}>{q.name}</b> · {q.text}
                </div>
                <div style={{ fontSize: 12.5, color: K.textDim, marginTop: 2 }}>{q.sub}</div>
              </div>
              <Btn h={34} style={{ fontSize: 13 }}>
                Resolver <ChevronRight size={14} />
              </Btn>
            </div>
          );
        })}
      </Card>
      <Card>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "16px 20px", borderBottom: `1px solid ${K.ghost}` }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Precisam de um contato</span>
          <span style={{ fontFamily: mono, fontSize: 12, color: K.textMuted }}>2 alunos</span>
        </div>
        {CONTACT.map((c, i) => (
          <div key={c.name} style={{ display: "flex", gap: 14, padding: "18px 20px", borderTop: i ? `1px solid ${K.ghost}` : undefined }}>
            <DeskAvatar name={c.name} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
                {c.name}
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: K.warn }}>
                  <Dot color={K.warn} size={5} /> Atenção
                </span>
              </div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{c.why}</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: K.textMuted, marginTop: 6 }}>{c.meta}</div>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 18, alignSelf: "flex-start", fontSize: 13, color: K.textSoft }}>
              <Btn h={34} style={{ fontSize: 13 }}>
                <MessageCircle size={14} color={K.success} /> WhatsApp
              </Btn>
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <BellOff size={14} /> Já entrei em contato
              </span>
              <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                Ver aluno <ChevronRight size={14} />
              </span>
            </span>
          </div>
        ))}
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: display, fontWeight: 800, fontStretch: SEMI, fontSize: 18 }}>Alunos</span>
          <span style={{ fontFamily: mono, fontSize: 12, color: K.textMuted }}>24</span>
          {[
            ["Todos", ""],
            ["Atenção", 3],
            ["Regular", 5],
            ["Em dia", 16],
          ].map(([l, n], i) => (
            <span key={l} style={{ fontSize: 13, padding: "6px 10px", borderRadius: 8, background: i === 0 ? K.surface2 : undefined, color: i === 0 ? K.text : K.textSoft }}>
              {l} <span style={{ fontFamily: mono, color: K.textMuted }}>{n}</span>
            </span>
          ))}
          <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <Btn h={36} style={{ width: 250, justifyContent: "flex-start", color: K.textMuted, fontWeight: 400, fontSize: 13 }}>
              <Search size={14} /> Buscar por nome ou e-mail
            </Btn>
            <Btn h={36} style={{ fontSize: 13 }}>
              <Plus size={14} /> Convidar aluno
            </Btn>
          </span>
        </div>
        <Card>
          <div style={{ display: "flex", padding: "12px 20px", fontSize: 12, color: K.textDim, borderBottom: `1px solid ${K.ghost}` }}>
            <span style={{ width: 330 }}>Aluno</span>
            <span style={{ width: 175 }}>Status</span>
            <span style={{ width: 190 }}>Aderência · mês</span>
            <span style={{ width: 110, textAlign: "right", paddingRight: 24 }}>Treinos no mês</span>
            <span style={{ width: 110 }}>Último treino</span>
            <span>Aluno desde</span>
          </div>
          {ROSTER.map((r, i) => {
            const s = STATUS[r.st];
            return (
              <div key={r.name} style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderTop: i ? `1px solid ${K.ghost}` : undefined, fontSize: 13 }}>
                <span style={{ width: 330, display: "flex", alignItems: "center", gap: 12 }}>
                  <DeskAvatar name={r.name} size={32} />
                  <span>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: K.textDim }}>{r.email}</div>
                  </span>
                </span>
                <span style={{ width: 175, display: "flex", alignItems: "center", gap: 6, color: s.color }}>
                  <Dot color={s.color} size={6} /> {s.label}
                </span>
                <span style={{ width: 190, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 96, height: 3, borderRadius: 3, background: "rgba(255,255,255,0.1)" }}>
                    <span style={{ display: "block", height: 3, borderRadius: 3, width: `${r.adh}%`, background: K.primary }} />
                  </span>
                  <span style={{ fontFamily: mono, fontWeight: 600 }}>{r.adh}%</span>
                </span>
                <span style={{ width: 110, textAlign: "right", paddingRight: 24, fontFamily: mono }}>{r.done}</span>
                <span style={{ width: 110, color: r.st === "atencao" ? K.warn : K.textSoft }}>{r.last}</span>
                <span style={{ color: K.textDim }}>{r.since}</span>
                <ChevronRight size={14} color={K.textMuted} style={{ marginLeft: "auto" }} />
              </div>
            );
          })}
        </Card>
      </div>
    </Content>
  );
};

/* ───────────── Aluno: cabeçalho e abas ───────────── */

export const StudentTabs: React.FC<{ active: string }> = ({ active }) => (
  <div style={{ display: "flex", gap: 28, borderBottom: `1px solid ${K.ghost}`, fontSize: 14 }}>
    {["Desempenho", "Treinos", "Avaliações"].map((tab) => (
      <span
        key={tab}
        style={{
          padding: "10px 2px",
          color: tab === active ? K.text : K.textDim,
          fontWeight: tab === active ? 600 : 400,
          borderBottom: `2px solid ${tab === active ? K.primary : "transparent"}`,
          marginBottom: -1,
        }}
      >
        {tab}
      </span>
    ))}
  </div>
);

export const StudentHeader: React.FC = () => (
  <>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <DeskAvatar name="Ana Souza" size={56} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em" }}>Ana Souza</div>
        <div style={{ fontSize: 14, color: K.textDim, marginTop: 2 }}>ana.souza@gmail.com · aluna desde março de 2026 · meta: ganho de massa</div>
      </div>
      <Btn h={36} style={{ fontSize: 13 }}>
        <MessageCircle size={14} color={K.success} /> WhatsApp
      </Btn>
      <Btn kind="primary" h={36} style={{ fontSize: 13 }}>
        <Sparkles size={14} /> Fichas de treino
      </Btn>
      <Btn h={36} style={{ padding: "0 10px" }}>
        <UserMinus size={15} color={K.textDim} />
      </Btn>
    </div>
    <Card style={{ display: "flex" }}>
      <div style={{ width: 350, padding: 20, borderRight: `1px solid ${K.ghost}` }}>
        <div style={{ fontSize: 12, color: K.textDim }}>Status</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 600, marginTop: 8 }}>
          <Dot color={K.success} size={8} /> Em dia
        </div>
        <div style={{ fontFamily: mono, fontSize: 12, color: K.textMuted, marginTop: 8 }}>Último treino ontem · aderência 92% (7d)</div>
      </div>
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ fontSize: 12, color: K.textDim }}>Por quê</div>
        <div style={{ fontSize: 14, marginTop: 8 }}>Treinou 4 de 4 dias planejados nesta semana</div>
      </div>
    </Card>
    <Card>
      <div style={{ display: "flex", borderBottom: `1px solid ${K.ghost}` }}>
        {[
          ["Objetivo", "Ganho de massa"],
          ["Nível", "Intermediário"],
          ["Frequência", "4x por semana"],
        ].map(([l, v]) => (
          <div key={l} style={{ flex: 1, padding: "18px 20px", borderRight: `1px solid ${K.ghost}` }}>
            <div style={{ fontSize: 12, color: K.textDim }}>{l}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{v}</div>
          </div>
        ))}
        <div style={{ width: 176, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Btn h={34} style={{ fontSize: 13 }}>
            <Pencil size={13} /> Editar protocolo
          </Btn>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: K.textDim }}>
          Anamnese <Pill color={K.success} style={{ fontSize: 11, padding: "2px 7px" }}>Completa</Pill> Ana conferiu no app
        </div>
        <div style={{ fontSize: 14, marginTop: 8 }}>Desconforto no ombro direito</div>
      </div>
    </Card>
  </>
);

/* ───────────── Aba Treinos (fichas ativas) ───────────── */

const DAY_TONES = [K.primary, K.warn, K.success];
export const DayBadge: React.FC<{ i: number; letter: string }> = ({ i, letter }) => {
  const c = DAY_TONES[i % 3];
  return (
    <span
      style={{
        fontFamily: display,
        fontWeight: 800,
        fontStretch: SEMI,
        fontSize: 12,
        letterSpacing: "0.04em",
        color: c,
        background: `${c}1a`,
        border: `1px solid ${c}40`,
        borderRadius: 999,
        padding: "4px 10px",
      }}
    >
      DIA {letter}
    </span>
  );
};

const ACTIVE_PLANS = [
  { title: "FULL BODY A · BASE E ESTABILIDADE", muscles: "QUADRÍCEPS / COSTAS / PEITO / POSTERIOR / OMBRO", meta: "7 exercícios · 20 séries · ~50 min · ≈ 4.104 kg de volume", tags: ["Quadríceps", "Costas", "Peito", "Posterior", "Ombro"], done: "Feita ontem" },
  { title: "FULL BODY B · FORÇA E CONTROLE", muscles: "OMBRO / QUADRÍCEPS / COSTAS / TRÍCEPS / BÍCEPS", meta: "7 exercícios · 20 séries · ~55 min · ≈ 2.871 kg de volume", tags: ["Ombro", "Quadríceps", "Costas", "Tríceps", "Bíceps"], done: "Feita há 3 dias" },
  { title: "FULL BODY C · EQUILÍBRIO E FUNCIONAL", muscles: "POSTERIOR / PEITO / OMBRO / PANTURRILHA / BÍCEPS", meta: "7 exercícios · 19 séries · ~55 min · ≈ 3.108 kg de volume", tags: ["Posterior", "Peito", "Ombro", "Panturrilha", "Bíceps"], done: "Feita há 5 dias" },
  { title: "FULL BODY D · CONDICIONAMENTO", muscles: "PEITO / COSTAS / OMBRO / CORE", meta: "6 exercícios · 18 séries · ~45 min · ≈ 2.540 kg de volume", tags: ["Peito", "Costas", "Ombro", "Core"], done: "Feita há 6 dias" },
];

export const TreinosTab: React.FC<{ t: number; pressAI?: string }> = ({ t, pressAI }) => (
  <>
    <StudentTabs active="Treinos" />
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
      <div>
        <H size={22}>Treinos</H>
        <div style={{ fontSize: 13, color: K.textDim, marginTop: 6 }}>Fichas ativas no app de Ana. O que você salvar aparece para ela na hora.</div>
      </div>
      <span style={{ display: "flex", gap: 10 }}>
        <Btn kind="amber" h={42} style={{ scale: pressAI }}>
          <Sparkles size={16} /> Criar com IA
        </Btn>
        <Btn kind="primary" h={42}>
          <Plus size={16} /> Nova ficha
        </Btn>
      </span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {ACTIVE_PLANS.map((p, i) => {
        const inP = ar(t, 0.15 + i * 0.1, 0.6 + i * 0.1);
        return (
          <Card key={p.title} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, opacity: inP, translate: `0 ${(1 - inP) * 16}px` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <DayBadge i={i} letter={"ABCD"[i]} />
              <Pill color={K.success}>
                <CircleCheck size={13} /> Prescrita por você
              </Pill>
            </div>
            <H size={19} style={{ marginTop: 6 }}>{p.title}</H>
            <div style={{ fontSize: 12.5, color: K.textDim, letterSpacing: "0.02em" }}>{p.muscles}</div>
            <div style={{ fontSize: 12.5, color: K.textMuted }}>{p.meta}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {p.tags.map((tag) => (
                <span key={tag} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: K.surface2 }}>
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: K.textMuted }}>
              <Sparkles size={13} /> Criada com IA · aprovada por você em 16 out, 02:01
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, borderTop: `1px solid ${K.ghost}`, paddingTop: 14, marginTop: 4, fontSize: 13, color: K.textDim }}>
              <Clock size={14} /> {p.done}
              <span style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center" }}>
                <Copy size={15} />
                <Trash2 size={15} />
                <Btn kind="cyanOutline" h={34} style={{ fontSize: 13 }}>
                  <Pencil size={13} /> Editar
                </Btn>
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  </>
);

/* ───────────── Fluxo da IA ───────────── */

const Stepper: React.FC<{ step: number }> = ({ step }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
    {["Pedido", "Prévia", "Aprovação"].map((s, i) => (
      <React.Fragment key={s}>
        {i > 0 && <span style={{ width: 24, height: 1, background: K.ghostHi }} />}
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: i === step ? K.text : K.textDim, fontWeight: i === step ? 600 : 400 }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: i === step ? K.primary : i < step ? "rgba(0,229,255,0.15)" : "transparent",
              color: i === step ? K.onPrimary : i < step ? K.primary : K.textDim,
              border: i === step ? "none" : `1px solid ${K.ghostHi}`,
            }}
          >
            {i < step ? <CheckIcon size={12} /> : i + 1}
          </span>
          {s}
        </span>
      </React.Fragment>
    ))}
  </span>
);

export const AiHeader: React.FC<{ step: number; sub: string }> = ({ step, sub }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 20, borderBottom: `1px solid ${K.ghost}` }}>
    <Btn h={40} style={{ padding: "0 11px" }}>
      <ArrowLeft size={16} color={K.textDim} />
    </Btn>
    <div style={{ flex: 1 }}>
      <H size={18}>Nova prescrição com IA</H>
      <div style={{ fontSize: 12.5, color: K.textDim, marginTop: 3 }}>{sub}</div>
    </div>
    <Stepper step={step} />
  </div>
);

const Footer: React.FC<{ left: React.ReactNode; right: React.ReactNode }> = ({ left, right }) => (
  <div
    style={{
      position: "absolute",
      // Fixo no rodapé da área principal: Content fica em top=24 sem rolagem nas telas da IA.
      left: -PAD_X,
      width: MAIN_W,
      top: 900 - 58 - 76 - 24,
      height: 76,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: `0 ${PAD_X}px`,
      borderTop: `1px solid ${K.ghost}`,
      background: "rgba(19,19,19,0.96)",
      zIndex: 10,
    }}
  >
    <div style={{ flex: 1 }}>{left}</div>
    {right}
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: K.textDim, textTransform: "uppercase" }}>{children}</div>
);

const REQUEST = "Divisão ABC de hipertrofia com foco em peito e costas, sem sobrecarregar o ombro direito. Treinos de até 60 min.";

export const AiPedido: React.FC<{ t: number; generateAt: number }> = ({ t, generateAt }) => {
  const typedP = ar(t, 0.6, 2.8, 0, 1, (x) => x);
  const text = typed(REQUEST, typedP);
  const chip = t > 3.1;
  const ready = typedP > 0.2;
  return (
    <>
      <div style={{ display: "flex", gap: 20 }}>
        <Card style={{ flex: 1 }}>
          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: display, fontWeight: 700, fontStretch: SEMI, fontSize: 15 }}>O que você quer para Ana?</span>
              <span style={{ fontSize: 12, color: K.textDim }}>Divisão, foco, o que evitar, equipamentos</span>
            </div>
            <div
              style={{
                height: 116,
                borderRadius: 10,
                border: `1px solid ${K.primary}`,
                boxShadow: "0 0 0 3px rgba(0,229,255,0.12)",
                background: K.bg,
                padding: "12px 14px",
                fontSize: 14,
                lineHeight: 1.5,
                color: text ? K.text : K.textMuted,
              }}
            >
              {text || "Ex.: Divisão ABC de hipertrofia com foco em glúteos, sem impacto no joelho, treinos de até 50 minutos."}
              {text && t < 3 && <span style={{ display: "inline-block", width: 2, height: 17, background: K.primary, marginLeft: 1, verticalAlign: "text-bottom", opacity: Math.floor(t * 3) % 2 ? 1 : 0.2 }} />}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 13 }}>
              <span style={{ fontSize: 12, color: K.textDim, marginRight: 4 }}>Sugestões</span>
              {["Divisão ABC", "Hipertrofia", "Upper/Lower", "Full body", "Baixo impacto", "Só máquinas", "Treino em casa", "Core no final"].map((c) => {
                const on = chip && (c === "Hipertrofia" || c === "Core no final");
                return (
                  <span
                    key={c}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: `1px solid ${on ? "rgba(0,229,255,0.4)" : K.ghost}`,
                      background: on ? K.primaryDim : K.surface1,
                      color: on ? K.primary : K.text,
                      fontWeight: 500,
                    }}
                  >
                    {c}
                  </span>
                );
              })}
            </div>
            <span style={{ fontFamily: mono, fontSize: 12, color: K.textMuted }}>{text.length} / 1000</span>
          </div>
          <div style={{ display: "flex", gap: 20, padding: 22, borderTop: `1px solid ${K.ghost}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionLabel>Formato</SectionLabel>
              <span style={{ display: "flex", padding: 3, borderRadius: 10, border: `1px solid ${K.ghost}`, fontSize: 13 }}>
                <span style={{ padding: "8px 14px", color: K.textDim }}>Ficha única</span>
                <span style={{ padding: "8px 14px", borderRadius: 8, background: K.surface2, fontWeight: 600 }}>Divisão</span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionLabel>Fichas</SectionLabel>
              <span style={{ display: "flex", alignItems: "center", gap: 28, height: 40, padding: "0 14px", borderRadius: 10, border: `1px solid ${K.ghost}`, fontFamily: mono, fontSize: 14 }}>
                <Minus size={15} color={K.textDim} /> 3 <Plus size={15} color={K.textDim} />
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <SectionLabel>Duração por treino</SectionLabel>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 40, padding: "0 14px", borderRadius: 10, border: `1px solid ${K.ghost}`, fontFamily: mono, fontSize: 14 }}>
                60 <span style={{ color: K.textMuted, fontSize: 12 }}>min</span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <SectionLabel>Nível</SectionLabel>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 40, padding: "0 14px", borderRadius: 10, border: `1px solid ${K.ghost}`, fontSize: 14 }}>
                Intermediário <ChevronDown size={15} color={K.textDim} />
              </span>
            </div>
          </div>
        </Card>
        <Card style={{ width: 280, padding: 20, display: "flex", flexDirection: "column", gap: 14, alignSelf: "flex-start" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: display, fontWeight: 700, fontStretch: SEMI, fontSize: 15 }}>Perfil considerado</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", color: K.textDim }}>ANAMNESE</span>
          </div>
          <div style={{ borderRadius: 12, border: `1px solid ${K.ghost}`, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: K.textDim }}>
              Objetivo
              <span style={{ color: K.primary, fontWeight: 600, display: "flex", gap: 4, alignItems: "center" }}>
                <Pencil size={11} /> Alterar
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>Ganho de massa</div>
          </div>
          {[
            ["Nível", "Intermediário"],
            ["Frequência", "4x por semana"],
            ["Idade", "29 anos"],
            ["Peso · altura", "62 kg · 1,66 m"],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: K.textDim }}>{l}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ borderRadius: 12, border: "1px solid rgba(245,185,69,0.3)", background: "rgba(245,185,69,0.06)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: K.warn }}>
              <TriangleAlert size={14} /> Restrição informada
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Desconforto no ombro direito</div>
          </div>
        </Card>
      </div>
      <Footer
        left={
          <>
            <div style={{ fontFamily: mono, fontSize: 13 }}>3 fichas · DIA A-C · 60 min · Intermediário · substitui as atuais</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: K.textDim, marginTop: 4 }}>
              <ShieldCheck size={13} /> Nada vai para o app de Ana sem a sua aprovação
            </div>
          </>
        }
        right={
          <>
            <Btn h={44}>Cancelar</Btn>
            <Btn kind={ready ? "primary" : "disabled"} h={44} style={{ scale: String(1 - Math.sin(ar(t, generateAt - 0.05, generateAt + 0.25, 0, 1, IN_OUT) * Math.PI) * 0.05) }}>
              <Sparkles size={16} /> Gerar prévia
            </Btn>
          </>
        }
      />
    </>
  );
};

export const AiGerando: React.FC<{ t: number }> = ({ t }) => {
  const STEPS = ["Lendo o perfil e as restrições", "Interpretando o seu pedido", "Escolhendo exercícios, séries e cargas", "Conferindo volume e pontos de atenção"];
  const doneAt = [0.5, 1.0, 1.5, 2.1];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 30 }}>
      <span style={{ width: 72, height: 72, borderRadius: 18, background: "rgba(245,185,69,0.12)", display: "flex", alignItems: "center", justifyContent: "center", scale: String(1 + Math.sin(t * 4) * 0.04) }}>
        <Sparkles size={32} color={K.warn} />
      </span>
      <H size={26}>Montando a divisão de Ana</H>
      <div style={{ fontSize: 14, color: K.textSoft, textAlign: "center", lineHeight: 1.6 }}>
        A IA está montando 3 fichas a partir do seu pedido e do perfil de Ana.
        <br />
        Nada é salvo até você aprovar.
      </div>
      <Card style={{ width: 656 }}>
        {STEPS.map((s, i) => {
          const done = t > doneAt[i];
          const current = !done && (i === 0 || t > doneAt[i - 1]);
          return (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                fontSize: 14,
                background: current ? "rgba(0,229,255,0.04)" : undefined,
                fontWeight: current ? 600 : 400,
                color: done || current ? K.text : K.textMuted,
              }}
            >
              {done ? (
                <span style={{ width: 22, height: 22, borderRadius: 11, background: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckIcon size={13} color={K.success} strokeWidth={3} />
                </span>
              ) : current ? (
                <span style={{ width: 20, height: 20, margin: 1, borderRadius: 10, border: "2px solid rgba(0,229,255,0.25)", borderTopColor: K.primary, rotate: `${t * 420}deg` }} />
              ) : (
                <span style={{ width: 22, height: 22, borderRadius: 11, border: `1px solid ${K.ghostHi}` }} />
              )}
              {s}
              {current && <span style={{ marginLeft: "auto", fontSize: 12, color: K.primary, fontWeight: 500 }}>em andamento</span>}
            </div>
          );
        })}
      </Card>
      <div style={{ display: "flex", gap: 12, width: 656 }}>
        {[K.primary, K.warn, K.success].map((c) => (
          <Card key={c} style={{ flex: 1, height: 100, padding: 18, display: "flex", flexDirection: "column", gap: 12, background: "#171717" }}>
            <span style={{ width: 58, height: 22, borderRadius: 11, background: `${c}22` }} />
            <span style={{ width: "70%", height: 10, borderRadius: 5, background: K.surface2, opacity: 0.6 + Math.sin(t * 5) * 0.3 }} />
            <span style={{ width: "45%", height: 8, borderRadius: 4, background: K.surface2, opacity: 0.5 + Math.sin(t * 5 + 1) * 0.3 }} />
          </Card>
        ))}
      </div>
      <Btn h={44}>Cancelar geração</Btn>
    </div>
  );
};

const PREVIEW_DAYS = [
  { title: "Superior A · Peito e Costas", meta: "6 exercícios · 18 séries · ~55 min" },
  { title: "Inferior · Quadríceps e Posterior", meta: "6 exercícios · 19 séries · ~58 min" },
  { title: "Superior B · Ombro e Braços", meta: "6 exercícios · 17 séries · ~52 min" },
];

const PREVIEW_ROWS = [
  { section: "Aquecimento", color: K.warn },
  { n: "01", name: "Mobilidade de ombros com bastão", sub: "Mobilidade", sets: "2 × 12", load: "Sem carga (RPE 3-4)", rest: "30s" },
  { section: "Principal", color: K.primary },
  { n: "02", name: "Supino com halteres pegada neutra", sub: "Peito · composto", sets: "4 × 8-10", load: "Halteres de 16kg (RPE 8)", rest: "90s", warn: "Pegada neutra para poupar o ombro direito." },
  { n: "03", name: "Puxada aberta no pulley", sub: "Costas · composto", sets: "4 × 10-12", load: "40kg (RPE 8)", rest: "60s" },
  { n: "04", name: "Remada cavalinho (máquina)", sub: "Costas · composto", sets: "3 × 12", load: "30kg (RPE 8)", rest: "60s" },
] as const;

export const AiPrevia: React.FC<{ t: number; approveAt: number }> = ({ t, approveAt }) => {
  const reviewed = [1.4, 2.0, 2.6].filter((x) => t > x).length;
  const declared = t > 3.2;
  const canApprove = reviewed === 3 && declared;
  const sent = t > approveAt + 0.15;
  return (
    <>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <TriangleAlert size={15} color={K.warn} /> <b>2 pontos para conferir</b>
              <span style={{ fontSize: 12, color: K.textDim }}>· levantados pela IA a partir da anamnese</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {[
                ["Amplitude do ombro", "No supino e no desenvolvimento, oriente a aluna a não descer além da linha do tronco."],
                ["Progressão de carga", "Subir a carga só quando completar todas as séries no topo da faixa de repetições."],
              ].map(([h, p]) => (
                <div key={h} style={{ flex: 1, borderRadius: 10, background: "#151515", padding: 14 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{h}</div>
                  <div style={{ fontSize: 12.5, color: K.textSoft, marginTop: 6, lineHeight: 1.5 }}>{p}</div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{ display: "flex", gap: 10 }}>
            {PREVIEW_DAYS.map((d, i) => {
              const ok = reviewed > i;
              return (
                <Card key={d.title} style={{ flex: 1, padding: 14, border: `1px solid ${i === Math.min(reviewed, 2) && !canApprove ? "rgba(0,229,255,0.45)" : K.ghost}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ fontFamily: mono, fontWeight: 600, color: DAY_TONES[i] }}>DIA {"ABC"[i]}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: ok ? K.success : K.textDim, fontWeight: 600 }}>
                      {ok ? <CircleCheck size={12} /> : <span style={{ width: 9, height: 9, borderRadius: 5, border: `1.5px solid ${K.textDim}` }} />}
                      {ok ? "Revisada" : "A revisar"}
                    </span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
                  <div style={{ fontFamily: mono, fontSize: 11.5, color: K.textDim, marginTop: 6 }}>{d.meta}</div>
                </Card>
              );
            })}
          </div>
          <Card>
            <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <DayBadge i={0} letter="A" />
                <H size={20} style={{ marginTop: 10 }}>Superior A · Peito e Costas</H>
                <div style={{ fontSize: 12, color: K.textDim, marginTop: 4 }}>PEITO / COSTAS / TRÍCEPS</div>
                <div style={{ fontFamily: mono, fontSize: 12, color: K.textSoft, marginTop: 6 }}>6 exercícios · 18 séries · ~55 min · Intermediário</div>
              </div>
              <Btn h={36} style={{ fontSize: 13 }}>
                <Pencil size={13} /> Editar ficha
              </Btn>
            </div>
            <div style={{ display: "flex", padding: "10px 20px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: K.textDim, borderTop: `1px solid ${K.ghost}`, borderBottom: `1px solid ${K.ghost}` }}>
              <span style={{ width: 50 }}>#</span>
              <span style={{ width: 300 }}>EXERCÍCIO</span>
              <span style={{ width: 120 }}>SÉRIES × REPS</span>
              <span style={{ width: 190 }}>CARGA</span>
              <span>DESCANSO</span>
            </div>
            {PREVIEW_ROWS.map((r, i) =>
              "section" in r ? (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: K.textDim, borderTop: `1px solid ${K.ghost}` }}>
                  <Dot color={r.color} size={5} /> {r.section.toUpperCase()}
                </div>
              ) : (
                <div key={i} style={{ display: "flex", padding: "12px 20px", fontSize: 13.5, borderTop: `1px solid ${K.ghost}` }}>
                  <span style={{ width: 50, fontFamily: mono, color: K.textMuted }}>{r.n}</span>
                  <span style={{ width: 300, paddingRight: 20 }}>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: K.textDim, marginTop: 2 }}>{r.sub}</div>
                    {"warn" in r && (
                      <div style={{ display: "flex", gap: 6, fontSize: 12, color: K.warn, marginTop: 6 }}>
                        <TriangleAlert size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {r.warn}
                      </div>
                    )}
                  </span>
                  <span style={{ width: 120, fontFamily: mono }}>{r.sets}</span>
                  <span style={{ width: 190 }}>{r.load}</span>
                  <span style={{ fontFamily: mono }}>{r.rest}</span>
                </div>
              ),
            )}
          </Card>
        </div>
        <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: display, fontWeight: 700, fontStretch: SEMI, fontSize: 15 }}>Seu pedido</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: K.primary }}>Ajustar</span>
            </div>
            <div style={{ fontSize: 13, color: K.textSoft, marginTop: 10, lineHeight: 1.5 }}>{REQUEST}</div>
            <div style={{ fontFamily: mono, fontSize: 11.5, color: K.textMuted, marginTop: 10, lineHeight: 1.6 }}>Divisão · 3 fichas · até 60 min · Intermediário</div>
          </Card>
          <Card style={{ padding: 18 }}>
            <span style={{ fontFamily: display, fontWeight: 700, fontStretch: SEMI, fontSize: 15 }}>Como a IA entendeu</span>
            <div style={{ fontSize: 12.5, color: K.textDim, marginTop: 4 }}>Confira se bate com o que você pediu.</div>
            {[
              ["Divisão ABC", "Superior A, inferior e superior B, alternando os grupos ao longo da semana."],
              ["Foco em peito e costas", "Mais séries de empurrar e puxar nos dois treinos de superior."],
              ["Ombro preservado", "Pegada neutra e amplitude controlada nos supinos."],
              ["Até 60 minutos", "Descansos ajustados para caber no tempo pedido."],
            ].map(([h, p]) => (
              <div key={h} style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <CheckIcon size={15} color={K.success} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h}</div>
                  <div style={{ fontSize: 12, color: K.textDim, marginTop: 3, lineHeight: 1.45 }}>{p}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
      <Footer
        left={
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 13, color: K.textSoft }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${declared ? K.primary : K.textDim}`, background: declared ? K.primary : undefined, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {declared && <CheckIcon size={12} color={K.onPrimary} strokeWidth={3} />}
              </span>
              Declaro que revisei as fichas
            </span>
            <span style={{ fontFamily: mono, color: K.textDim }}>{reviewed} de 3 revisadas</span>
          </div>
        }
        right={
          <>
            <span style={{ fontSize: 14, fontWeight: 600, color: K.alert, padding: "0 10px" }}>Descartar prévia</span>
            <Btn h={44}>
              <RefreshCw size={15} /> Gerar de novo
            </Btn>
            <Btn kind={canApprove ? "primary" : "disabled"} h={44} style={{ scale: String(1 - Math.sin(ar(t, approveAt - 0.05, approveAt + 0.25, 0, 1, IN_OUT) * Math.PI) * 0.05) }}>
              {canApprove ? <ShieldCheck size={16} /> : <Lock size={15} />} {sent ? "Enviando…" : "Aprovar e enviar para Ana"}
            </Btn>
          </>
        }
      />
    </>
  );
};

/** Toast de sucesso do painel (sonner, tema escuro). */
export const SuccessToast: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => (
  <div
    style={{
      position: "absolute",
      right: 28,
      bottom: 96,
      width: 420,
      display: "flex",
      gap: 12,
      padding: "16px 18px",
      borderRadius: 12,
      background: "#0f2416",
      border: "1px solid rgba(74,222,128,0.28)",
      color: K.success,
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 1.45,
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      opacity: p,
      translate: `0 ${(1 - p) * 30}px`,
      zIndex: 40,
    }}
  >
    <CircleCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
    <span>{children}</span>
  </div>
);

/* ───────────── Convite ───────────── */

export const InviteModal: React.FC<{ t: number; createAt: number }> = ({ t, createAt }) => {
  const created = t > createAt + 0.2;
  const name = typed("Mariana – turma da manhã", ar(t, 0.6, 1.8, 0, 1, (x) => x));
  const p = ar(t, 0, 0.45);
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.6 * p})`, backdropFilter: `blur(${6 * p}px)`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div
        style={{
          width: 500,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.10)",
          background: K.surface1,
          padding: 28,
          boxShadow: "0 40px 90px -20px rgba(0,0,0,0.7)",
          opacity: p,
          translate: `0 ${(1 - p) * 14}px`,
          scale: String(0.96 + p * 0.04),
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(0,229,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link2 size={22} color={K.primary} />
          </span>
          <span style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} color={K.textDim} />
          </span>
        </div>
        <div>
          <H size={24}>{created ? "Link de convite pronto" : "Convidar aluno"}</H>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: K.textDim, marginTop: 8 }}>
            {created
              ? "Mande para o aluno. Ao criar a conta no app e digitar o código, ele entra direto na sua carteira. O link vale 7 dias e só pode ser usado uma vez."
              : "Gere um link para mandar pelo WhatsApp. Funciona para quem ainda não tem conta no Kinetic."}
          </div>
        </div>
        {created ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: K.bg, padding: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: K.textMuted }}>Código · Mariana – turma da manhã</span>
              <span style={{ fontFamily: display, fontWeight: 800, fontSize: 26, letterSpacing: "0.12em", color: K.primary }}>K7RAF-Q29M</span>
              <span style={{ fontSize: 13, color: K.textDim }}>app.kinetic.com.br/convite/K7RAF-Q29M</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn h={44} style={{ color: K.textDim }}>
                <Copy size={16} /> Copiar convite
              </Btn>
              <Btn h={44} style={{ background: "#25D366", color: "#000", fontWeight: 700, border: "none" }}>
                <MessageCircle size={16} /> Enviar no WhatsApp
              </Btn>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 14, border: `1px solid ${K.ghost}`, background: K.bg, fontSize: 13, fontWeight: 600 }}>
              <span style={{ flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: K.primaryDim, boxShadow: "inset 0 0 0 1px rgba(0,229,255,0.25)", color: K.primary }}>
                Link (WhatsApp)
              </span>
              <span style={{ flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: K.textDim }}>Já tem conta (e-mail)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: K.textSoft }}>
                Nome do aluno <span style={{ fontWeight: 400, color: K.textMuted }}>(opcional, só para você)</span>
              </span>
              <span style={{ height: 48, borderRadius: 12, border: `1px solid ${K.primary}`, boxShadow: "0 0 0 3px rgba(0,229,255,0.12)", background: K.bg, display: "flex", alignItems: "center", padding: "0 16px", fontSize: 14, color: name ? K.text : K.textMuted }}>
                {name || "Ex.: Maria – turma da manhã"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn h={44} style={{ color: K.textDim }}>
                Cancelar
              </Btn>
              <Btn kind="primary" h={44} style={{ scale: String(1 - Math.sin(ar(t, createAt - 0.05, createAt + 0.25, 0, 1, IN_OUT) * Math.PI) * 0.05) }}>
                <Link2 size={16} /> Gerar link
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ───────────── Avaliações ───────────── */

const METRICS = [
  ["Peso", "63,4 kg"],
  ["Altura", "166 cm"],
  ["Gordura corporal", "21 %"],
  ["Massa muscular", "27,8 kg"],
  ["FC de repouso", "62 bpm"],
];

export const AvaliacoesTab: React.FC<{ t: number; saveAt: number }> = ({ t, saveAt }) => {
  const saved = ar(t, saveAt + 0.3, saveAt + 0.8);
  return (
    <>
      <StudentTabs active="Avaliações" />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <H size={22}>Avaliações físicas</H>
          <div style={{ fontSize: 13, color: K.textDim, marginTop: 6 }}>Última em {saved > 0.5 ? "20/10/2026" : "18/08/2026"}</div>
        </div>
        <span style={{ display: "flex", gap: 10 }}>
          <Btn h={44} style={{ color: K.textSoft }}>
            <FileText size={16} /> Relatório de evolução
          </Btn>
          <Btn kind="primary" h={44}>
            <Plus size={16} /> Nova avaliação
          </Btn>
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { date: "20/10/2026", imc: "IMC 23,0", vals: METRICS, note: "Ganhou massa magra no ciclo; ombro sem dor nos supinos.", p: saved },
          { date: "18/08/2026", imc: "IMC 22,8", vals: [["Peso", "62,8 kg"], ["Altura", "166 cm"], ["Gordura corporal", "24 %"], ["Massa muscular", "25,9 kg"], ["FC de repouso", "66 bpm"]], note: "Início do protocolo de hipertrofia.", p: 1 },
        ].map((a) => (
          <Card key={a.date} style={{ padding: 18, opacity: a.p, translate: `0 ${(1 - a.p) * -14}px`, display: a.p === 0 ? "none" : undefined }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{a.date}</span>
              <span style={{ fontSize: 12.5, color: K.textDim }}>por Rafael Costa</span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: K.surface2, color: K.textSoft }}>{a.imc}</span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <Btn h={30} style={{ padding: "0 8px" }}>
                  <Pencil size={13} color={K.textDim} />
                </Btn>
                <Btn h={30} style={{ padding: "0 8px" }}>
                  <Trash2 size={13} color={K.textDim} />
                </Btn>
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {a.vals.map(([l, v]) => (
                <div key={l} style={{ width: 170, borderRadius: 10, background: "#151515", padding: "10px 12px" }}>
                  <div style={{ fontSize: 12, color: K.textDim }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: K.textSoft, marginTop: 12 }}>{a.note}</div>
          </Card>
        ))}
      </div>
    </>
  );
};

export const AssessmentModal: React.FC<{ t: number; saveAt: number }> = ({ t, saveAt }) => {
  const modal = ar(t, 0.2, 0.6) * ar(t, saveAt + 0.15, saveAt + 0.45, 1, 0);
  const fill = (i: number) => t > 0.8 + i * 0.22;
  const FIELDS = [
    ["Peso", "(kg)", "63,4"],
    ["Altura", "(cm)", "166"],
    ["Gordura corporal", "(%)", "21"],
    ["Massa muscular", "(kg)", "27,8"],
  ];
  if (modal <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.6 * modal})`, backdropFilter: `blur(${6 * modal}px)`, zIndex: 50 }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 90,
              translate: `-50% ${(1 - modal) * 14}px`,
              width: 510,
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.10)",
              background: K.surface1,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              opacity: modal,
            }}
          >
            <H size={22}>Nova avaliação</H>
            <div style={{ fontSize: 13.5, color: K.textDim, marginTop: -8 }}>Preencha só o que você mediu. Use vírgula ou ponto nas casas decimais.</div>
            <Field label="Data" value="20/10/2026" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {FIELDS.map(([l, u, v], i) => (
                <Field key={l} label={l} unit={u} value={fill(i) ? v : ""} focus={fill(i) && !fill(i + 1)} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: K.primary }}>
              <Ruler size={14} /> Adicionar circunferências
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn h={44} style={{ color: K.textDim }}>
                Cancelar
              </Btn>
              <Btn kind="primary" h={44} style={{ scale: String(1 - Math.sin(ar(t, saveAt - 0.05, saveAt + 0.25, 0, 1, IN_OUT) * Math.PI) * 0.05) }}>
                {t > saveAt ? "Salvando…" : "Salvar avaliação"}
              </Btn>
            </div>
          </div>
        </div>
  );
};

const Field: React.FC<{ label: string; unit?: string; value: string; focus?: boolean }> = ({ label, unit, value, focus }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: K.textSoft }}>
      {label} {unit && <span style={{ fontWeight: 400, color: K.textMuted }}>{unit}</span>}
    </span>
    <span
      style={{
        height: 46,
        borderRadius: 12,
        border: `1px solid ${focus ? K.primary : K.ghost}`,
        boxShadow: focus ? "0 0 0 3px rgba(0,229,255,0.12)" : undefined,
        background: "#151515",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        fontSize: 15,
      }}
    >
      {value}
    </span>
  </div>
);

/* ───────────── Financeiro (tela sem a barra lateral) ───────────── */

export const FinancePage: React.FC<{ t: number }> = ({ t }) => {
  const c = ar(t, 0.3, 1.6, 0, 1, IN_OUT);
  const KPIS = [
    { label: "Previsto no mês", value: 4860 * c, icon: Wallet, color: K.primary },
    { label: "Recebido", value: 3960 * c, icon: CheckIcon, color: K.success },
    { label: "Em aberto", value: 680 * c, icon: Clock, color: K.warn },
    { label: "Atrasado", value: 220 * c, icon: TriangleAlert, color: K.alert, sub: "1 cobrança" },
  ];
  const paidAt = 2.2;
  const CHARGES = [
    { name: "Ana Souza", v: "R$ 180,00", info: "vence 10/10 · pago em 09/10 (Pix)", st: "Pago" },
    { name: "Carla Mendes", v: "R$ 220,00", info: "vence 10/10 · pago em 10/10 (Pix)", st: "Pago" },
    { name: "Diego Rocha", v: "R$ 220,00", info: t > paidAt ? "vence 15/10 · pago em 20/10 (Pix)" : "vence 15/10 · atrasada há 5 dias", st: t > paidAt ? "Pago" : "Atrasado" },
    { name: "Felipe Nunes", v: "R$ 180,00", info: "vence 25/10", st: "Em aberto" },
  ];
  const stColor: Record<string, string> = { Pago: K.success, Atrasado: K.alert, "Em aberto": K.warn };
  return (
    <div style={{ position: "absolute", inset: 0, background: K.bg, fontFamily: sans, color: K.text }}>
      <div style={{ height: 68, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Btn h={40} style={{ padding: "0 11px" }}>
          <ArrowLeft size={16} color={K.textDim} />
        </Btn>
        <div style={{ flex: 1 }}>
          <H size={18}>Financeiro</H>
          <div style={{ fontSize: 12.5, color: K.textDim, marginTop: 2 }}>Mensalidades dos seus alunos</div>
        </div>
        <Btn h={42} style={{ gap: 22 }}>
          <ChevronRight size={15} style={{ rotate: "180deg" }} color={K.textDim} /> Outubro de 2026 <ChevronRight size={15} color={K.textDim} />
        </Btn>
      </div>
      <div style={{ position: "absolute", left: 250, right: 250, top: 108, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", gap: 16 }}>
          {KPIS.map((k, i) => {
            const Icon = k.icon;
            const p = ar(t, 0.1 + i * 0.1, 0.6 + i * 0.1);
            return (
              <Card key={k.label} style={{ flex: 1, padding: 20, height: 146, opacity: p, translate: `0 ${(1 - p) * 14}px` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: K.textSoft }}>{k.label}</span>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: `${k.color}1f`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={17} color={k.color} />
                  </span>
                </div>
                <div style={{ fontFamily: display, fontWeight: 800, fontStretch: SEMI, fontSize: 26, marginTop: 14 }}>R$ {br(k.value, 2)}</div>
                {k.sub && <div style={{ fontSize: 12, color: K.textDim, marginTop: 6 }}>{k.sub}</div>}
              </Card>
            );
          })}
        </div>
        <Card style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", fontSize: 14, color: K.textSoft }}>
          <KeyRound size={15} color={K.primary} /> Chave Pix nos lembretes: <b style={{ color: K.text }}>rafael@kinetic.app</b>
          <span style={{ marginLeft: "auto", color: K.primary, fontWeight: 600, fontSize: 13 }}>Alterar</span>
        </Card>
        <div>
          <H size={20} style={{ marginBottom: 14 }}>Cobranças</H>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CHARGES.map((ch, i) => {
              const p = ar(t, 0.6 + i * 0.12, 1.1 + i * 0.12);
              const flash = ch.name === "Diego Rocha" ? ar(t, paidAt, paidAt + 0.2) * ar(t, paidAt + 0.6, paidAt + 1.2, 1, 0) : 0;
              return (
                <Card key={ch.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", opacity: p, background: flash ? `rgba(74,222,128,${0.08 * flash})` : K.surface1 }}>
                  <DeskAvatar name={ch.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ch.name}</div>
                    <div style={{ fontSize: 12.5, color: K.textDim, marginTop: 2 }}>
                      {ch.v} · {ch.info}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, color: stColor[ch.st], background: `${stColor[ch.st]}1f` }}>{ch.st}</span>
                  {ch.st === "Pago" ? (
                    <Btn h={36} style={{ fontSize: 13, color: K.textDim, background: "transparent" }}>
                      <RotateCcw size={13} /> Desfazer
                    </Btn>
                  ) : (
                    <>
                      <Btn h={36} style={{ fontSize: 13, color: "#25D366", border: "1px solid rgba(37,211,102,0.4)", background: "transparent" }}>
                        <MessageCircle size={15} /> Lembrar
                      </Btn>
                      <Btn h={36} style={{ fontSize: 13, color: K.textDim, background: "transparent" }}>
                        Dispensar
                      </Btn>
                      <Btn kind="primary" h={36} style={{ fontSize: 13, fontWeight: 700, scale: ch.name === "Diego Rocha" ? String(1 - Math.sin(ar(t, paidAt - 0.3, paidAt, 0, 1, IN_OUT) * Math.PI) * 0.06) : undefined }}>
                        <CheckIcon size={15} /> Recebi
                      </Btn>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
