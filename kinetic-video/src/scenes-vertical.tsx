import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { CommunityScreen, HomeScreen, ProgressScreen, PushBanner, SessionScreen } from "./app-screens";
import {
  AiGerando,
  AiHeader,
  AiPedido,
  AiPrevia,
  AssessmentModal,
  AvaliacoesTab,
  Content,
  Dashboard,
  FinancePage,
  InviteModal,
  Shell,
  StudentHeader,
  SuccessToast,
  TopRightDefault,
  TreinosTab,
} from "./desk";
import { APP_STEP, CHAOS, INCLUDED, MG, PLANS, Stages } from "./scenes";
import { K, mono, sans } from "./theme";
import {
  ar,
  Background,
  Browser,
  BROWSER_H,
  BROWSER_W,
  clickAt,
  Cursor,
  IN_OUT,
  keys,
  Kicker,
  Logo,
  LogoMark,
  Phone,
  press,
  SPRING,
  Sub,
  useAnim,
  Words,
} from "./ui";

/*
 * Versão 9:16 (Reels, TikTok, Shorts). Mesmas cenas e tempos da horizontal,
 * empilhadas: texto em cima, painel ou celular embaixo. O conteúdo fica entre
 * y≈170 e y≈1650 para não cair sob a interface das redes (topo e legenda/ações).
 */
const W = 1080;

/* Navegador centralizado embaixo do texto, entrando de baixo com inclinação. */
const V_DESK = 0.72;
const DeskStageV: React.FC<{ url: string; children: React.ReactNode; top?: number }> = ({ url, children, top = 720 }) => {
  const { a, sec } = useAnim();
  return (
    <div
      style={{
        position: "absolute",
        left: (W - BROWSER_W) / 2,
        top,
        width: BROWSER_W,
        height: BROWSER_H,
        transformOrigin: "50% 0",
        transform: `perspective(2600px) rotateX(${a(0, 1.3, 20, 4) + a(1.3, 20, 0, -2, Easing.linear)}deg) scale(${V_DESK})`,
        opacity: a(0, 0.5),
        translate: `0 ${a(0, 1.3, 220, 0) + Math.sin(sec * 0.8) * 5}px`,
      }}
    >
      <Browser url={url}>{children}</Browser>
    </div>
  );
};

const TextTop: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 200 }) => (
  <div style={{ position: "absolute", left: 80, right: 80, top, display: "flex", flexDirection: "column", gap: 26 }}>{children}</div>
);

/* ───────────── 1. Abertura ───────────── */
export const IntroV: React.FC = () => {
  const { a } = useAnim();
  return (
    <AbsoluteFill>
      <Background glowX={50} glowY={45} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46, scale: String(a(0, 4.5, 1, 1.05, Easing.linear)) }}>
        <LogoMark height={170} progress={[a(0.2, 0.8, 0, 1, SPRING), a(0.32, 0.92, 0, 1, SPRING), a(0.44, 1.04, 0, 1, SPRING)]} />
        <div
          style={{
            fontFamily: sans,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 150,
            letterSpacing: "0.06em",
            color: K.text,
            lineHeight: 1,
            clipPath: `inset(-10% ${a(0.7, 1.5, 100, 0, IN_OUT)}% -10% 0)`,
            translate: `${a(0.7, 1.5, -40, 0)}px 0`,
          }}
        >
          KINETIC
        </div>
        <Words text="Treino com *método." delay={1.7} size={66} weight={500} font={sans} stagger={0.09} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────── 2. O problema ───────────── */
const CHAOS_POS = [
  { x: -150, y: -170, r: -8 },
  { x: 170, y: -10, r: 7 },
  { x: -170, y: 150, r: 5 },
  { x: 150, y: 310, r: -6 },
  { x: -90, y: 470, r: 3 },
];

