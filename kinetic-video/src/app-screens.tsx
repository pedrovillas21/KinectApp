import React from "react";
import Icon, { IconName } from "./app-icon";
import { K, mono, sans } from "./theme";
import { ar, br, IN_OUT, LogoMark } from "./ui";

/*
 * App do aluno (KineticApp) recriado a partir dos prints. Tela útil 376×836.
 * `t` = segundos desde que a tela abriu.
 */

const TONES = [
  { bg: "#263234", fg: "#00E5FF" },
  { bg: "#3a2f1c", fg: "#F5B13D" },
  { bg: "#1f3326", fg: "#4ade80" },
  { bg: "#262a3a", fg: "#a5b4fc" },
  { bg: "#3a2430", fg: "#f9a8d4" },
];

export const AppAvatar: React.FC<{ name: string; size: number; tone: number; ring?: boolean }> = ({ name, size, tone, ring }) => {
  const parts = name.split(" ");
  const ini = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  const face = (
    <div
      style={{
        width: ring ? size - 6 : size,
        height: ring ? size - 6 : size,
        borderRadius: size,
        background: TONES[tone].bg,
        color: TONES[tone].fg,
        fontWeight: 600,
        fontSize: size * 0.34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {ini}
    </div>
  );
  if (!ring) return face;
  return (
    <div style={{ width: size, height: size, borderRadius: size, border: `1.5px solid ${K.primary}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {face}
    </div>
  );
};

const Screen: React.FC<{ children: React.ReactNode; tab: number }> = ({ children, tab }) => (
  <div style={{ position: "absolute", inset: 0, fontFamily: sans, color: K.text }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 50, bottom: 76, padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
      {children}
    </div>
    <TabBar active={tab} />
  </div>
);

const Box: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ borderRadius: 16, background: K.surface1, border: `1px solid ${K.ghost}`, ...style }}>{children}</div>
);

const TABS: { label: string; icon: IconName }[] = [
  { label: "Início", icon: "home" },
  { label: "Treinos", icon: "dumbbell" },
  { label: "Comunidade", icon: "users" },
  { label: "Progresso", icon: "progress" },
  { label: "Você", icon: "user" },
];

export const TabBar: React.FC<{ active: number }> = ({ active }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 76,
      background: K.bg,
      borderTop: `1px solid ${K.hairline}`,
      display: "flex",
      paddingTop: 10,
      zIndex: 10,
    }}
  >
    {TABS.map((tab, i) => {
      const c = i === active ? K.primary : K.textMuted;
      return (
        <div key={tab.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <Icon name={tab.icon} size={22} color={c} strokeWidth={1.7} />
          <span style={{ fontSize: 10.5, fontWeight: 500, color: c }}>{tab.label}</span>
        </div>
      );
    })}
  </div>
);

/* ───────────── Início ───────────── */

const TODAY = [
  ["Supino com halteres pegada neutra", "4 × 8-10"],
  ["Puxada aberta no pulley", "4 × 10-12"],
  ["Remada cavalinho (máquina)", "3 × 12"],
];

export const HomeScreen: React.FC<{ t: number; pressAt?: number }> = ({ t, pressAt = 99 }) => {
  const inP = (i: number) => ar(t, 0.05 + i * 0.1, 0.5 + i * 0.1);
  const card = (i: number): React.CSSProperties => ({ opacity: inP(i), translate: `0 ${(1 - inP(i)) * 16}px` });
  return (
    <Screen tab={0}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark height={20} />
          <span style={{ fontWeight: 700, fontSize: 21, letterSpacing: "0.04em" }}>KINETIC</span>
        </span>
        <AppAvatar name="Ana Souza" size={34} tone={3} />
      </div>
      <div>
        <div style={{ fontSize: 13.5, color: K.textDim }}>Terça, 20 de outubro</div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, marginTop: 2 }}>Boa noite, Ana</div>
      </div>
      <Box style={{ padding: "12px 6px", display: "flex", justifyContent: "space-between", ...card(0) }}>
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => {
          const today = i === 2;
          const trained = i === 1 || i === 2;
          return (
            <div key={i} style={{ width: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: K.textMuted }}>{d}</span>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: mono,
                  fontSize: 15,
                  border: today ? `2px solid ${K.primary}` : "2px solid transparent",
                  color: today ? K.primary : i < 2 ? K.textMuted : K.text,
                }}
              >
                {18 + i}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: 2, background: trained ? K.primary : "transparent" }} />
            </div>
          );
        })}
      </Box>
      <Box style={{ ...card(1) }}>
        <div style={{ padding: "14px 16px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ color: K.primary }}>Treino de hoje</span>
            <span style={{ color: K.textMuted }}>A</span>
          </div>
          <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: -0.3, marginTop: 6 }}>A · Superior · Peito e Costas</div>
          <div style={{ fontFamily: mono, fontSize: 12.5, color: K.textDim, marginTop: 6 }}>6 exercícios · ~55 min</div>
        </div>
        {TODAY.map(([n, s], i) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderTop: `1px solid ${K.hairline}`, fontSize: 14 }}>
            <span style={{ fontFamily: mono, fontSize: 12, color: K.textMuted }}>{i + 1}</span>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n}</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: K.textSoft }}>{s}</span>
          </div>
        ))}
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${K.hairline}`, fontSize: 13, color: K.textDim }}>+ 3 exercícios</div>
        <div style={{ padding: "4px 16px 14px" }}>
          <div
            style={{
              height: 46,
              borderRadius: 12,
              background: K.primary,
              color: K.onPrimary,
              fontWeight: 600,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              scale: String(1 - Math.sin(ar(t, pressAt - 0.05, pressAt + 0.25, 0, 1, IN_OUT) * Math.PI) * 0.05),
            }}
          >
            <Icon name="play" size={14} color={K.onPrimary} /> Iniciar treino
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: K.textDim, marginTop: 12 }}>
            <AppAvatar name="Rafael Costa" size={20} tone={1} /> Prescrito por Rafael Costa
          </div>
        </div>
      </Box>
      <Box style={{ display: "flex", ...card(2) }}>
        {[
          ["Treinos no mês", "18", "/20"],
          ["Sequência", "4", " dias"],
          ["Volume 7 dias", "27.170", " kg"],
        ].map(([l, v, u], i) => (
          <div key={l} style={{ flex: 1, padding: "12px 12px", borderLeft: i ? `1px solid ${K.hairline}` : undefined }}>
            <div style={{ fontSize: 11.5, color: K.textMuted }}>{l}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontFamily: mono, fontWeight: 600, fontSize: 19 }}>{v}</span>
              <span style={{ fontFamily: mono, fontSize: 12, color: K.textMuted }}>{u}</span>
            </div>
          </div>
        ))}
      </Box>
      <Box style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, ...card(3) }}>
        <AppAvatar name="Rafael Costa" size={40} tone={1} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Rafael Costa</div>
          <div style={{ fontSize: 12, color: K.textDim, marginTop: 2 }}>Seu personal · ver perfil profissional</div>
        </div>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: "#1f3326", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="comment" size={18} color={K.success} />
        </span>
      </Box>
    </Screen>
  );
};

