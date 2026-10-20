import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { display, K, sans } from "./theme";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const SPRING = Easing.spring({ damping: 14 });

/** Interpolação em segundos, sempre com clamp. */
export const ar = (t: number, s: number, e: number, from = 0, to = 1, easing = EASE) =>
  interpolate(t, [s, e], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Animação em segundos relativos à cena: a(início, fim, de, para, easing). */
export const useAnim = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  const a = (start: number, end: number, from = 0, to = 1, easing = EASE) =>
    ar(sec, start, end, from, to, easing);
  return { a, sec, frame, fps };
};

/** Texto digitado até `p` (0..1). */
export const typed = (text: string, p: number) => text.slice(0, Math.round(text.length * p));

/** Multi-keyframe com clamp (posição de cursor, câmera, scroll). */
export const keys = (t: number, times: number[], values: number[]) =>
  interpolate(t, times, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: IN_OUT,
  });

export const Background: React.FC<{ glowX?: number; glowY?: number }> = ({
  glowX = 70,
  glowY = 40,
}) => {
  const { sec, frame } = useAnim();
  const x = glowX + Math.sin(sec * 0.5) * 6;
  const y = glowY + Math.cos(sec * 0.4) * 5;
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1000px 760px at ${x}% ${y}%, rgba(0,229,255,0.13), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          backgroundPosition: `${-sec * 8}px ${-sec * 4}px`,
          maskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
        }}
      />
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(frame / 2)} />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Texto que sobe palavra por palavra. Palavras com "*" na frente saem em ciano.
 * `out` (segundos) faz as palavras saírem para cima.
 */
export const Words: React.FC<{
  text: string;
  delay: number;
  size: number;
  out?: number;
  weight?: number;
  color?: string;
  font?: string;
  stagger?: number;
  lineHeight?: number;
  style?: React.CSSProperties;
}> = ({ text, delay, size, out, weight = 800, color = K.text, font = display, stagger = 0.06, lineHeight = 1.05, style }) => {
  const { a } = useAnim();
  const words = text.split(" ");
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        fontStretch: font === display ? "112.5%" : undefined,
        color,
        lineHeight,
        letterSpacing: font === display ? "-0.025em" : 0,
        display: "flex",
        flexWrap: "wrap",
        columnGap: size * 0.26,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const hi = w.startsWith("*");
        const y =
          a(delay + i * stagger, delay + i * stagger + 0.7, 115, 0) +
          (out === undefined ? 0 : a(out + i * 0.025, out + i * 0.025 + 0.45, 0, -115, IN_OUT));
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.1, marginBottom: -size * 0.1 }}>
            <span style={{ display: "inline-block", translate: `0 ${y}%`, color: hi ? K.primary : undefined }}>
              {hi ? w.slice(1) : w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export const Kicker: React.FC<{ children: React.ReactNode; delay: number; out?: number }> = ({ children, delay, out }) => {
  const { a } = useAnim();
  const o = a(delay, delay + 0.5) * (out === undefined ? 1 : a(out, out + 0.3, 1, 0));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: sans,
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: K.primary,
        opacity: o,
      }}
    >
      <div style={{ width: a(delay, delay + 0.6, 0, 48), height: 3, background: K.primary, borderRadius: 2 }} />
      {children}
    </div>
  );
};

