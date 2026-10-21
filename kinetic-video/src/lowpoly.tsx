import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, random, staticFile } from "remotion";
import { HomeScreen } from "./app-screens";
import { Dashboard, Shell, TopRightDefault } from "./desk";
import { K, sans } from "./theme";
import { ar, Background, Browser, BROWSER_W, IN_OUT, keys, LogoMark, Phone, SPRING, useAnim, Words } from "./ui";

/*
 * Abertura: retrato low poly do Pedro montado a partir de public/pedro.jpg (959×1280).
 * A malha é uma grade com jitter determinístico; cada célula vira 2 triângulos pintados
 * com a cor média da foto. Só entram os triângulos dentro da silhueta (cabeça e ombros),
 * o que tira o fundo do quarto sem precisar recortar a foto.
 */
const SRC_Y = 300;
const SRC_W = 959;
const SRC_H = 1280 - SRC_Y;
const CELL = 24;
const FACE = { x: 490, y: 640 };

// Silhueta em coordenadas da foto, contornada à mão: cabelo → orelha dir. → barba → ombros → orelha esq.
const SILHOUETTE: [number, number][] = [
  [362, 400], [425, 345], [520, 334], [600, 355], [642, 425], [648, 530], [652, 590], [680, 612], [688, 690], [655, 740],
  [630, 790], [605, 880], [610, 960], [760, 1000], [900, 1060], [959, 1180], [959, 1280], [0, 1280], [0, 1180],
  [60, 1060], [200, 1000], [360, 960], [360, 870], [335, 790], [305, 742], [285, 690], [290, 615], [328, 595], [332, 520], [340, 450],
];

const inside = (x: number, y: number) => {
  let hit = false;
  for (let i = 0, j = SILHOUETTE.length - 1; i < SILHOUETTE.length; j = i++) {
    const [xi, yi] = SILHOUETTE[i];
    const [xj, yj] = SILHOUETTE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

type Tri = { d: string; fill: string; cx: number; cy: number; dist: number; r: number };

const buildMesh = (img: HTMLImageElement): Tri[] => {
  const canvas = document.createElement("canvas");
  canvas.width = SRC_W;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, SRC_W, 1280).data;
  const sample = (x: number, y: number) => {
    const i = (Math.min(1279, Math.max(0, Math.round(y))) * SRC_W + Math.min(SRC_W - 1, Math.max(0, Math.round(x)))) * 4;
    return [px[i], px[i + 1], px[i + 2]];
  };
  const cols = Math.ceil(SRC_W / CELL);
  const rows = Math.ceil(SRC_H / CELL);
  const pt = (c: number, r: number): [number, number] => {
    const edge = c === 0 || r === 0 || c === cols || r === rows;
    const j = edge ? 0 : CELL * 0.38;
    return [Math.min(SRC_W, c * CELL + (random(`x${c}-${r}`) - 0.5) * 2 * j), SRC_Y + Math.min(SRC_H, r * CELL + (random(`y${c}-${r}`) - 0.5) * 2 * j)];
  };
  const tris: Tri[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [a, b, cc, d] = [pt(c, r), pt(c + 1, r), pt(c + 1, r + 1), pt(c, r + 1)];
      const halves = (c + r) % 2 ? [[a, b, cc], [a, cc, d]] : [[a, b, d], [b, cc, d]];
      for (const t of halves) {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
        const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
        if (!inside(cx, cy)) continue;
        // Média do centroide com os pontos a meio caminho de cada vértice.
        const s = [sample(cx, cy), ...t.map(([x, y]) => sample((x + cx) / 2, (y + cy) / 2))];
        const rgb = [0, 1, 2].map((k) => s.reduce((acc, v) => acc + v[k], 0) / s.length);
        const gray = (rgb[0] + rgb[1] + rgb[2]) / 3;
        // Levemente dessaturado e com mais contraste, puxando as sombras para o fundo da marca.
        const [R, G, B] = rgb.map((v) => Math.max(0, Math.min(255, (v * 0.8 + gray * 0.2 - 128) * 1.12 + 128)));
        tris.push({
          d: `M${t[0][0]},${t[0][1]}L${t[1][0]},${t[1][1]}L${t[2][0]},${t[2][1]}Z`,
          fill: `rgb(${R | 0},${G | 0},${B | 0})`,
          cx,
          cy,
          dist: Math.min(1, Math.hypot(cx - FACE.x, cy - FACE.y) / 700),
          r: random(`r${tris.length}`),
        });
      }
    }
  }
  return tris;
};