/** Notificação push simulada (o app ainda não envia push). */
export const PushBanner: React.FC<{ p: number }> = ({ p }) => (
  <div
    style={{
      position: "absolute",
      top: 46,
      left: 10,
      right: 10,
      zIndex: 40,
      borderRadius: 20,
      padding: 14,
      background: "rgba(40,40,40,0.95)",
      border: `1px solid ${K.ghostHi}`,
      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
      display: "flex",
      gap: 12,
      alignItems: "center",
      fontFamily: sans,
      color: K.text,
      opacity: p,
      translate: `0 ${(1 - p) * -120}px`,
    }}
  >
    <span style={{ width: 40, height: 40, borderRadius: 11, background: K.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <LogoMark height={15} />
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: K.textMuted }}>
        <span style={{ fontWeight: 700, letterSpacing: "0.06em" }}>KINETIC</span>
        <span>agora</span>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 2 }}>3 fichas novas do Rafael</div>
      <div style={{ fontSize: 13, color: K.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Treino A, B e C já estão no seu app</div>
    </div>
  </div>
);

/* ───────────── Sessão de treino ───────────── */

const SetCard: React.FC<{ n: string; state: "active" | "done" | "locked"; load: string; reps: string; pressed?: number }> = ({ n, state, load, reps, pressed = 0 }) => {
  const active = state === "active";
  const locked = state === "locked";
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 14,
        border: `1px solid ${active ? "rgba(0,229,255,0.35)" : state === "done" ? "rgba(74,222,128,0.3)" : K.ghost}`,
        background: active ? "rgba(0,229,255,0.04)" : K.surface1,
        boxShadow: active ? "0 0 24px rgba(0,229,255,0.08)" : undefined,
        opacity: locked ? 0.45 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Série {n}</span>
        {active && <span style={{ fontSize: 11.5, fontWeight: 600, color: K.primary, background: K.primaryDim, padding: "3px 8px", borderRadius: 999 }}>Em andamento</span>}
        {state === "done" && <span style={{ fontSize: 11.5, fontWeight: 600, color: K.success, background: "rgba(74,222,128,0.12)", padding: "3px 8px", borderRadius: 999 }}>Concluída</span>}
        {locked && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: K.textMuted }}>
            <Icon name="lock" size={11} color={K.textMuted} /> Bloqueada
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {["10 reps", "16 kg (RPE 8)", "90s descanso"].map((c) => (
          <span key={c} style={{ fontSize: 11.5, padding: "4px 8px", borderRadius: 8, background: K.surface2, color: K.textSoft }}>
            {c}
          </span>
        ))}
      </div>
      {state !== "done" && (
        <>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              ["CARGA (KG)", load],
              ["REPS REALIZADAS", reps],
            ].map(([l, v]) => (
              <div key={l} style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", color: K.textMuted, marginBottom: 6 }}>{l}</div>
                <div style={{ height: 44, borderRadius: 10, border: `1px solid ${active ? "rgba(0,229,255,0.25)" : K.ghost}`, background: K.bg, display: "flex", alignItems: "center", padding: "0 12px", fontFamily: mono, fontSize: 15 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              height: 42,
              borderRadius: 10,
              background: active ? K.primary : K.surface2,
              color: active ? K.onPrimary : K.textMuted,
              fontWeight: 600,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              scale: String(1 - Math.sin(pressed * Math.PI) * 0.05),
            }}
          >
            <Icon name="check" size={15} color={active ? K.onPrimary : K.textMuted} strokeWidth={2.4} /> {locked ? "Confirme a série anterior" : "Confirmar série"}
          </div>
        </>
      )}
    </div>
  );
};

