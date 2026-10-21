import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { display, K, sans } from "./theme";
import {
  ar,
  beat,
  BEAT,
  Bg,
  Caption,
  Check,
  cropSize,
  Headline,
  Kicker,
  LogoMark,
  Phone,
  phoneRect,
  Shot,
  Wordmark,
} from "./ui";

const W = 1080;
const INK = K.onPrimary;
const INK_SOFT = "rgba(0,26,31,0.55)";
const GRAY = "#8e8f90";

/** Cores do título conforme o fundo: no ciano o texto é tinta escura e o destaque branco. */
const onBg = (bg: string) =>
  bg === K.primary ? { a: INK, b: INK_SOFT, hi: "#ffffff" } : { a: K.text, b: GRAY, hi: K.primary };

// ---------- Movimento ----------

type Pose = { x?: number; y?: number; r?: number; s?: number };

/** Entra com mola de `from` até `to` (posição absoluta via left/top). */
const Pop: React.FC<{
  at: number;
  left: number;
  top: number;
  from?: Pose;
  to?: Pose;
  children: React.ReactNode;
  z?: number;
  damping?: number;
  style?: React.CSSProperties;
}> = ({ at, left, top, from = { y: 260, r: -14, s: 0.9 }, to = {}, children, z, damping = 13, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping, mass: 0.7, stiffness: 150 } });
  const l = (a = 0, b = 0) => a + (b - a) * p;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        zIndex: z,
        opacity: frame < at ? 0 : 1,
        transform: `translate(${l(from.x, to.x)}px, ${l(from.y, to.y)}px) rotate(${l(from.r, to.r)}deg) scale(${l(from.s ?? 1, to.s ?? 1)})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Câmera contínua: deriva lenta durante toda a cena, por cima dos cortes. */
const Drift: React.FC<{ dur: number; children: React.ReactNode; amount?: number }> = ({ dur, children, amount = 40 }) => {
  const frame = useCurrentFrame();
  const t = frame / dur;
  return (
    <AbsoluteFill style={{ transform: `translateY(${amount / 2 - t * amount}px) scale(${1 + t * 0.035})` }}>{children}</AbsoluteFill>
  );
};

/** Batida local da cena em frames. */
const lb = (b0: number) => (n: number) => beat(b0 + n) - beat(b0);

const centerX = (w: number) => (W - w) / 2;

// ---------- Cenas ----------

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const L = lb(0);
  const word = "Apresentando";
  if (frame < L(2)) {
    const s = ar(frame, 0, 22, 1.7, 1);
    return (
      <AbsoluteFill>
        <Bg />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 92, letterSpacing: "-0.01em", transform: `scale(${s}) translateY(${-frame * 0.6}px)` }}>
            {[...word].map((c, i) => (
              <span key={i} style={{ color: frame > 3 + i ? K.text : K.primary }}>
                {c}
              </span>
            ))}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  const f = frame - L(2);
  const bars = [0, 3, 6].map((d) => spring({ frame: f - d, fps: 30, config: { damping: 10, mass: 0.6, stiffness: 170 } }));
  const reveal = ar(f, 4, 18);
  return (
    <AbsoluteFill>
      <Bg drift={-f * 2} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 44, transform: `scale(${ar(f, 0, 30, 1.08, 1)})` }}>
          <LogoMark height={150} progress={bars} />
          <div style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }}>
            <Wordmark size={138} />
          </div>
        </div>
        <Kicker delay={10} style={{ fontSize: 28 }}>
          PAINEL DO PERSONAL + APP DO ALUNO
        </Kicker>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const HOOK_BG = [K.bg, K.primary, K.bg, K.primary, K.bg, K.primary];
const HOOK_SCREENS = [5, 4, 10, 2, 3, 7];
const Hook: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const i = Math.min(Math.floor(frame / BEAT), HOOK_BG.length - 1);
  const bg = HOOK_BG[i];
  const c = onBg(bg);
  const t = frame / dur;
  return (
    <AbsoluteFill>
      <Bg color={bg} drift={-frame * 1.5} />
      <Headline
        lines={[
          { words: "SEU MÉTODO.", color: c.a },
          { words: "EM ESCALA.", color: c.b, indent: 110 },
        ]}
        size={134}
        stagger={BEAT}
        hi={c.hi}
        style={{ position: "absolute", left: 70, top: 230 }}
      />
      <div
        style={{
          position: "absolute",
          left: centerX(600),
          top: 700 + interpolate(t, [0, 1], [180, -40]),
          transform: `perspective(2400px) rotateY(${interpolate(t, [0, 1], [16, -8])}deg) rotateZ(${interpolate(t, [0, 1], [-5, 2])}deg)`,
        }}
      >
        <Phone shot={HOOK_SCREENS[i]} width={600} />
      </div>
    </AbsoluteFill>
  );
};

/** Título de seção: fundo ciano (ou escuro), kicker e frase grande. */
const SectionTitle: React.FC<{ kicker: string; lines: string[]; size: number; bg?: string; children?: React.ReactNode }> = ({
  kicker,
  lines,
  size,
  bg = K.primary,
  children,
}) => {
  const frame = useCurrentFrame();
  const c = onBg(bg);
  return (
    <AbsoluteFill>
      <Bg color={bg} drift={-frame * 2} />
      <Drift dur={40} amount={30}>
        <Kicker color={bg === K.primary ? INK : K.primary} style={{ position: "absolute", left: 70, top: 640 }}>
          {kicker}
        </Kicker>
        <Headline
          lines={lines.map((w, i) => ({ words: w, color: i === lines.length - 1 ? c.b : c.a, indent: i * 40 }))}
          size={size}
          stagger={4}
          start={3}
          hi={c.hi}
          style={{ position: "absolute", left: 70, top: 720 }}
        />
        {children}
      </Drift>
    </AbsoluteFill>
  );
};

const AiTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - 6, fps: 30, config: { damping: 11, mass: 0.6, stiffness: 140 } });
  return (
    <SectionTitle kicker="01 — PARA O PERSONAL" lines={["PRESCRIÇÃO", "COM IA."]} size={150}>
      <div style={{ position: "absolute", left: 700, top: 1110, transform: `rotate(${(1 - p) * -120}deg) scale(${p})` }}>
        <Shot id="ai_icon" width={250} radius={60} glow={false} />
      </div>
      <Caption delay={14} color={INK} size={46} style={{ position: "absolute", left: 70, top: 1140, width: 600 }}>
        Fichas completas em minutos, a partir da anamnese.
      </Caption>
    </SectionTitle>
  );
};

const PROMPT = "Divisão ABC, hipertrofia, sem impacto no ombro.";
const AiAsk: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { k, h } = cropSize("ai_ask", 1000);
  const chars = Math.round(PROMPT.length * ar(frame, 12, 44, 0, 1, (x) => x));
  const caret = Math.floor(frame / 8) % 2 === 0 || chars < PROMPT.length;
  return (
    <AbsoluteFill>
      <Bg />
      <Drift dur={dur}>
        <Kicker style={{ position: "absolute", left: 70, top: 260 }}>PASSO 1 · O PEDIDO</Kicker>
        <Headline lines={[{ words: "DIGA O QUE" }, { words: "VOCÊ QUER.", color: GRAY, indent: 60 }]} size={112} style={{ position: "absolute", left: 70, top: 330 }} />
        <Pop at={4} left={40} top={680} from={{ y: 200, r: -6, s: 0.92 }} to={{ r: -1.5 }}>
          <Shot id="ai_ask" width={1000}>
            <div style={{ position: "absolute", left: 36 * k, top: 66 * k, width: 700 * k, height: 32 * k, background: "#131313" }} />
            <div style={{ position: "absolute", left: 40 * k, top: 70 * k, fontFamily: sans, fontSize: 13.5 * k, color: K.text, whiteSpace: "nowrap" }}>
              {PROMPT.slice(0, chars)}
              <span style={{ opacity: caret ? 1 : 0, color: K.primary }}>|</span>
            </div>
          </Shot>
        </Pop>
        <Caption delay={20} style={{ position: "absolute", left: 70, top: 680 + h + 70, width: 900 }}>
          Divisão, foco, o que evitar e equipamentos.{" "}
          <span style={{ color: K.primary }}>Em português, do seu jeito.</span>
        </Caption>
      </Drift>
    </AbsoluteFill>
  );
};

const AiSteps: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { k } = cropSize("ai_steps", 1000);
  const rows = [58, 108, 158, 218];
  const shown = rows.filter((_, i) => frame >= 8 + i * 8).length;
  const clip = shown ? rows[shown - 1] * k : 0;
  const iconP = spring({ frame, fps: 30, config: { damping: 12, mass: 0.6, stiffness: 140 } });
  return (
    <AbsoluteFill>
      <Bg drift={-frame} />
      <Drift dur={dur}>
        <div style={{ position: "absolute", left: centerX(180), top: 230, transform: `scale(${iconP}) rotate(${frame * 2}deg)` }}>
          <Shot id="ai_icon" width={180} radius={44} glow={false} />
        </div>
        <Headline
          lines={[{ words: "A IA MONTA" }, { words: "O RASCUNHO.", color: GRAY }]}
          size={112}
          align="center"
          start={2}
          style={{ position: "absolute", left: 0, width: W, top: 470 }}
        />
        <div style={{ position: "absolute", left: 40, top: 800, clipPath: `inset(0 0 ${Math.max(0, 218 * k - clip)}px 0 round 20px)` }}>
          <Shot id="ai_steps" width={1000} />
        </div>
        <Caption delay={16} style={{ position: "absolute", left: 0, width: W, top: 1200, textAlign: "center" }}>
          Lê o perfil, as restrições e o seu pedido.
        </Caption>
      </Drift>
    </AbsoluteFill>
  );
};

const ROWS = ["row2", "row3", "row4", "row5"];
const AiRows: React.FC<{ dur: number; b0: number }> = ({ dur, b0 }) => {
  const frame = useCurrentFrame();
  const L = lb(b0);
  const warnAt = L(3);
  const settle = ar(frame, 10, 34);
  const dim = ar(frame, warnAt, warnAt + 8);
  let y = 0;
  const tops = ROWS.map((id) => {
    const t = y;
    y += cropSize(id, 960).h + 22;
    return t;
  });
  return (
    <AbsoluteFill>
      <Bg color={K.primary} drift={-frame * 1.5} />
      <Drift dur={dur}>
        <Headline
          lines={[{ words: "EXERCÍCIOS, SÉRIES", color: INK }, { words: "E CARGAS.", color: INK_SOFT, indent: 60 }]}
          size={92}
          hi="#ffffff"
          style={{ position: "absolute", left: 60, top: 230 }}
        />
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 500,
            transform: `rotate(${-4 * (1 - settle)}deg) scale(${1 - dim * 0.06})`,
            opacity: 1 - dim * 0.45,
            transformOrigin: "50% 30%",
          }}
        >
          {ROWS.map((id, i) => (
            <Pop key={id} at={i * 4} left={0} top={tops[i]} from={{ y: -900, x: 120, r: -22, s: 1.05 }} to={{ r: i % 2 ? 1.2 : -1.2 }} damping={12}>
              <Shot id={id} width={960} />
            </Pop>
          ))}
        </div>
        <Pop at={warnAt} left={40} top={980} from={{ y: 500, r: 12, s: 0.8 }} to={{ r: 2.5, s: 1 }} z={5}>
          <Shot id="ai_warn" width={1000} style={{ boxShadow: "0 50px 100px rgba(0,0,0,0.5), 0 0 0 3px rgba(245,185,69,0.7)" }} />
        </Pop>
        <Caption delay={warnAt + 6} color={INK} size={44} style={{ position: "absolute", left: 60, top: 1330, width: 960 }}>
          E sinaliza o que você precisa conferir.
        </Caption>
      </Drift>
    </AbsoluteFill>
  );
};

const Approve: React.FC<{ dur: number; b0: number }> = ({ dur, b0 }) => {
  const frame = useCurrentFrame();
  const L = lb(b0);
  const on = frame >= L(2);
  const flash = frame < L(2) ? 0 : ar(frame, L(2), L(2) + 8, 0.2, 0);
  const punch = 1 + 0.03 * Math.sin(ar(frame, L(2), L(2) + 8) * Math.PI);
  const press = 1 - 0.06 * Math.sin(ar(frame, L(3) - 2, L(3) + 5) * Math.PI);
  const btn = cropSize("approve_btn", 600);
  return (
    <AbsoluteFill>
      <Bg drift={-frame} />
      <Drift dur={dur} amount={24}>
        <Headline
          lines={[{ words: "VOCÊ REVISA." }, { words: "VOCÊ APROVA.", color: GRAY, indent: 60 }]}
          size={118}
          style={{ position: "absolute", left: 60, top: 230 }}
        />
        <Pop at={2} left={40} top={600} from={{ y: 220, r: -5, s: 0.94 }} to={{ r: -1 }}>
          <div style={{ transform: `scale(${punch})` }}>
            <Shot id={on ? "approve_on" : "approve_off"} width={1000} />
          </div>
        </Pop>
        <Pop at={L(2) + 2} left={centerX(btn.w)} top={1110} from={{ y: 140, s: 0.6 }} damping={11}>
          <div style={{ transform: `scale(${press})` }}>
            <Shot id="approve_btn" width={600} radius={22} />
          </div>
        </Pop>
        <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
        <Pop at={L(3) + 4} left={centerX(900)} top={1290} from={{ y: 260, s: 0.85 }} z={6}>
          <Shot id="toast" width={900} radius={30} glow={false} style={{ boxShadow: "0 40px 90px rgba(0,0,0,0.6), 0 0 0 2px rgba(74,222,128,0.5)" }} />
        </Pop>
        <Caption delay={8} style={{ position: "absolute", left: 60, top: 1580, width: 960 }}>
          Nada chega ao aluno sem o seu aceite.
        </Caption>
      </Drift>
    </AbsoluteFill>
  );
};

/** Match cut: o toast continua no lugar e o app do aluno sobe por baixo. */
const Delivered: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const PW = 600;
  const rise = spring({ frame: frame - 2, fps, config: { damping: 15, mass: 0.8, stiffness: 110 } });
  const toastY = interpolate(rise, [0, 1], [1290, 470]);
  const phoneTop = interpolate(rise, [0, 1], [1950, 760]);
  const r = phoneRect("train_grade", PW);
  const out = spring({ frame: frame - 14, fps, config: { damping: 12, mass: 0.7, stiffness: 140 } });
  const t = frame / dur;
  return (
    <AbsoluteFill>
      <Bg color={K.primary} drift={-frame * 2} />
      <Headline
        lines={[{ words: "NA HORA, NO APP", color: INK }, { words: "DO ALUNO.", color: INK_SOFT, indent: 60 }]}
        size={96}
        hi="#ffffff"
        start={4}
        style={{ position: "absolute", left: 60, top: 220 }}
      />
      <div style={{ position: "absolute", left: centerX(900), top: toastY, zIndex: 3 }}>
        <Shot id="toast" width={900} radius={30} glow={false} style={{ boxShadow: "0 40px 90px rgba(0,0,0,0.45)" }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: centerX(PW),
          top: phoneTop - t * 30,
          transform: `perspective(2400px) rotateY(${-10 + t * 14}deg)`,
        }}
      >
        <Phone shot={4} width={PW} />
        <div
          style={{
            position: "absolute",
            left: r.left,
            top: r.top,
            transformOrigin: "50% 50%",
            transform: `translate(${out * -20}px, ${out * 40}px) scale(${1 + out * 0.42}) rotate(${out * -3}deg)`,
            zIndex: 2,
          }}
        >
          <Shot id="train_grade" width={r.width} radius={12} style={{ boxShadow: `0 ${30 * out}px ${70 * out}px rgba(0,0,0,0.55)` }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StudentTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - 12, fps: 30, config: { damping: 10, mass: 0.6, stiffness: 160 } });
  return (
    <SectionTitle kicker="02 — PARA O ALUNO" lines={["O ALUNO", "TREINA", "NO APP."]} size={150} bg={K.bg}>
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 1250,
          transform: `scale(${p}) rotate(${(1 - p) * -10}deg)`,
          transformOrigin: "0 50%",
          background: K.primary,
          color: INK,
          fontFamily: display,
          fontWeight: 900,
          fontSize: 54,
          padding: "16px 34px",
          borderRadius: 999,
          letterSpacing: "0.02em",
        }}
      >
        100% GRÁTIS PRA ELE
      </div>
    </SectionTitle>
  );
};

/** Celular com um card que sai da tela, cresce e assenta à frente. */
const Breakout: React.FC<{
  dur: number;
  shot: number;
  card: string;
  bg: string;
  lines: [string, string];
  phoneLeft: number;
  phoneTop: number;
  to: { left: number; top: number; width: number; r: number };
  at?: number;
  extra?: React.ReactNode;
  overlay?: (k: number, frame: number) => React.ReactNode;
}> = ({ dur, shot, card, bg, lines, phoneLeft, phoneTop, to, at = 6, extra, overlay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const PW = 640;
  const c = onBg(bg);
  const r = phoneRect(card, PW);
  const p = spring({ frame: frame - at, fps, config: { damping: 13, mass: 0.75, stiffness: 120 } });
  const t = frame / dur;
  const px = phoneLeft;
  const py = phoneTop - t * 40;
  const left = interpolate(p, [0, 1], [px + r.left, to.left]);
  const top = interpolate(p, [0, 1], [py + r.top, to.top]);
  const width = interpolate(p, [0, 1], [r.width, to.width]);
  const k = cropSize(card, width).k;
  return (
    <AbsoluteFill>
      <Bg color={bg} drift={-frame * 1.5} />
      <Headline
        lines={[{ words: lines[0], color: c.a }, { words: lines[1], color: c.b, indent: 60 }]}
        size={92}
        hi={c.hi}
        style={{ position: "absolute", left: 60, top: 220 }}
      />
      <div style={{ position: "absolute", left: px, top: py, transform: `perspective(2400px) rotateY(${12 - t * 10}deg)`, opacity: 1 - p * 0.25 }}>
        <Phone shot={shot} width={PW} />
      </div>
      <div style={{ position: "absolute", left, top, transform: `rotate(${p * to.r}deg)`, zIndex: 3 }}>
        <Shot id={card} width={width} style={{ boxShadow: `0 ${50 * p}px ${110 * p}px rgba(0,0,0,${0.35 + 0.3 * p})` }}>
          {overlay?.(k, frame)}
        </Shot>
      </div>
      {extra}
    </AbsoluteFill>
  );
};

const PROG = [
  { id: "prog_consist", bg: K.primary },
  { id: "prog_tiles", bg: K.bg },
  { id: "prog_plan", bg: K.primary },
  { id: "prog_assess", bg: K.bg },
];
const Progress: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const i = Math.min(Math.floor(frame / BEAT), PROG.length - 1);
  const { id, bg } = PROG[i];
  const c = onBg(bg);
  const f = frame - Math.round(i * BEAT);
  const pop = 0.93 + 0.07 * spring({ frame: f, fps: 30, config: { damping: 12, mass: 0.5, stiffness: 200 } });
  const t = frame / dur;
  return (
    <AbsoluteFill>
      <Bg color={bg} drift={-frame * 2} />
      <Headline
        lines={[{ words: "PROGRESSO QUE", color: c.a }, { words: "ELE ENXERGA.", color: c.b, indent: 60 }]}
        size={100}
        hi={c.hi}
        stagger={BEAT / 2}
        style={{ position: "absolute", left: 60, top: 220 }}
      />
      <div
        style={{
          position: "absolute",
          left: centerX(940),
          top: 560 - t * 50,
          transform: `rotate(${interpolate(t, [0, 1], [-3, 2])}deg) scale(${pop})`,
        }}
      >
        <Shot id={id} width={940} />
      </div>
    </AbsoluteFill>
  );
};

const Portfolio: React.FC<{ dur: number; b0: number }> = ({ dur, b0 }) => {
  const L = lb(b0);
  const kw = 486;
  const kh = cropSize("kpi1", kw).h;
  return (
    <AbsoluteFill>
      <Bg />
      <Drift dur={dur}>
        <Headline lines={[{ words: "SUA CARTEIRA" }, { words: "NUM OLHAR.", color: GRAY, indent: 60 }]} size={104} style={{ position: "absolute", left: 50, top: 220 }} />
        {["kpi1", "kpi2", "kpi3", "kpi4"].map((id, i) => (
          <Pop
            key={id}
            at={2 + i * 4}
            left={42 + (i % 2) * (kw + 24)}
            top={560 + Math.floor(i / 2) * (kh + 24)}
            from={{ y: -700, x: (i % 2 ? 1 : -1) * 120, r: i % 2 ? 18 : -18 }}
            to={{ r: i % 2 ? 1 : -1 }}
          >
            <Shot id={id} width={kw} />
          </Pop>
        ))}
        <Pop at={L(2)} left={40} top={560 + 2 * (kh + 24) + 30} from={{ y: 400, r: 6, s: 0.9 }} to={{ r: -1 }}>
          <Shot id="students" width={1000} />
        </Pop>
      </Drift>
    </AbsoluteFill>
  );
};

const Risk: React.FC<{ dur: number; b0: number }> = ({ dur, b0 }) => {
  const frame = useCurrentFrame();
  const L = lb(b0);
  const ring = (frame - L(2)) % 24;
  return (
    <AbsoluteFill>
      <Bg color={K.primary} drift={-frame * 2} />
      <Drift dur={dur}>
        <Headline
          lines={[{ words: "ALERTA DE RISCO.", color: INK }, { words: "UM CLIQUE PRO", color: INK_SOFT }, { words: "WHATSAPP.", color: INK_SOFT }]}
          size={92}
          hi="#ffffff"
          stagger={4}
          style={{ position: "absolute", left: 60, top: 210 }}
        />
        <Pop at={4} left={60} top={560} from={{ y: 300, x: -200, r: -14 }} to={{ r: -2 }}>
          <Shot id="st_status" width={900} />
        </Pop>
        <Pop at={L(1)} left={120} top={930} from={{ y: 300, x: 200, r: 14 }} to={{ r: 2 }}>
          <Shot id="st_why" width={880} />
        </Pop>
        {frame >= L(2) && (
          <div
            style={{
              position: "absolute",
              left: centerX(420),
              top: 1335,
              width: 420,
              height: cropSize("st_wa", 420).h,
              borderRadius: 40,
              boxShadow: `0 0 0 ${ar(ring, 0, 24, 0, 46)}px rgba(74,222,128,${ar(ring, 0, 24, 0.55, 0)})`,
            }}
          />
        )}
        <Pop at={L(2)} left={centerX(420)} top={1335} from={{ y: 200, s: 0.5 }} damping={10}>
          <Shot id="st_wa" width={420} radius={40} glow={false} />
        </Pop>
      </Drift>
    </AbsoluteFill>
  );
};

const Performance: React.FC<{ dur: number; b0: number }> = ({ dur, b0 }) => {
  const L = lb(b0);
  return (
    <AbsoluteFill>
      <Bg />
      <Drift dur={dur}>
        <Headline lines={[{ words: "DESEMPENHO" }, { words: "DE CADA ALUNO.", color: GRAY, indent: 60 }]} size={100} style={{ position: "absolute", left: 50, top: 220 }} />
        <Pop at={2} left={50} top={540} from={{ y: 400, r: -8 }} to={{ r: -1 }}>
          <Shot id="st_volume" width={980} />
        </Pop>
        <Pop at={L(1)} left={40} top={1080} from={{ y: 500, x: -150, r: -16 }} to={{ r: -2 }}>
          <Shot id="st_kpi1" width={490} />
        </Pop>
        <Pop at={L(1) + 4} left={550} top={1100} from={{ y: 500, x: 150, r: 16 }} to={{ r: 2 }}>
          <Shot id="st_kpi2" width={490} />
        </Pop>
      </Drift>
    </AbsoluteFill>
  );
};

const Assess: React.FC<{ dur: number; b0: number }> = ({ dur, b0 }) => {
  const L = lb(b0);
  return (
    <AbsoluteFill>
      <Bg color={K.primary} />
      <Drift dur={dur}>
        <Headline
          lines={[{ words: "AVALIAÇÕES", color: INK }, { words: "FÍSICAS.", color: INK_SOFT, indent: 60 }]}
          size={120}
          hi="#ffffff"
          style={{ position: "absolute", left: 60, top: 220 }}
        />
        <Pop at={2} left={60} top={520} from={{ y: 500, r: -12 }} to={{ r: -3 }}>
          <Shot id="assess_modal" width={640} />
        </Pop>
        <Pop at={L(1)} left={440} top={1010} from={{ y: 500, x: 200, r: 14 }} to={{ r: 4 }} z={2}>
          <Shot id="prog_assess" width={600} />
        </Pop>
      </Drift>
    </AbsoluteFill>
  );
};

const Finance: React.FC<{ dur: number }> = ({ dur }) => {
  const kw = 486;
  const kh = cropSize("fin1", kw).h;
  return (
    <AbsoluteFill>
      <Bg />
      <Drift dur={dur}>
        <Kicker style={{ position: "absolute", left: 50, top: 250 }}>04 — FINANCEIRO</Kicker>
        <Headline lines={[{ words: "MENSALIDADES" }, { words: "SEM PLANILHA.", color: GRAY, indent: 60 }]} size={104} start={2} style={{ position: "absolute", left: 50, top: 320 }} />
        {["fin1", "fin2", "fin3", "fin4"].map((id, i) => (
          <Pop
            key={id}
            at={6 + i * 4}
            left={42 + (i % 2) * (kw + 24)}
            top={680 + Math.floor(i / 2) * (kh + 24)}
            from={{ y: -800, x: (i % 2 ? 1 : -1) * 100, r: i % 2 ? 20 : -20 }}
            to={{ r: i % 2 ? 1.5 : -1.5 }}
          >
            <Shot id={id} width={kw} />
          </Pop>
        ))}
        <Caption delay={24} style={{ position: "absolute", left: 50, top: 680 + 2 * (kh + 24) + 40, width: 980 }}>
          Previsto, recebido e atrasado no mês. <span style={{ color: K.primary }}>Lembrete com a sua chave Pix.</span>
        </Caption>
      </Drift>
    </AbsoluteFill>
  );
};

const Plans: React.FC<{ dur: number; b0: number }> = ({ dur, b0 }) => {
  const L = lb(b0);
  return (
    <AbsoluteFill>
      <Bg color={K.primary} />
      <Drift dur={dur}>
        <Headline
          lines={[{ words: "COMECE", color: INK }, { words: "GRÁTIS.", color: INK_SOFT, indent: 60 }]}
          size={160}
          hi="#ffffff"
          style={{ position: "absolute", left: 60, top: 210 }}
        />
        <Caption delay={8} color={INK} size={42} style={{ position: "absolute", left: 60, top: 540, width: 960 }}>
          Até 3 alunos e 3 fichas com IA por mês. Assine quando a carteira crescer.
        </Caption>
        <Pop at={L(1)} left={70} top={720} from={{ y: 700, r: -16 }} to={{ r: -2.5 }}>
          <Shot id="plan_base" width={860} />
        </Pop>
        <Pop at={L(2)} left={150} top={1140} from={{ y: 700, r: 16 }} to={{ r: 2.5 }} z={2}>
          <Shot id="plan_pro" width={860} />
        </Pop>
      </Drift>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [0, 3, 6].map((d) => spring({ frame: frame - d, fps: 30, config: { damping: 10, mass: 0.6, stiffness: 170 } }));
  const reveal = ar(frame, 4, 18);
  const btn = spring({ frame: frame - 34, fps: 30, config: { damping: 11, mass: 0.6, stiffness: 150 } });
  return (
    <AbsoluteFill>
      <Bg drift={-frame} />
      <AbsoluteFill style={{ alignItems: "center", flexDirection: "column", paddingTop: 640 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <LogoMark height={130} progress={bars} />
          <div style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }}>
            <Wordmark size={120} />
          </div>
        </div>
        <Headline
          lines={[{ words: "SEU MÉTODO." }, { words: "EM ESCALA.", color: GRAY }]}
          size={112}
          align="center"
          start={12}
          style={{ marginTop: 90 }}
        />
        <Caption delay={26} color={K.textDim} size={40} style={{ marginTop: 50, textAlign: "center", width: 900 }}>
          Painel do personal + app grátis para o aluno.
        </Caption>
        <div
          style={{
            marginTop: 70,
            transform: `scale(${btn})`,
            display: "flex",
            alignItems: "center",
            gap: 18,
            background: K.primary,
            color: INK,
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 44,
            padding: "26px 54px",
            borderRadius: 22,
            boxShadow: "0 20px 60px rgba(0,229,255,0.25)",
          }}
        >
          Comece grátis <span style={{ fontSize: 46 }}>→</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Linha do tempo (em batidas da trilha) ----------

const PW = 640;
const runSetOverlay = (k: number, frame: number) => {
  const p = ar(frame, 30, 38);
  return (
    <div
      style={{
        position: "absolute",
        left: 17 * k,
        top: 140 * k,
        width: 312 * k,
        height: 34 * k,
        borderRadius: 8 * k,
        background: K.primary,
        opacity: p,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6 * k,
        fontFamily: sans,
        fontWeight: 700,
        fontSize: 11.5 * k,
        color: INK,
      }}
    >
      <Check size={14 * k} draw={ar(frame, 34, 44)} /> Série confirmada
    </div>
  );
};

type Scene = { b: number; el: (dur: number, b0: number) => React.ReactNode };
const SCENES: Scene[] = [
  { b: 0, el: () => <Intro /> },
  { b: 4, el: (d) => <Hook dur={d} /> },
  { b: 10, el: () => <AiTitle /> },
  { b: 12, el: (d) => <AiAsk dur={d} /> },
  { b: 16, el: (d) => <AiSteps dur={d} /> },
  { b: 19, el: (d, b0) => <AiRows dur={d} b0={b0} /> },
  { b: 24, el: (d, b0) => <Approve dur={d} b0={b0} /> },
  { b: 28, el: (d) => <Delivered dur={d} /> },
  { b: 31, el: () => <StudentTitle /> },
  {
    b: 33,
    el: (d) => (
      <Breakout
        dur={d}
        shot={5}
        card="home_today"
        bg={K.primary}
        lines={["TREINO DO DIA", "NA TELA INICIAL."]}
        phoneLeft={360}
        phoneTop={560}
        to={{ left: 60, top: 620, width: 820, r: -3 }}
      />
    ),
  },
  {
    b: 37,
    el: (d) => (
      <Breakout
        dur={d}
        shot={10}
        card="run_set"
        bg={K.bg}
        lines={["SÉRIE A SÉRIE,", "COM CARGA REAL."]}
        phoneLeft={centerX(PW)}
        phoneTop={560}
        to={{ left: 50, top: 760, width: 980, r: -2 }}
        overlay={runSetOverlay}
      />
    ),
  },
  { b: 40, el: (d) => <Progress dur={d} /> },
  { b: 44, el: () => <SectionTitle kicker="03 — ACOMPANHAMENTO" lines={["SAIBA QUEM", "VAI PARAR", "ANTES DELE."]} size={140} /> },
  { b: 46, el: (d, b0) => <Portfolio dur={d} b0={b0} /> },
  { b: 50, el: (d, b0) => <Risk dur={d} b0={b0} /> },
  { b: 54, el: (d, b0) => <Performance dur={d} b0={b0} /> },
  { b: 57, el: (d, b0) => <Assess dur={d} b0={b0} /> },
  { b: 60, el: (d) => <Finance dur={d} /> },
  { b: 64, el: (d, b0) => <Plans dur={d} b0={b0} /> },
  { b: 69, el: () => <EndCard /> },
];
const END_BEAT = 81;
export const DURATION = beat(END_BEAT);

export const Promo: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <Audio
        src={staticFile("music.mp3")}
        volume={(f) => interpolate(f, [0, 6, durationInFrames - 45, durationInFrames], [0, 0.9, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      {SCENES.map((s, i) => {
        const from = beat(s.b);
        const to = beat(SCENES[i + 1]?.b ?? END_BEAT);
        const start = i === 0 ? 0 : from;
        return (
          <Sequence key={i} from={start} durationInFrames={to - start} premountFor={30}>
            {s.el(to - start, s.b)}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

