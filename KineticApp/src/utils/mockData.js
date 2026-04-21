/**
 * Mock data centralizado para os 3 dias de treino do Kinetic App.
 * Cada dia tem foco em grupos musculares específicos com exercícios detalhados.
 */

// DIA A — Peito, Ombro e Tríceps (Push Day)
export const DAY_A = [
  { id: 'a1', name: 'Supino Reto com Barra',     muscles: 'PEITO',   type: 'COMPOSTO', sets: 4, reps: '8-10',  weight: '80kg', restTime: '90s' },
  { id: 'a2', name: 'Supino Inclinado Halteres',  muscles: 'PEITO',   type: 'COMPOSTO', sets: 3, reps: '10-12', weight: '28kg', restTime: '75s' },
  { id: 'a3', name: 'Crucifixo na Polia',         muscles: 'PEITO',   type: 'ISOLADO',  sets: 3, reps: '12-15', weight: '15kg', restTime: '60s' },
  { id: 'a4', name: 'Desenvolvimento Militar',    muscles: 'OMBRO',   type: 'COMPOSTO', sets: 4, reps: '8-10',  weight: '50kg', restTime: '90s' },
  { id: 'a5', name: 'Elevação Lateral',           muscles: 'OMBRO',   type: 'ISOLADO',  sets: 4, reps: '12-15', weight: '12kg', restTime: '60s' },
  { id: 'a6', name: 'Elevação Frontal',           muscles: 'OMBRO',   type: 'ISOLADO',  sets: 3, reps: '12',    weight: '10kg', restTime: '45s' },
  { id: 'a7', name: 'Tríceps Polia Alta',         muscles: 'TRÍCEPS', type: 'ISOLADO',  sets: 4, reps: '12',    weight: '30kg', restTime: '60s' },
  { id: 'a8', name: 'Tríceps Francês',            muscles: 'TRÍCEPS', type: 'ISOLADO',  sets: 3, reps: '10-12', weight: '20kg', restTime: '60s' },
];

// DIA B — Bíceps, Costas e Antebraço (Pull Day)
export const DAY_B = [
  { id: 'b1', name: 'Barra Fixa (Pull-up)',       muscles: 'COSTAS',   type: 'COMPOSTO', sets: 4, reps: '6-10',  weight: 'Corpo', restTime: '120s' },
  { id: 'b2', name: 'Remada Curvada c/ Barra',   muscles: 'COSTAS',   type: 'COMPOSTO', sets: 4, reps: '8-10',  weight: '60kg',  restTime: '90s'  },
  { id: 'b3', name: 'Pulley Frente',             muscles: 'COSTAS',   type: 'COMPOSTO', sets: 3, reps: '10-12', weight: '65kg',  restTime: '75s'  },
  { id: 'b4', name: 'Remada Unilateral',         muscles: 'COSTAS',   type: 'COMPOSTO', sets: 3, reps: '10-12', weight: '32kg',  restTime: '60s'  },
  { id: 'b5', name: 'Rosca Direta c/ Barra',     muscles: 'BÍCEPS',   type: 'COMPOSTO', sets: 4, reps: '8-10',  weight: '40kg',  restTime: '75s'  },
  { id: 'b6', name: 'Rosca Alternada Halteres',   muscles: 'BÍCEPS',   type: 'ISOLADO',  sets: 3, reps: '10-12', weight: '16kg',  restTime: '60s'  },
  { id: 'b7', name: 'Rosca Concentrada',          muscles: 'BÍCEPS',   type: 'ISOLADO',  sets: 3, reps: '12-15', weight: '14kg',  restTime: '45s'  },
  { id: 'b8', name: 'Rosca Punho (Wrist Curl)',   muscles: 'ANTEBRAÇO',type: 'ISOLADO',  sets: 3, reps: '15-20', weight: '20kg',  restTime: '45s'  },
];

// DIA C — Quadríceps, Posterior e Glúteo (Leg Day)
export const DAY_C = [
  { id: 'c1', name: 'Agachamento Livre',          muscles: 'QUADRÍCEPS', type: 'COMPOSTO', sets: 4, reps: '6-10',  weight: '100kg', restTime: '120s' },
  { id: 'c2', name: 'Leg Press 45°',             muscles: 'QUADRÍCEPS', type: 'COMPOSTO', sets: 4, reps: '10-12', weight: '180kg', restTime: '90s'  },
  { id: 'c3', name: 'Cadeira Extensora',          muscles: 'QUADRÍCEPS', type: 'ISOLADO',  sets: 3, reps: '12-15', weight: '60kg',  restTime: '60s'  },
  { id: 'c4', name: 'Afundo c/ Halteres',         muscles: 'QUADRÍCEPS', type: 'COMPOSTO', sets: 3, reps: '10 cada', weight: '24kg', restTime: '75s' },
  { id: 'c5', name: 'Stiff c/ Barra',            muscles: 'POSTERIOR',  type: 'COMPOSTO', sets: 4, reps: '8-10',  weight: '60kg',  restTime: '90s'  },
  { id: 'c6', name: 'Mesa Flexora',              muscles: 'POSTERIOR',  type: 'ISOLADO',  sets: 3, reps: '10-12', weight: '50kg',  restTime: '60s'  },
  { id: 'c7', name: 'Hip Thrust c/ Barra',       muscles: 'GLÚTEOS',   type: 'COMPOSTO', sets: 4, reps: '10-12', weight: '80kg',  restTime: '90s'  },
  { id: 'c8', name: 'Panturrilha em Pé',         muscles: 'PANTURRILHA',type: 'ISOLADO',  sets: 4, reps: '15-20', weight: '80kg',  restTime: '45s'  },
];

// Mapa global para lookup por ID de rotina
export const WORKOUT_MAP = {
  '1': { data: DAY_A, title: 'PUSH DAY', subtitle: 'PEITO / OMBRO / TRÍCEPS', tag: 'DIA A' },
  '2': { data: DAY_B, title: 'PULL DAY', subtitle: 'BÍCEPS / COSTAS / ANTEBRAÇO', tag: 'DIA B' },
  '3': { data: DAY_C, title: 'LEG DAY',  subtitle: 'QUADRÍCEPS / POSTERIOR / GLÚTEOS', tag: 'DIA C' },
};

// Mantido para compatibilidade BackWard
export const DAILY_WORKOUT = DAY_A;