export const SessionScreen: React.FC<{ t: number; confirmAt: number }> = ({ t, confirmAt }) => {
  const done = t > confirmAt + 0.2;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: sans, color: K.text }}>
      <div style={{ position: "absolute", left: 16, right: 16, top: 56, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, color: K.textDim }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: 14, background: K.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="arrow-left" size={14} color={K.text} />
            </span>
            Sair da sessão
          </span>
          <span style={{ fontFamily: mono, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="calendar" size={12} color={K.textMuted} /> 12:{String(31 + Math.floor(t)).padStart(2, "0")}
          </span>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: K.textDim }}>
            <span>Exercício 2 de 6</span>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: K.surface3, marginTop: 8 }}>
            <div style={{ height: 3, borderRadius: 2, width: "33%", background: K.primary }} />
          </div>
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2, textTransform: "uppercase" }}>Supino com halteres pegada neutra</div>
        <div style={{ borderRadius: 12, background: K.surface1, borderLeft: `3px solid ${K.primary}`, padding: "10px 12px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", color: K.textMuted }}>OBSERVAÇÃO DO PERSONAL</div>
          <div style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.4 }}>Palmas voltadas uma para a outra para poupar o ombro.</div>
        </div>
        {done ? (
          <>
            <SetCard n="01" state="done" load="16" reps="10" />
            <div style={{ opacity: ar(t, confirmAt + 0.2, confirmAt + 0.6), translate: `0 ${ar(t, confirmAt + 0.2, confirmAt + 0.7, 16, 0)}px` }}>
              <SetCard n="02" state="active" load="16" reps="10" />
            </div>
          </>
        ) : (
          <>
            <SetCard n="01" state="active" load="16" reps="10" pressed={ar(t, confirmAt - 0.1, confirmAt + 0.2)} />
            <SetCard n="02" state="locked" load="16" reps="10" />
          </>
        )}
      </div>
      <div style={{ position: "absolute", left: 16, right: 16, bottom: 22, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: K.textDim }}>{done ? 1 : 0} de 4 séries confirmadas</span>
        <div style={{ width: "100%", height: 50, borderRadius: 12, background: K.surface2, color: K.textMuted, fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          Próximo exercício <Icon name="arrow-right" size={15} color={K.textMuted} />
        </div>
      </div>
    </div>
  );
};