const useMesh = () => {
  const [tris, setTris] = useState<Tri[] | null>(null);
  const [handle] = useState(() => delayRender("Montando o retrato low poly"));
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setTris(buildMesh(img));
      continueRender(handle);
    };
    img.src = staticFile("pedro.jpg");
  }, [handle]);
  return tris;
};

/** `build` 0..1 monta os triângulos (do rosto para fora); `burst` 0..1 explode e some. */
const LowPoly: React.FC<{ width: number; build: number; burst: number; glow: number; sec: number }> = ({ width, build, burst, glow, sec }) => {
  const tris = useMesh();
  if (!tris) return null;
  const sweep = SRC_Y + ((sec * 260) % (SRC_H + 400)) - 200;
  return (
    <svg width={width} height={(width * SRC_H) / SRC_W} viewBox={`0 ${SRC_Y} ${SRC_W} ${SRC_H}`} style={{ overflow: "visible", display: "block" }}>
      <defs>
        {/* Esfuma ombros e peito, onde a foto acaba, sem tocar no rosto. */}
        <radialGradient id="lp-fade" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0.66" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="lp-mask" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="5000">
          <rect x="0" y={SRC_Y} width={SRC_W} height={SRC_H} fill="url(#lp-fade)" />
        </mask>
      </defs>
      <g mask="url(#lp-mask)">
        {tris.map((t, i) => {
          const start = t.dist * 0.55 + t.r * 0.15;
          const p = SPRING(Math.min(1, Math.max(0, (build - start) / 0.3)));
          if (p <= 0) return null;
          const fly = 1 - p;
          const ang = t.r * Math.PI * 2;
          const out = burst * (260 + t.r * 500);
          const dx = Math.cos(ang) * 420 * fly + ((t.cx - FACE.x) / 300) * out;
          const dy = Math.sin(ang) * 420 * fly + ((t.cy - FACE.y) / 300) * out + burst * burst * 300;
          const near = Math.max(0, 1 - Math.abs(t.cy - sweep) / 70);
          return (
            <path
              key={i}
              d={t.d}
              fill={t.fill}
              stroke={near > 0 || glow > 0 ? K.primary : t.fill}
              strokeOpacity={near > 0 || glow > 0 ? Math.min(1, 0.12 + near * 0.6 + glow * 0.25) : 1}
              strokeWidth={0.8}
              strokeLinejoin="round"
              opacity={Math.min(1, p * 1.5) * (1 - burst)}
              transform={`translate(${dx} ${dy}) rotate(${(fly * 160 + burst * 220) * (t.r - 0.5)} ${t.cx} ${t.cy})`}
            />
          );
        })}
      </g>
    </svg>
  );
};

/* Legenda da fala, frase por frase, com os tempos medidos no áudio (public/voz-intro.mp3). */
const CAPTIONS = [
  { text: "Olá, meu nome é *Pedro", start: 0.2, end: 2.9 },
  { text: "e hoje vim apresentar um projeto em que trabalho há *8 *meses.", start: 3.35, end: 8.4 },
  { text: "O *Kinetic é um app para quem gosta e faz academia,", start: 9.15, end: 12.85 },
  { text: "mas não somente isso:", start: 13.7, end: 15.7 },
  { text: "ele resolve a dor do *profissional *de *educação *física.", start: 16.1, end: 19.05 },
  { text: "Fica com o vídeo!", start: 19.75, end: 20.6 },
];

