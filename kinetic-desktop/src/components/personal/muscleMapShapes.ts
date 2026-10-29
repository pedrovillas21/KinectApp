import type { MuscleGroup } from './muscleVolume';

/**
 * Anatomia do mapa muscular (viewBox 0 0 200 400, eixo do corpo em x = 100).
 * Cada músculo é desenhado só do lado esquerdo da tela; o direito sai do espelho
 * (`MIRROR`), então os dois lados são simétricos por construção.
 */

export const VIEW_W = 200;
export const VIEW_H = 400;
export const MIRROR = `matrix(-1 0 0 1 ${VIEW_W} 0)`;

export type MuscleId =
  | 'chest'
  | 'abs'
  | 'obliques'
  | 'front-delts'
  | 'biceps'
  | 'forearms'
  | 'quads'
  | 'calves'
  | 'traps'
  | 'upper-back'
  | 'lats'
  | 'lower-back'
  | 'glutes'
  | 'hamstrings'
  | 'triceps'
  | 'rear-delts';

/** Região desenhada → grupo do cálculo de séries (o volume é por grupo). */
export const MUSCLES: Record<MuscleId, { group: MuscleGroup; label: string }> = {
  chest: { group: 'PEITO', label: 'Peito' },
  abs: { group: 'ABDOMEN', label: 'Abdômen' },
  obliques: { group: 'ABDOMEN', label: 'Oblíquos' },
  'front-delts': { group: 'OMBRO', label: 'Deltoide anterior' },
  biceps: { group: 'BICEPS', label: 'Bíceps' },
  forearms: { group: 'ANTEBRACO', label: 'Antebraço' },
  quads: { group: 'QUADRICEPS', label: 'Quadríceps' },
  calves: { group: 'PANTURRILHA', label: 'Panturrilha' },
  traps: { group: 'COSTAS', label: 'Trapézio' },
  'upper-back': { group: 'COSTAS', label: 'Costas altas' },
  lats: { group: 'COSTAS', label: 'Dorsal' },
  'lower-back': { group: 'COSTAS', label: 'Lombar' },
  glutes: { group: 'GLUTEOS', label: 'Glúteos' },
  hamstrings: { group: 'POSTERIOR', label: 'Posterior' },
  triceps: { group: 'TRICEPS', label: 'Tríceps' },
  'rear-delts': { group: 'OMBRO', label: 'Deltoide posterior' },
};

type Pt = [number, number];
/** Curva cúbica: controle 1, controle 2, ponto final. */
type Seg = [Pt, Pt, Pt];

const mirrorPt = ([x, y]: Pt): Pt => [VIEW_W - x, y];
const fmt = ([x, y]: Pt) => `${x} ${y}`;

/**
 * Contorno fechado e contínuo a partir da metade esquerda (começa e termina no eixo):
 * a metade direita é a mesma curva espelhada e percorrida ao contrário.
 */
function symmetricOutline(start: Pt, half: Seg[]): string {
  const ends = [start, ...half.map((s) => s[2])];
  const back = half.map(([c1, c2], i): Seg => [mirrorPt(c2), mirrorPt(c1), mirrorPt(ends[i])]).reverse();
  return `M${fmt(start)}${[...half, ...back].map((s) => ` C${s.map(fmt).join(' ')}`).join('')}Z`;
}