/* ───────────── Progresso ───────────── */

export const ProgressScreen: React.FC<{ t: number }> = ({ t }) => {
  const c = ar(t, 0.2, 1.4, 0, 1, IN_OUT);
  const weeks = [4, 4, 5, 5];
  const pct = 90 * c;
  return (
    <Screen tab={3}>
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>Progresso</div>
        <div style={{ fontSize: 13, color: K.textDim, marginTop: 2 }}>últimos 30 dias</div>
      </div>
      <div style={{ display: "flex", padding: 4, borderRadius: 12, background: K.surface1, fontSize: 14 }}>
        {["Semana", "Mês", "3M", "Ano"].map((s, i) => (
          <span key={s} style={{ flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 9, background: i === 1 ? K.surface3 : undefined, color: i === 1 ? K.text : K.textDim, fontWeight: i === 1 ? 600 : 400 }}>
            {s}
          </span>
        ))}
      </div>
      <Box style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: K.primary }}>Consistência</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontFamily: mono, fontSize: 30, fontWeight: 600 }}>{Math.round(18 * c)}</span>
              <span style={{ fontFamily: mono, fontSize: 18, color: K.textMuted }}> / 20</span>
            </div>
            <div style={{ fontSize: 13, color: K.textDim, marginTop: 2 }}>treinos concluídos</div>
          </div>
          <svg width="76" height="76" viewBox="0 0 76 76">
            <circle cx="38" cy="38" r="32" stroke={K.surface3} strokeWidth="7" fill="none" />
            <circle cx="38" cy="38" r="32" stroke={K.primary} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={201} strokeDashoffset={201 * (1 - pct / 100)} transform="rotate(-90 38 38)" />
            <text x="38" y="43" textAnchor="middle" fill={K.text} fontSize="15" fontWeight="600" fontFamily="Geist Mono">
              {Math.round(pct)}%
            </text>
          </svg>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: K.textDim, marginTop: 14 }}>
          <span>Treinos por semana</span>
          <span>meta 5/sem</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 72, marginTop: 10, borderBottom: `1px solid ${K.hairline}`, position: "relative" }}>
          {weeks.map((w, i) => {
            const h = (w / 5) * 52 * ar(t, 0.4 + i * 0.12, 1.0 + i * 0.12, 0, 1, IN_OUT);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: K.textDim }}>{w}</span>
                <div style={{ width: "100%", height: Math.max(3, h), borderRadius: 4, background: i === 3 ? "#0f7f8c" : "rgba(0,165,184,0.45)" }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6, fontSize: 11, color: K.textMuted, marginTop: 6 }}>
          {[1, 2, 3, 4].map((w) => (
            <span key={w} style={{ flex: 1, textAlign: "center" }}>
              Sem {w}
            </span>
          ))}
        </div>
      </Box>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          ["Volume", `${br(108.4 * c, 1)}t`, "+18% vs anterior", K.success],
          ["Tempo treinando", `${Math.round(16 * c)}h20`, "↑ 2h vs anterior", K.success],
          ["Recordes", `${Math.round(3 * c)} PRs`, "supino, puxada, leg", K.textDim],
          ["Sequência", "4 dias", "melhor: 9 dias", K.textDim],
        ].map(([l, v, s, sc], i) => (
          <Box key={l} style={{ padding: 14, opacity: ar(t, 0.3 + i * 0.08, 0.7 + i * 0.08) }}>
            <div style={{ fontSize: 12.5, color: K.textDim }}>{l}</div>
            <div style={{ fontFamily: mono, fontSize: 21, fontWeight: 600, marginTop: 6 }}>{v}</div>
            <div style={{ fontFamily: mono, fontSize: 11.5, color: sc, marginTop: 4 }}>{s}</div>
          </Box>
        ))}
      </div>
      <Box style={{ padding: 14, border: "1px solid rgba(0,229,255,0.25)", background: "linear-gradient(160deg, rgba(0,229,255,0.07), transparent 60%), #1c1b1b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: K.primary }}>
          <Icon name="sparkle" size={12} color={K.primary} /> Destaque do mês
        </div>
        <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.4 }}>Você bateu 90% da meta e subiu a carga em 3 exercícios. Mantenha o ritmo!</div>
      </Box>
    </Screen>
  );
};