const Caption: React.FC = () => (
  <>
    {CAPTIONS.map((c, i) => {
      const n = c.text.split(" ").length;
      return (
        <div key={i} style={{ position: "absolute", left: 70, right: 70, top: 1330 }}>
          <Words
            text={c.text}
            delay={c.start}
            out={Math.min(c.end + 0.25, CAPTIONS[i + 1]?.start ?? 99)}
            stagger={Math.min(0.14, ((c.end - c.start) * 0.6) / n)}
            size={62}
            lineHeight={1.12}
            style={{ justifyContent: "center", textAlign: "center" }}
          />
        </div>
      );
    })}
  </>
);

const PORTRAIT_W = 880;
/** Duração do áudio da abertura (20,8 s) + respiro antes da transição. */
export const PORTRAIT_SEC = 21.5;

export const PortraitIntroV: React.FC = () => {
  const { a, sec } = useAnim();
  // Posição do retrato: centro → esquerda (com o app) → topo (com o painel) → centro → explode.
  const T = [9.0, 9.8, 13.5, 14.3, 18.9, 19.5];
  const cx = keys(sec, T, [540, 290, 290, 540, 540, 540]);
  const top = keys(sec, T, [230, 330, 330, 150, 150, 230]);
  const s = keys(sec, T, [1, 0.6, 0.6, 0.44, 0.44, 1]);
  const burst = a(19.7, 20.6, 0, 1, Easing.in(Easing.cubic));
  const speaking = CAPTIONS.some((c) => sec > c.start && sec < c.end) ? 1 : 0;
  const phoneX = a(9.2, 10.0, 1200, 600, SPRING) + a(13.4, 14.0, 0, 700, IN_OUT);
  const deskY = a(14.0, 14.8, 1920, 640) + a(18.6, 19.2, 0, 1400, IN_OUT);
  const DS = 0.68;
  return (
    <AbsoluteFill>
      <Background glowX={50} glowY={38} />
      <div style={{ position: "absolute", left: cx - (PORTRAIT_W * s) / 2, top, width: PORTRAIT_W, transformOrigin: "left top", scale: String(s) }}>
        <div style={{ scale: String(1 + Math.sin(sec * 1.6) * 0.008 + speaking * 0.006), transformOrigin: "50% 60%" }}>
          <LowPoly width={PORTRAIT_W} build={a(0, 1.9, 0, 1, Easing.linear)} burst={burst} glow={a(1.6, 2.2, 1, 0) + speaking * 0.4} sec={sec} />
        </div>
      </div>
      {phoneX < 1150 && (
        <div style={{ position: "absolute", left: phoneX, top: 300, scale: "0.8", transformOrigin: "left top", rotate: `${a(9.2, 10.0, 8, -3)}deg` }}>
          <Phone>
            <HomeScreen t={sec - 9.6} pressAt={12.2 - 9.6} />
          </Phone>
        </div>
      )}
      {deskY < 1900 && (
        <div style={{ position: "absolute", left: (1080 - BROWSER_W * DS) / 2, top: deskY, scale: String(DS), transformOrigin: "left top" }}>
          <Browser url="app.kinetic.com.br/students">
            <Shell crumb="Visão geral" topRight={<TopRightDefault />}>
              <Dashboard t={sec - 14.2} />
            </Shell>
          </Browser>
        </div>
      )}
      <Caption />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40, opacity: a(20.0, 20.4) }}>
        <LogoMark height={150} progress={[a(20.0, 20.6, 0, 1, SPRING), a(20.1, 20.7, 0, 1, SPRING), a(20.2, 20.8, 0, 1, SPRING)]} />
        <div
          style={{
            fontFamily: sans,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 140,
            letterSpacing: "0.06em",
            color: K.text,
            lineHeight: 1,
            clipPath: `inset(-10% ${ar(sec, 20.2, 20.9, 100, 0, IN_OUT)}% -10% 0)`,
          }}
        >
          KINETIC
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