/** Silhueta inteira (frente e costas usam a mesma): do alto da cabeça ao gancho, lado esquerdo. */
export const SILHOUETTE = symmetricOutline(
  [100, 8],
  [
    // cabeça e mandíbula
    [[89, 8], [82, 16], [82, 30]],
    [[82, 41], [85, 48], [91, 52]],
    // pescoço e caimento do trapézio
    [[91, 56], [91, 61], [90, 64]],
    [[82, 68], [70, 70], [62, 74]],
    // ombro e braço (face externa)
    [[52, 77], [47, 85], [47, 96]],
    [[46, 115], [43, 140], [44, 158]],
    [[40, 175], [37, 205], [38, 226]],
    // mão
    [[34, 238], [37, 256], [44, 262]],
    [[49, 264], [53, 252], [52, 240]],
    [[52, 234], [51, 230], [51, 226]],
    // braço (face interna) até a axila
    [[54, 205], [58, 180], [58, 162]],
    [[60, 140], [62, 120], [64, 104]],
    // tronco: cintura e quadril
    [[66, 125], [71, 150], [70, 168]],
    [[69, 182], [62, 192], [62, 206]],
    // perna (face externa)
    [[61, 236], [66, 268], [70, 288]],
    [[71, 298], [66, 312], [68, 330]],
    [[70, 348], [76, 360], [77, 372]],
    // pé
    [[77, 380], [71, 385], [72, 390]],
    [[78, 394], [88, 394], [90, 392]],
    [[92, 386], [90, 378], [90, 372]],
    // perna (face interna) até o gancho
    [[92, 355], [97, 335], [96, 318]],
    [[95, 305], [93, 298], [93, 290]],
    [[94, 262], [99, 236], [100, 214]],
  ],
);

// ── Formas compartilhadas entre frente e costas ──

const DELT =
  'M67 75 C56 74 48 81 47.3 94 C46.8 105 48 114 51 122 C54 113 57 104 61 97 C64 92 67 87 69 82 C69.5 79 68.8 76.5 67 75 Z';
/** Largo no cotovelo (braquiorradial) e afinando até o pulso. */
const FOREARM =
  'M46 161.5 C51 159 55.8 160 57.2 164.5 C57.6 171 56.9 179 55.3 187 C53.2 196 50.6 207 48.8 219 C46.6 221 43.2 221 41 219.5 C40.4 210 40.6 200 41 190 C41.4 180 42.6 170 46 161.5 Z';

export const FRONT: [MuscleId, string[]][] = [
  ['traps', ['M91 57 C90 63 82 68 67 73 C77 75.5 87 74 93 71 C92.5 66 91.8 61 91 57 Z']],
  ['front-delts', [DELT]],
  ['chest', ['M98.5 79 C90 76.5 79 77 70 81 C66 88 64 96 64.5 104 C70 116 83 123 98.5 121 Z']],
  [
    'biceps',
    ['M60 104 C63 110 63 122 62 132 C61 142 59 151 56 158 C52 159.5 48.5 157 47.5 151 C46.5 140 48 128 51.5 122.5 C54 115 56.5 108 60 104 Z'],
  ],
  ['forearms', [FOREARM]],
  [
    'abs',
    [
      'M98.5 124 C93 123 87 124 85.5 127 C85 132 85 137 86 141 C90 142.5 94.5 142.5 98.5 142 Z',
      'M98.5 145 C94 145 89 145 86 146.5 C85.5 151 85.6 156 86.5 160.5 C90 162 94.5 162 98.5 161.5 Z',
      'M98.5 164.5 C94 164.5 89.5 164.5 87 166 C86.7 171 87 176 88 180.5 C91.5 182 95 182 98.5 181.5 Z',
      'M98.5 184.5 C94.5 184.5 91 185 88.5 186.5 C88.8 193 91.5 201 96 207 C97 208 98 208.3 98.5 208 Z',
    ],
  ],
  [
    'obliques',
    ['M84 125 C79 123.5 73 122 68 121.5 C69.5 136 72 153 71.4 168 C70.8 179 68.6 188 66 195 C72 197 79 199 87.5 203 C86.5 196 86 188 86 181 C85.4 162 84.8 144 84 125 Z'],
  ],
  [
    'quads',
    [
      // Vasto lateral, reto femoral e vasto medial ocupam a coxa inteira; bordas vizinhas
      // são a mesma curva recuada 1,2 de cada lado (costura de ~2px, como no abdômen).
      'M63 208 C66 206.8 68.5 206.3 70.8 206.5 C69.3 228 71.3 262 77.8 285.5 C75 286.5 72.5 286.2 70.6 285 C67 266 62 236 63 208 Z',
      'M73.2 207 C77.5 207.6 82.5 208.6 86.8 211 C89.8 238 86.8 266 80 283 C73.7 262 71.7 228 73.2 207 Z',
      'M89.2 211.5 C92.5 212.5 96 214.5 98.6 217 C97.8 238 92.8 262 91.8 288 C89 291.5 85 291 82.2 286 C89.2 266 92.2 238 89.2 211.5 Z',
    ],
  ],
  [
    'calves',
    [
      'M73 298 C69 304 67.2 314 67.8 324 C68.6 338 72 350 76 358 C77.5 346 78.5 326 78 312 C77.7 304 75.8 299 73 298 Z',
      'M87 296 C92.5 299 95.6 308 95.6 320 C95.6 334 92.5 348 88.5 360 C86 348 84.8 332 84.8 318 C84.8 307 85.5 300 87 296 Z',
    ],
  ],
];