/* ───────────── Comunidade ───────────── */

export const CommunityScreen: React.FC<{ t: number }> = ({ t }) => (
  <Screen tab={2}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
      <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>Comunidade</span>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: K.surface1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="user-plus" size={17} color={K.text} />
      </span>
    </div>
    <div style={{ display: "flex", gap: 22, fontSize: 14.5, borderBottom: `1px solid ${K.hairline}` }}>
      {["Seguindo", "Arena", "Você"].map((s, i) => (
        <span key={s} style={{ paddingBottom: 10, color: i === 0 ? K.text : K.textMuted, fontWeight: i === 0 ? 600 : 400, borderBottom: i === 0 ? `2px solid ${K.primary}` : "2px solid transparent", marginBottom: -1 }}>
          {s}
        </span>
      ))}
    </div>
    <div style={{ display: "flex", gap: 14, paddingBottom: 10, borderBottom: `1px solid ${K.hairline}` }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ width: 54, height: 54, borderRadius: 27, border: `1.5px solid ${K.ghostHi}`, background: K.surface1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="plus" size={18} color={K.primary} />
        </span>
        <span style={{ fontSize: 11, color: K.textDim }}>Seu story</span>
      </div>
      {[
        ["Carla Mendes", 4],
        ["Bruno Lima", 0],
        ["Elisa Prado", 2],
        ["Diego Rocha", 3],
      ].map(([n, tone], i) => (
        <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: ar(t, 0.1 + i * 0.08, 0.5 + i * 0.08) }}>
          <AppAvatar name={n as string} size={54} tone={tone as number} ring={i < 2} />
          <span style={{ fontSize: 11, color: K.textDim }}>{(n as string).split(" ")[0]}</span>
        </div>
      ))}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <AppAvatar name="Carla Mendes" size={38} tone={4} />
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>Carla Mendes</div>
        <div style={{ fontSize: 12, color: K.textMuted }}>Há 29 min</div>
      </div>
    </div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>B · Inferior · Quadríceps e Posterior</div>
      <div style={{ fontSize: 13.5, color: K.textDim, marginTop: 2 }}>Recorde no agachamento hoje!</div>
    </div>
    <div
      style={{
        height: 300,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        background:
          "radial-gradient(120% 80% at 70% 15%, rgba(255,214,170,0.22), transparent 55%), radial-gradient(90% 70% at 20% 90%, rgba(0,229,255,0.10), transparent 60%), linear-gradient(180deg, #2a2522, #0b0b0b)",
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 344 300" style={{ position: "absolute", inset: 0, opacity: 0.55 }}>
        <rect x="40" y="70" width="264" height="10" rx="5" fill="#111" />
        <rect x="22" y="40" width="30" height="70" rx="6" fill="#151515" />
        <rect x="292" y="40" width="30" height="70" rx="6" fill="#151515" />
        <rect x="120" y="150" width="104" height="150" rx="30" fill="#0d0d0d" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 14px", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", background: "linear-gradient(transparent, rgba(0,0,0,0.75))", fontFamily: mono, fontWeight: 600, fontSize: 13.5 }}>
        <LogoMark height={13} />
        <span>14.250 KG</span>
        <span style={{ color: K.primary }}>|</span>
        <span>01:02</span>
        <span style={{ color: K.primary }}>|</span>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>B · INFERIOR</span>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 13.5, color: K.textDim }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, color: t > 1.2 ? K.alert : K.textDim }}>
        <Icon name={t > 1.2 ? "heart-filled" : "heart"} size={18} color={t > 1.2 ? K.alert : K.textDim} />
        <span style={{ fontFamily: mono }}>{Math.round(ar(t, 1.2, 2.6) * 23) + 12}</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="comment" size={17} color={K.textDim} /> <span style={{ fontFamily: mono }}>6</span>
      </span>
    </div>
    <div
      style={{
        position: "absolute",
        right: 0,
        bottom: 14,
        height: 48,
        padding: "0 20px",
        borderRadius: 24,
        background: K.primary,
        color: K.onPrimary,
        fontWeight: 600,
        fontSize: 15,
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 10px 30px rgba(0,229,255,0.25)",
      }}
    >
      <Icon name="plus" size={16} color={K.onPrimary} strokeWidth={2.4} /> Publicar
    </div>
  </Screen>
);