export const ProblemV: React.FC = () => {
  const { a, sec } = useAnim();
  const pull = a(3.2, 4.1, 0, 1, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill>
      <Background glowX={50} glowY={55} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 230 }}>
        <Words text="Seu trabalho espalhado em *5 *lugares?" delay={0.2} out={3.0} size={100} style={{ justifyContent: "center" }} />
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {CHAOS.map((c, i) => {
          const pos = CHAOS_POS[i];
          const inP = a(0.5 + i * 0.18, 1.2 + i * 0.18, 0, 1, SPRING);
          const fx = Math.sin(sec * 1.3 + i * 2) * 10;
          const fy = Math.cos(sec * 1.1 + i) * 10;
          return (
            <div
              key={c.title}
              style={{
                position: "absolute",
                translate: `${(pos.x + fx) * (1 - pull)}px ${(pos.y + fy) * (1 - pull)}px`,
                rotate: `${pos.r + Math.sin(sec * 2 + i) * 2 + pull * 120}deg`,
                scale: String(inP * (1 - pull)),
                width: 500,
                padding: "24px 26px",
                borderRadius: 22,
                background: K.surface1,
                border: `1px solid ${K.ghostHi}`,
                boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 18,
                fontFamily: sans,
              }}
            >
              <span style={{ width: 66, height: 66, borderRadius: 15, background: c.color, color: "#fff", fontWeight: 800, fontSize: 21, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {c.tag}
              </span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 600, color: K.text }}>{c.title}</div>
                <div style={{ fontSize: 20, color: K.textMuted, marginTop: 4 }}>{c.sub}</div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 70px" }}>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: 150, border: `4px solid ${K.primary}`, scale: String(a(4.0, 4.9, 0.1, 4)), opacity: a(4.0, 4.1) * a(4.3, 4.9, 1, 0) }} />
        <Words text="Agora num *só *lugar." delay={4.25} size={124} style={{ justifyContent: "center" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────── 3. Visão geral do painel ───────────── */
export const OverviewSceneV: React.FC = () => {
  const { sec } = useAnim();
  const scroll = keys(sec, [3.6, 4.6, 7.0, 8.0], [0, 330, 330, 640]);
  const cx = keys(sec, [4.4, 5.4, 7.6, 8.6], [1300, 1045, 1045, 1300]);
  const cy = keys(sec, [4.4, 5.4, 7.6, 8.6], [820, 488, 488, 640]);
  return (
    <AbsoluteFill>
      <Background glowX={50} glowY={65} />
      <TextTop>
        <Kicker delay={0.2}>Painel do personal</Kicker>
        <Stages
          size={78}
          height={380}
          stages={[
            { title: "Seu dia começa *pronto.", sub: "A fila de hoje junta o que pede ação: prévias da IA e alunos em risco.", at: 0.4, out: 4.4 },
            { title: "Ache quem está *sumindo *antes.", sub: "Alerta de abandono e um clique para chamar no WhatsApp.", at: 4.9 },
          ]}
        />
      </TextTop>
      <DeskStageV url="app.kinetic.com.br/students">
        <Shell crumb="Visão geral" topRight={<TopRightDefault />}>
          <Dashboard t={sec} scroll={scroll} />
        </Shell>
        <Cursor x={cx} y={cy} click={clickAt(sec, 99)} opacity={ar(sec, 4.3, 4.6) * ar(sec, 8.7, 9, 1, 0)} />
      </DeskStageV>
    </AbsoluteFill>
  );
};

/* ───────────── 4. Ficha com IA ───────────── */
export const AiSceneV: React.FC = () => {
  const { sec } = useAnim();
  const B = 2.2;
  const C = 6.4;
  const D = 9.0;
  const approveAt = D + 3.9;
  const phase = sec < B ? 0 : sec < C ? 1 : sec < D ? 2 : 3;
  const fade = (start: number) => ar(sec, start, start + 0.3);
  const cx = keys(sec, [0.4, 1.3, B + 1.2, B + 3.4, D + 3.2, D + 3.7], [900, 1184, 1184, 1309, 1309, 1272]);
  const cy = keys(sec, [0.4, 1.3, B + 1.2, B + 3.4, D + 3.2, D + 3.7], [600, 186, 186, 862, 862, 862]);
  const click = sec < B ? clickAt(sec, 1.5) : sec < C ? clickAt(sec, B + 3.9) : clickAt(sec, approveAt);
  const draft =
    phase === 1 ? { label: "Pedido em edição", generating: false, t: sec } : phase === 2 ? { label: "Gerando prévia…", generating: true, t: sec } : phase === 3 && sec < approveAt ? { label: "Prévia · 0 de 3 revisadas", generating: false, t: sec } : undefined;
  return (
    <AbsoluteFill>
      <Background glowX={50} glowY={65} />
      <TextTop>
        <Kicker delay={0.2}>Prescrição com IA</Kicker>
        <Stages
          size={78}
          height={380}
          stages={[
            { title: "Ficha com *IA, do *seu *jeito.", sub: "Você descreve o treino. A IA considera a anamnese e as restrições do aluno.", at: 0.4, out: C - 0.4 },
            { title: "A IA monta. *Você *aprova.", sub: "Pontos de atenção apontados, e nada vai para o app sem a sua revisão.", at: C + 0.1 },
          ]}
        />
      </TextTop>
      <DeskStageV url="app.kinetic.com.br/students/ana-souza">
        <Shell crumb={<><span>Alunos</span><span style={{ color: K.textMuted }}>/</span><span style={{ color: K.text }}>Ana Souza</span></>} draft={draft}>
          {phase === 0 && (
            <Content top={24}>
              <TreinosTab t={sec} pressAI={press(sec, 1.5)} />
            </Content>
          )}
          {phase === 1 && (
            <div style={{ opacity: fade(B) }}>
              <Content top={24}>
                <AiHeader step={0} sub="Para Ana" />
                <AiPedido t={sec - B} generateAt={3.9} />
              </Content>
            </div>
          )}
          {phase === 2 && (
            <div style={{ opacity: fade(C) }}>
              <Content top={24}>
                <AiHeader step={0} sub="Para Ana · gerando a prévia · pode sair desta tela, avisamos quando ficar pronta" />
                <AiGerando t={sec - C} />
              </Content>
            </div>
          )}
          {phase === 3 && (
            <div style={{ opacity: fade(D) }}>
              <Content top={24}>
                <AiHeader step={sec > approveAt ? 2 : 1} sub="Para Ana · revise cada ficha antes de aprovar" />
                <AiPrevia t={sec - D} approveAt={3.9} />
              </Content>
            </div>
          )}
        </Shell>
        <SuccessToast p={ar(sec, approveAt + 0.5, approveAt + 0.9)}>
          3 fichas aprovadas. Já aparecem no app de Ana, prescritas por você. As fichas anteriores saíram do app.
        </SuccessToast>
        <Cursor x={cx} y={cy} click={click} opacity={ar(sec, 0.3, 0.6) * (phase === 2 ? 0 : 1) * ar(sec, approveAt + 0.8, approveAt + 1.1, 1, 0)} />
      </DeskStageV>
    </AbsoluteFill>
  );
};

/* ───────────── 5. A ponte ───────────── */
export const BridgeV: React.FC = () => {
  const { a, sec } = useAnim();
  const p = a(0.8, 2.1, 0, 1, IN_OUT);
  const from = { x: 540, y: 760 };
  const to = { x: 790, y: 1240 };
  const ctrl = { x: 200, y: 1080 };
  const bx = (1 - p) ** 2 * from.x + 2 * (1 - p) * p * ctrl.x + p ** 2 * to.x;
  const by = (1 - p) ** 2 * from.y + 2 * (1 - p) * p * ctrl.y + p ** 2 * to.y;
  const shake = sec > 2.1 ? Math.sin((sec - 2.1) * 60) * 3 * a(2.1, 2.7, 1, 0) : 0;
  return (
    <AbsoluteFill>
      <Background glowX={50} glowY={55} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 190 }}>
        <Words text="Aprovou. *Chegou." delay={0.1} size={116} style={{ justifyContent: "center" }} />
      </div>
      <div style={{ position: "absolute", left: (W - BROWSER_W * 0.6) / 2, top: 490, scale: "0.6", transformOrigin: "left top", opacity: a(0, 0.5) }}>
        <Browser url="app.kinetic.com.br/students/ana-souza">
          <Shell crumb={<><span>Alunos</span><span style={{ color: K.textMuted }}>/</span><span style={{ color: K.text }}>Ana Souza</span></>}>
            <Content top={24}>
              <AiHeader step={2} sub="Para Ana · revise cada ficha antes de aprovar" />
              <AiPrevia t={6} approveAt={3.9} />
            </Content>
          </Shell>
          <SuccessToast p={1}>3 fichas aprovadas. Já aparecem no app de Ana, prescritas por você. As fichas anteriores saíram do app.</SuccessToast>
        </Browser>
      </div>
      <div style={{ position: "absolute", left: 630, top: 1010, scale: "0.74", transformOrigin: "left top", rotate: `${shake}deg`, opacity: a(0, 0.5) }}>
        <Phone>
          <HomeScreen t={5} />
          <PushBanner p={a(2.1, 2.5, 0, 1, SPRING)} />
        </Phone>
      </div>
      <svg width={W} height="1920" style={{ position: "absolute", inset: 0 }}>
        <path
          d={`M${from.x},${from.y} Q${ctrl.x},${ctrl.y} ${to.x},${to.y}`}
          fill="none"
          stroke={K.primary}
          strokeWidth="3"
          strokeDasharray="10 14"
          opacity={0.6 * a(2.2, 2.8, 1, 0)}
          style={{ clipPath: `inset(0 0 ${1920 - by}px 0)` }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: bx,
          top: by,
          translate: "-50% -50%",
          scale: String(a(0.5, 0.9, 0.6, 1, SPRING) * (1 - p * 0.45) * a(2.0, 2.2, 1, 0)),
          rotate: `${Math.sin(p * Math.PI) * -8}deg`,
          width: 440,
          padding: 24,
          borderRadius: 20,
          background: K.surface1,
          border: `2px solid ${K.primary}`,
          boxShadow: "0 0 60px rgba(0,229,255,0.45), 0 30px 60px rgba(0,0,0,0.5)",
          fontFamily: sans,
          color: K.text,
          opacity: a(0.5, 0.8),
        }}
      >
        <div style={{ fontSize: 15, letterSpacing: "0.14em", color: K.primary, fontWeight: 700 }}>3 FICHAS APROVADAS</div>
        {["A · Superior · Peito e Costas", "B · Inferior · Quadríceps e Posterior", "C · Superior · Ombro e Braços"].map((n) => (
          <div key={n} style={{ fontSize: 19, fontWeight: 600, marginTop: 10, whiteSpace: "nowrap" }}>
            {n}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 80, top: 1230, width: 500 }}>
        <Sub delay={2.6} style={{ fontSize: 44, color: K.text, lineHeight: 1.25 }}>
          O aluno recebe as fichas <span style={{ color: K.primary }}>direto no app.</span>
        </Sub>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 6. App do aluno ───────────── */
export const AppSceneV: React.FC = () => {
  const { a, sec } = useAnim();
  const screens = [
    (t: number) => <HomeScreen t={t} pressAt={2.7} />,
    (t: number) => <SessionScreen t={t} confirmAt={1.5} />,
    (t: number) => <ProgressScreen t={t} />,
    (t: number) => <CommunityScreen t={t} />,
  ];
  const STAGES = [
    { title: "Treino do dia *na *mão.", sub: "A ficha prescrita pelo personal, pronta para começar." },
    { title: "Registro série a *série.", sub: "Carga, repetições e a observação do personal." },
    { title: "Evolução que dá *pra *ver.", sub: "Consistência, volume e recordes a cada treino." },
    { title: "Comunidade que *motiva.", sub: "Treinos compartilhados e a turma do seu personal." },
  ];
  return (
    <AbsoluteFill>
      <Background glowX={50} glowY={70} />
      <TextTop top={190}>
        <Kicker delay={0.2}>App do aluno · grátis</Kicker>
        <Stages size={80} height={330} stages={STAGES.map((s, i) => ({ ...s, at: 0.3 + i * APP_STEP, out: i < 3 ? (i + 1) * APP_STEP - 0.25 : undefined }))} />
      </TextTop>
      <div
        style={{
          position: "absolute",
          left: (W - 400 * 0.98) / 2,
          top: 660,
          scale: "0.98",
          transformOrigin: "left top",
          opacity: a(0, 0.5),
          translate: `${Math.sin(sec * 0.7) * 6}px ${a(0, 1.2, 160, 0) + Math.cos(sec * 0.9) * 8}px`,
          transform: `perspective(2400px) rotateY(${a(0, 1.2, 18, -6) + Math.sin(sec * 0.5) * 3}deg)`,
        }}
      >
        <Phone>
          {screens.map((render, i) => {
            const start = i * APP_STEP;
            const enter = i === 0 ? 1 : a(start - 0.25, start + 0.3, 0, 1, IN_OUT);
            const exit = i === 3 ? 0 : a(start + APP_STEP - 0.25, start + APP_STEP + 0.3, 0, 1, IN_OUT);
            if (enter === 0 || exit === 1) return null;
            return (
              <div key={i} style={{ position: "absolute", inset: 0, translate: `${(1 - enter) * 100 - exit * 30}% 0`, opacity: 1 - exit, background: K.bg }}>
                {render(Math.max(0, sec - start))}
              </div>
            );
          })}
        </Phone>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 7. Gestão ───────────── */
export const ManageSceneV: React.FC = () => {
  const { sec } = useAnim();
  const stage = sec < MG ? 0 : sec < MG * 2 ? 1 : 2;
  const t = sec - stage * MG;
  const crumbAna = (
    <>
      <span>Alunos</span>
      <span style={{ color: K.textMuted }}>/</span>
      <span style={{ color: K.text }}>Ana Souza</span>
    </>
  );
  const fade = ar(t, 0, 0.3);
  const cursor =
    stage === 0
      ? { x: keys(t, [1.2, 2.0], [1100, 880]), y: keys(t, [1.2, 2.0], [760, 612]), c: clickAt(t, 2.2) }
      : stage === 1
        ? { x: keys(t, [1.4, 2.4], [1100, 890]), y: keys(t, [1.4, 2.4], [780, 707]), c: clickAt(t, 2.6) }
        : { x: keys(t, [1.0, 2.0], [900, 1162]), y: keys(t, [1.0, 2.0], [700, 600]), c: clickAt(t, 2.2) };
  return (
    <AbsoluteFill>
      <Background glowX={50} glowY={65} />
      <TextTop>
        <Kicker delay={0.2}>Gestão da carteira</Kicker>
        <Stages
          size={72}
          height={380}
          stages={[
            { title: "Convide com *um *link.", sub: "Mande pelo WhatsApp: o aluno cria a conta e já entra na sua carteira.", at: 0.3, out: MG - 0.25 },
            { title: "Avaliação física *e *evolução.", sub: "Medidas e relatório de evolução por ciclo, prontos pra mostrar ao aluno.", at: MG + 0.3, out: MG * 2 - 0.25 },
            { title: "Mensalidades no *mesmo *painel.", sub: "Quem pagou, quem está em aberto e lembrete com a sua chave Pix.", at: MG * 2 + 0.3 },
          ]}
        />
      </TextTop>
      <DeskStageV url={stage === 2 ? "app.kinetic.com.br/financeiro" : stage === 1 ? "app.kinetic.com.br/students/ana-souza" : "app.kinetic.com.br/students"}>
        <div style={{ position: "absolute", inset: 0, opacity: stage === 0 ? 1 : fade }}>
          {stage === 0 && (
            <>
              <Shell crumb="Visão geral" topRight={<TopRightDefault />}>
                <Dashboard t={9} />
              </Shell>
              <InviteModal t={t - 0.3} createAt={1.9} />
            </>
          )}
          {stage === 1 && (
            <>
              <Shell crumb={crumbAna}>
                <Content top={24} scroll={keys(t, [0.2, 0.6], [0, 360])}>
                  <StudentHeader />
                  <AvaliacoesTab t={t} saveAt={2.6} />
                </Content>
              </Shell>
              <AssessmentModal t={t} saveAt={2.6} />
            </>
          )}
          {stage === 2 && <FinancePage t={t} />}
        </div>
        <Cursor x={cursor.x} y={cursor.y} click={cursor.c} opacity={ar(t, 0.9, 1.2) * ar(t, 3.6, 3.9, 1, 0)} />
      </DeskStageV>
    </AbsoluteFill>
  );
};

/* ───────────── 8. Planos: cards em 2×2 ───────────── */
export const PricingSceneV: React.FC = () => {
  const { a, sec } = useAnim();
  const S = 1.36;
  const PW = 700;
  const focus = sec < 2.2 ? -1 : Math.min(3, Math.floor((sec - 2.2) / 0.7));
  return (
    <AbsoluteFill>
      <Background glowX={50} glowY={30} />
      <div style={{ position: "absolute", left: (W - PW * S) / 2, top: 180, width: PW, transformOrigin: "left top", scale: String(S), fontFamily: sans, color: K.text }}>
        <div style={{ textAlign: "center", fontFamily: mono, fontSize: 12, letterSpacing: "0.1em", color: K.primary, opacity: a(0.1, 0.5) }}>PLANOS KINETIC</div>
        <Words text="Atenda mais alunos com o *mesmo *tempo de trabalho" delay={0.2} size={38} weight={700} stagger={0.04} style={{ justifyContent: "center", marginTop: 12, fontStretch: "100%", textAlign: "center" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 28 }}>
          {PLANS.map((p, i) => {
            const inP = a(0.6 + i * 0.1, 1.3 + i * 0.1);
            const on = i === focus || (i === 3 && sec > 4.6);
            return (
              <div
                key={p.name}
                style={{
                  borderRadius: 16,
                  padding: 20,
                  background: on ? "linear-gradient(170deg, rgba(0,229,255,0.07), transparent 60%), #1c1b1b" : K.surface1,
                  border: `1px solid ${on ? K.primary : K.ghost}`,
                  boxShadow: on ? "0 0 40px rgba(0,229,255,0.18)" : undefined,
                  opacity: inP,
                  translate: `0 ${(1 - inP) * 40 - (i === focus ? 6 : 0)}px`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{p.name}</span>
                  {i === 3 && <span style={{ fontFamily: mono, fontSize: 10, color: K.success, letterSpacing: "0.04em" }}>MENOR CUSTO/ALUNO</span>}
                </div>
                <div style={{ fontSize: 13, color: K.textDim, marginTop: 4 }}>Até {p.students} alunos ativos</div>
                <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: mono, fontSize: 30, fontWeight: 600 }}>R$ {p.price}</span>
                  <span style={{ fontSize: 13, color: K.textDim }}>/mês</span>
                </div>
                <div style={{ fontFamily: mono, fontSize: 12, color: on ? K.primary : K.textDim, marginTop: 4 }}>R$ {p.per} por aluno</div>
                <div
                  style={{
                    marginTop: 16,
                    height: 40,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    background: i === 3 ? K.primary : "transparent",
                    color: i === 3 ? K.onPrimary : K.text,
                    border: i === 3 ? "none" : "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  Assinar {p.name}
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={K.primary} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {p.ai} fichas com IA por mês
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 26, opacity: a(5.0, 5.4) }}>Todos os planos incluem</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 18, marginTop: 4, borderTop: `1px solid ${K.ghost}` }}>
          {INCLUDED.map((it, i) => {
            const Icon = it.icon;
            const p = a(5.2 + i * 0.12, 5.7 + i * 0.12);
            return (
              <div key={it.title} style={{ display: "flex", gap: 10, padding: "14px 0", borderBottom: `1px solid ${K.ghost}`, opacity: p, translate: `0 ${(1 - p) * 10}px` }}>
                <Icon size={18} color={K.primary} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{it.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 9. Fechamento ───────────── */
/** `hold`: sem o fade final (Stories termina parado no CTA). */
export const OutroV: React.FC<{ hold?: boolean }> = ({ hold = false }) => {
  const { a } = useAnim();
  return (
    <AbsoluteFill>
      <Background glowX={50} glowY={45} />
      <AbsoluteFill style={{ opacity: hold ? 1 : a(4.3, 5, 1, 0, Easing.linear) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center", opacity: a(0.1, 0.6), scale: String(a(0.1, 0.8, 0.9, 1)) }}>
          <Logo size={80} />
        </div>
        <div style={{ position: "absolute", left: 50, top: 400, scale: "0.6", transformOrigin: "left top", opacity: a(0.2, 0.8), translate: `${a(0.2, 1, -80, 0)}px 0` }}>
          <Browser url="app.kinetic.com.br/students">
            <Shell crumb="Visão geral" topRight={<TopRightDefault />}>
              <Dashboard t={9} />
            </Shell>
          </Browser>
        </div>
        <div style={{ position: "absolute", left: 770, top: 690, scale: "0.62", transformOrigin: "left top", opacity: a(0.3, 0.9), translate: `${a(0.3, 1.1, 80, 0)}px 0` }}>
          <Phone>
            <ProgressScreen t={4} />
          </Phone>
        </div>
        <div style={{ position: "absolute", left: 70, right: 70, top: 1270 }}>
          <Words text="Um ecossistema para *todos *os *seus *alunos." delay={1.0} size={76} style={{ justifyContent: "center" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1560, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "20px 44px", borderRadius: 50, background: K.primary, color: K.onPrimary, fontFamily: sans, fontSize: 38, fontWeight: 700, opacity: a(2.0, 2.4), scale: String(a(2.0, 2.5, 0.7, 1, SPRING)) }}>
            Comece com 14 dias grátis
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
