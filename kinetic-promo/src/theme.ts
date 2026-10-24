import { continueRender, delayRender, staticFile } from "remotion";

// Mesmas fontes do painel (index.html) e do app (expo-google-fonts): Archivo
// variável com eixo de largura, Geist e Geist Mono.
const FONTS = [
  { family: "Archivo", file: "fonts/archivo.woff2", weight: "100 900", stretch: "62% 125%" },
  { family: "Geist", file: "fonts/geist.woff2", weight: "400 700", stretch: "100%" },
  { family: "Geist", file: "fonts/geist-italic.woff2", weight: "800", stretch: "100%", style: "italic" },
  { family: "Geist Mono", file: "fonts/geist-mono.woff2", weight: "400 600", stretch: "100%" },
];

if (typeof document !== "undefined") {
  const handle = delayRender("Carregando fontes");
  Promise.all(
    FONTS.map((f) =>
      new FontFace(f.family, `url(${staticFile(f.file)}) format('woff2')`, {
        weight: f.weight,
        stretch: f.stretch,
        style: "style" in f ? f.style : "normal",
      })
        .load()
        .then((face) => document.fonts.add(face)),
    ),
  ).then(() => continueRender(handle));
}

export const display = "Archivo, sans-serif";
export const sans = "Geist, sans-serif";
export const mono = "'Geist Mono', monospace";
/** Títulos do painel: Archivo semi-expandida (font-stretch-semi-expanded). */
export const SEMI = "112.5%" as const;

// Mesmos tokens de KineticApp/src/theme/kinetic.ts e kinetic-desktop/src/theme/theme.css.
export const K = {
  bg: "#131313",
  surface1: "#1c1b1b",
  surface2: "#2a2a2a",
  surface3: "#353534",
  primary: "#00E5FF",
  primaryDim: "rgba(0,229,255,0.10)",
  primarySoft: "rgba(0,229,255,0.20)",
  onPrimary: "#001a1f",
  text: "#f5f6f7",
  textDim: "rgba(245,246,247,0.62)",
  textMuted: "#8e8f90",
  textSoft: "#dcdddd",
  ghost: "rgba(255,255,255,0.08)",
  ghostHi: "rgba(255,255,255,0.15)",
  hairline: "rgba(255,255,255,0.07)",
  success: "#4ade80",
  warn: "#f5b945",
  alert: "#ff6b6b",
  error: "#ff4444",
  record: "#F5B13D",
} as const;