export const Sub: React.FC<{ children: React.ReactNode; delay: number; out?: number; style?: React.CSSProperties }> = ({
  children,
  delay,
  out,
  style,
}) => {
  const { a } = useAnim();
  return (
    <div
      style={{
        fontFamily: sans,
        fontSize: 34,
        lineHeight: 1.38,
        color: K.textDim,
        opacity: a(delay, delay + 0.6) * (out === undefined ? 1 : a(out, out + 0.35, 1, 0)),
        translate: `0 ${a(delay, delay + 0.8, 24, 0)}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** As três barras do logo (KineticLogo.tsx). `progress` anima cada barra. */
export const LogoMark: React.FC<{ height: number; progress?: number[] }> = ({ height, progress = [1, 1, 1] }) => (
  <svg width={height * 1.3} height={height} viewBox="0 0 26 20" style={{ overflow: "visible", flexShrink: 0 }}>
    {[
      { d: "M6 0h6L6 20H0z", o: 1 },
      { d: "M15 0h6l-6 20H9z", o: 0.55 },
      { d: "M24 0h2l-6 20h-2z", o: 0.25 },
    ].map((p, i) => (
      <path key={i} d={p.d} fill={K.primary} opacity={p.o * progress[i]} style={{ translate: `${(1 - progress[i]) * -30}px 0` }} />
    ))}
  </svg>
);

/** Logo do painel: barras + KINETIC em Geist itálico 800. */
export const Logo: React.FC<{ size: number }> = ({ size }) => (
  <span style={{ display: "flex", alignItems: "center", gap: size * 0.5, color: K.text }}>
    <LogoMark height={size} />
    <span style={{ fontFamily: sans, fontStyle: "italic", fontWeight: 800, fontSize: size, letterSpacing: "0.06em", lineHeight: 1 }}>
      KINETIC
    </span>
  </span>
);

/** Celular Android (câmera em furo), tela 376×836 como nos prints do app. */
export const Phone: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; time?: string }> = ({
  children,
  style,
  time = "9:41",
}) => (
  <div
    style={{
      width: 400,
      height: 860,
      borderRadius: 58,
      background: "#0a0a0a",
      padding: 12,
      boxShadow:
        "0 0 0 2px #2c2c2c, 0 0 0 5px #0d0d0d, 0 50px 120px rgba(0,0,0,0.65), 0 0 120px rgba(0,229,255,0.14)",
      ...style,
    }}
  >
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 46, overflow: "hidden", background: K.bg, fontFamily: sans, color: K.text }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 26px 0",
          fontSize: 15,
          fontWeight: 600,
          zIndex: 20,
        }}
      >
        <span>{time}</span>
        <span style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <svg width="18" height="14" viewBox="0 0 18 14">
            {[3, 6, 9, 12].map((h, i) => (
              <rect key={h} x={i * 4.5} y={13 - h} width="3" height={h} rx="1" fill={K.text} />
            ))}
          </svg>
          <svg width="18" height="14" viewBox="0 0 24 18">
            <path d="M12 17l3.5-4a5 5 0 00-7 0zM4 9a11 11 0 0116 0l-2.2 2.5a8 8 0 00-11.6 0zM0 5a17 17 0 0124 0l-2.2 2.5a14 14 0 00-19.6 0z" fill={K.text} />
          </svg>
          <span style={{ width: 26, height: 13, border: `1.5px solid ${K.text}`, borderRadius: 4, padding: 1.5 }}>
            <span style={{ display: "block", width: "85%", height: "100%", background: K.text, borderRadius: 1.5 }} />
          </span>
        </span>
      </div>
      <div style={{ position: "absolute", top: 13, left: "50%", translate: "-50% 0", width: 20, height: 20, borderRadius: 10, background: "#000", boxShadow: "0 0 0 2px #1a1a1a", zIndex: 30 }} />
      <div style={{ position: "absolute", bottom: 7, left: "50%", translate: "-50% 0", width: 120, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.75)", zIndex: 30 }} />
      {children}
    </div>
  </div>
);

/** Navegador com viewport 1440×900 (o painel real em tela cheia). */
export const BROWSER_W = 1440;
export const BROWSER_H = 952;
export const Browser: React.FC<{ children: React.ReactNode; url: string; style?: React.CSSProperties }> = ({ children, url, style }) => (
  <div
    style={{
      width: BROWSER_W,
      height: BROWSER_H,
      borderRadius: 18,
      overflow: "hidden",
      background: K.bg,
      border: `1px solid ${K.ghostHi}`,
      boxShadow: "0 50px 140px rgba(0,0,0,0.65), 0 0 140px rgba(0,229,255,0.12)",
      fontFamily: sans,
      color: K.text,
      position: "relative",
      ...style,
    }}
  >
    <div
      style={{
        height: 52,
        background: "#0f0f0f",
        borderBottom: `1px solid ${K.ghost}`,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 9,
      }}
    >
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
      ))}
      <div
        style={{
          margin: "0 auto",
          width: 480,
          height: 32,
          borderRadius: 9,
          background: K.surface1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: 15,
          color: K.textDim,
        }}
      >
        <svg width="12" height="14" viewBox="0 0 12 14">
          <rect x="1" y="6" width="10" height="7.5" rx="1.5" fill={K.textMuted} />
          <path d="M3.5 6V4a2.5 2.5 0 015 0v2" stroke={K.textMuted} strokeWidth="1.5" fill="none" />
        </svg>
        {url}
      </div>
      <div style={{ width: 59 }} />
    </div>
    <div style={{ position: "absolute", top: 52, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>{children}</div>
  </div>
);

/** Ponteiro do mouse; `click` (0..1) desenha o anel do clique. */
export const Cursor: React.FC<{ x: number; y: number; click: number; opacity?: number }> = ({ x, y, click, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, zIndex: 80, opacity }}>
    <div
      style={{
        position: "absolute",
        left: -30,
        top: -30,
        width: 60,
        height: 60,
        borderRadius: 30,
        border: `3px solid ${K.primary}`,
        scale: String(0.3 + click * 1.1),
        opacity: click > 0 && click < 1 ? 1 - click : 0,
      }}
    />
    <svg
      width="26"
      height="32"
      viewBox="0 0 30 36"
      style={{ scale: String(1 - Math.sin(click * Math.PI) * 0.15), filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))" }}
    >
      <path d="M2 2l24 13-11 2.5L9.5 29z" fill="#fff" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  </div>
);

/** Clique: 0 antes, sobe a 1 nos 0.45s depois de `at`. */
export const clickAt = (t: number, at: number) => ar(t, at, at + 0.45);

/** Escala de "aperto" de botão no clique. */
export const press = (t: number, at: number) => String(1 - Math.sin(ar(t, at - 0.05, at + 0.25, 0, 1, IN_OUT) * Math.PI) * 0.05);

export const Check: React.FC<{ size: number; color?: string; draw?: number }> = ({ size, color = K.onPrimary, draw = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="22"
      strokeDashoffset={22 * (1 - draw)}
    />
  </svg>
);

/** Formata número em pt-BR. */
export const br = (n: number, decimals = 0) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
