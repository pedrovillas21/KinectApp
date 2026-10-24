import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import cropsJson from "./crops.json";
import { display, K, mono, sans } from "./theme";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** Trilha a 110 BPM: batida n em frames (primeira batida em 0,154 s). */
export const FPS = 30;
export const BEAT = 0.545 * FPS;
export const beat = (n: number) => Math.round((0.154 + n * 0.545) * FPS);

/** Interpolação em frames com clamp. */
export const ar = (f: number, s: number, e: number, from = 0, to = 1, easing = EASE) =>
  interpolate(f, [s, e], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Mola com overshoot leve, começando em `delay` frames. */
export const useSpring = (delay = 0, config = { damping: 13, mass: 0.7, stiffness: 150 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

// ---------- Prints ----------

type Crop = [number, number, number, number, number, number];
const CROPS = cropsJson as unknown as Record<string, Crop>;
/** Largura original de cada print (N.png). */
const IMG_W: Record<number, number> = {
  1: 385, 2: 381, 3: 382, 4: 391, 5: 372, 6: 382, 7: 382, 8: 375, 9: 386, 10: 380,
  16: 1918, 29: 1688, 30: 1688, 31: 1686, 32: 1687, 33: 1688, 34: 1689, 35: 431,
};
const imgW = (n: number) => IMG_W[n] ?? 1920;
const src = (n: number) => staticFile(n <= 10 ? `shots/p${n}.png` : `shots/${n}.png`);

export const cropSize = (id: string, width: number) => {
  const [, , , , w, h] = CROPS[id];
  return { w: width, h: (h * width) / w, k: width / w };
};

/** Recorte de um print exibido com `width` px, como um card solto. */
export const Shot: React.FC<{
  id: string;
  width: number;
  radius?: number;
  glow?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ id, width, radius, glow = true, style, children }) => {
  const [, n, x, y, w, h] = CROPS[id];
  const k = width / w;
  return (
    <div
      style={{
        position: "relative",
        width,
        height: h * k,
        overflow: "hidden",
        borderRadius: radius ?? Math.min(14 * k, 36),
        boxShadow: `0 40px 90px rgba(0,0,0,0.55), 0 0 0 ${glow ? 1.5 : 0}px rgba(0,229,255,0.28)`,
        background: K.bg,
        ...style,
      }}
    >
      <Img src={src(n)} style={{ position: "absolute", left: -x * k, top: -y * k, width: imgW(n) * k, maxWidth: "none" }} />
      {children}
    </div>
  );
};

// ---------- Celular ----------

export const PHONE_RATIO = 2.13;
/** Celular com print do app (1..10) na tela. `width` é a largura externa. */
export const Phone: React.FC<{ shot: number; width: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  shot,
  width,
  style,
  children,
}) => {
  const bezel = width * 0.028;
  const sw = width - bezel * 2;
  return (
    <div
      style={{
        position: "relative",
        width,
        height: width * PHONE_RATIO,
        borderRadius: width * 0.14,
        background: "linear-gradient(140deg,#4a4a4a 0%,#1a1a1a 18%,#0c0c0c 60%,#3a3a3a 100%)",
        padding: bezel,
        boxShadow: "0 60px 120px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,255,255,0.08)",
        ...style,
      }}
    >
      <div style={{ position: "relative", width: sw, height: "100%", borderRadius: width * 0.115, overflow: "hidden", background: K.bg }}>
        <Img src={src(shot)} style={{ position: "absolute", width: sw * 1.04, left: -sw * 0.02, top: -sw * 0.012, maxWidth: "none" }} />
      </div>
      {children}
    </div>
  );
};

/** Posição (no sistema do <Phone>) de um recorte do mesmo print, para o card "sair" da tela. */
export const phoneRect = (id: string, phoneWidth: number) => {
  const [, n, x, y, w, h] = CROPS[id];
  const bezel = phoneWidth * 0.028;
  const sw = phoneWidth - bezel * 2;
  const s = (sw * 1.04) / imgW(n);
  return { left: bezel - sw * 0.02 + x * s, top: bezel - sw * 0.012 + y * s, width: w * s, height: h * s };
};

// ---------- Tipografia ----------

export type Line = { words: string; color?: string; indent?: number };

/**
 * Palavra a palavra: sobe por máscara na cor de destaque e assume a cor final
 * quando a próxima entra (técnica do vídeo Moolah).
 */
export const Headline: React.FC<{
  lines: Line[];
  size: number;
  start?: number;
  stagger?: number;
  hi?: string;
  style?: React.CSSProperties;
  align?: "left" | "center";
}> = ({ lines, size, start = 0, stagger = 5, hi = K.primary, style, align = "left" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let i = 0;
  const total = lines.reduce((n, l) => n + l.words.split(" ").length, 0);
  return (
    <div style={{ fontFamily: display, fontWeight: 900, fontSize: size, lineHeight: 0.94, fontStretch: "87.5%", letterSpacing: "-0.015em", textTransform: "uppercase", textAlign: align, ...style }}>
      {lines.map((l, li) => (
        <div key={li} style={{ paddingLeft: l.indent ?? 0, whiteSpace: "nowrap" }}>
          {l.words.split(" ").map((w, wi) => {
            const at = start + i * stagger;
            const next = i + 1 < total ? at + stagger : at + stagger * 2;
            i++;
            const p = spring({ frame: frame - at, fps, config: { damping: 16, mass: 0.6, stiffness: 160 } });
            return (
              <span key={wi} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: size * 0.06, marginRight: size * 0.22 }}>
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - p) * 110}%)`,
                    color: frame >= next ? (l.color ?? K.text) : hi,
                  }}
                >
                  {w}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Rótulo de seção em mono, com traço que cresce. */
export const Kicker: React.FC<{ children: string; delay?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  delay = 0,
  color = K.primary,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = ar(frame, delay, delay + 12);
  const chars = Math.round(children.length * ar(frame, delay + 2, delay + 16, 0, 1, Easing.linear));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, fontFamily: mono, fontWeight: 600, fontSize: 30, letterSpacing: "0.16em", color, ...style }}>
      <span style={{ width: 60 * p, height: 4, background: color, borderRadius: 2 }} />
      {children.slice(0, chars)}
    </div>
  );
};

export const Caption: React.FC<{ children: React.ReactNode; delay?: number; color?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  delay = 0,
  color = K.textSoft,
  size = 44,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = ar(frame, delay, delay + 14);
  return (
    <div style={{ fontFamily: sans, fontWeight: 500, fontSize: size, lineHeight: 1.25, color, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, ...style }}>
      {children}
    </div>
  );
};

// ---------- Fundo da marca ----------

/** Fundo chapado + barras diagonais do logo (como no login do painel). */
export const Bg: React.FC<{ color?: string; bars?: string; drift?: number }> = ({ color = K.bg, bars, drift = 0 }) => {
  const barColor = bars ?? (color === K.primary ? "rgba(0,26,31,0.07)" : "rgba(0,229,255,0.07)");
  return (
    <AbsoluteFill style={{ background: color, overflow: "hidden" }}>
      {color === K.bg && (
        <AbsoluteFill
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse at 20% 10%, black 0%, transparent 70%)",
          }}
        />
      )}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 380 + i * 330 + drift,
            top: 1100 - drift * 0.6,
            width: 230,
            height: 1400,
            background: barColor,
            transform: "skewX(-17deg)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** As três barras do logo (KineticLogo.tsx). `progress` anima cada barra. */
export const LogoMark: React.FC<{ height: number; progress?: number[]; color?: string }> = ({ height, progress = [1, 1, 1], color = K.primary }) => (
  <svg width={height * 1.3} height={height} viewBox="0 0 26 20" style={{ overflow: "visible", flexShrink: 0 }}>
    {[
      { d: "M6 0h6L6 20H0z", o: 1 },
      { d: "M15 0h6l-6 20H9z", o: 0.55 },
      { d: "M24 0h2l-6 20h-2z", o: 0.25 },
    ].map((p, i) => (
      <path key={i} d={p.d} fill={color} opacity={p.o * Math.min(1, progress[i])} style={{ translate: `${(1 - progress[i]) * -30}px 0` }} />
    ))}
  </svg>
);

export const Wordmark: React.FC<{ size: number; color?: string }> = ({ size, color = K.text }) => (
  <span style={{ fontFamily: sans, fontStyle: "italic", fontWeight: 800, fontSize: size, letterSpacing: "0.06em", lineHeight: 1, color }}>KINETIC</span>
);

export const Check: React.FC<{ size: number; color?: string; draw?: number }> = ({ size, color = K.onPrimary, draw = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="22" strokeDashoffset={22 * (1 - draw)} />
  </svg>
);