export const BACK: [MuscleId, string[]][] = [
  ['traps', ['M98.5 54 C95 60 93 64 90 66 C82 69 72 71 64 75 C70 80 78 86 84 96 C90 110 95 128 98.5 150 Z']],
  ['rear-delts', [DELT]],
  // Costas em "V", peças encaixadas: infraespinhal sob o trapézio, dorsal abrindo da axila
  // e fechando na cintura, lombar preenchendo o fundo do V até os glúteos.
  ['upper-back', ['M68 89 C71.5 88 74.5 88.5 77.5 89.5 C81 93 83 97 84.5 101 C87 108 89 114 90.5 121 C84 125 74 121 66 110.5 C63.2 103 63.8 95 68 89 Z']],
  ['lats', ['M66 113 C74 124 84 128.5 91.5 124.5 C93.5 134 95.5 144 97 154 C90 166 80 179 72.5 188 C70.8 182 71.4 174 71.3 166 C71.2 150 68.5 128 66 113 Z']],
  ['lower-back', ['M98.5 157 C91.5 168 82 180.5 75 190.5 C82.5 190 91.5 194.5 98.5 201.5 Z']],
  [
    'triceps',
    ['M58.5 103.5 C62.5 108 63.5 120 62.5 132 C61.5 143 59.5 151 56 158 C52.5 159.5 49 157.5 47.8 152 C46.8 141 47.5 128 50 120 C52 112 55 106.5 58.5 103.5 Z'],
  ],
  ['forearms', [FOREARM]],
  ['glutes', ['M97.5 204 C92 197 82 192 72 194 C66 196.5 63 205 63.6 215 C64.4 226 70.5 234 80 237 C88 239.5 95 238 98.5 235 C98.5 225 98.2 213 97.5 204 Z']],
  [
    'hamstrings',
    [
      // Bíceps femoral (fora) e semitendíneo/semimembranáceo (dentro), da prega glútea ao joelho.
      'M63 226 C68 235.5 74 238.5 79.8 239.6 C78.3 258 78.3 276 78.8 292 C75.5 292.5 72.5 289.5 70.6 285 C67 266 62 244 63 226 Z',
      'M82.2 239.8 C88 241.8 94.5 240.5 97.8 238 C96.8 254 92.2 268 91.8 288 C89 292 85 293 81.2 292 C80.7 276 80.7 258 82.2 239.8 Z',
    ],
  ],
  [
    'calves',
    [
      'M72 298 C68 304 66.8 316 67.6 328 C68.6 340 73 350 79 356 C80.4 342 81 322 80.4 306 C79.2 300 75.5 297 72 298 Z',
      'M82.6 304 C85 298 92 298 94.8 308 C96.6 318 95.5 334 91 346 C88.5 352 85 356 82 357 C81.2 340 81.2 320 82.6 304 Z',
    ],
  ],
];
