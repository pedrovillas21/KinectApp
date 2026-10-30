// Rodar: node --experimental-strip-types --test src/components/personal/muscleVolume.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NO_GROUP, normalizeMuscle, splitMuscles, weeklyMuscleVolume } from './muscleVolume.ts';
import type { WorkoutExercise, WorkoutPlan } from '../../types';

const ex = (muscles: string | null, sets: number, section = 'PRINCIPAL'): WorkoutExercise => ({
  id: '',
  name: '',
  muscles,
  type: null,
  sets,
  reps: null,
  weight: null,
  restTime: null,
  section,
  notes: null,
});
const plan = (...data: WorkoutExercise[]) => ({ data }) as WorkoutPlan;

test('normaliza termos livres para grupos fixos', () => {
  assert.equal(normalizeMuscle('PEITO'), 'PEITO');
  assert.equal(normalizeMuscle('Peitoral superior'), 'PEITO');
  assert.equal(normalizeMuscle('Tríceps'), 'TRICEPS');
  assert.equal(normalizeMuscle('Posterior de coxa'), 'POSTERIOR');
  assert.equal(normalizeMuscle('Deltoide posterior'), 'OMBRO');
  assert.equal(normalizeMuscle('Elevação lateral'), null);
  assert.equal(normalizeMuscle('Abdômen'), 'ABDOMEN');
  assert.equal(normalizeMuscle('Glúteo médio'), 'GLUTEOS');
  assert.equal(normalizeMuscle('Pernas'), null);
  assert.deepEqual(splitMuscles('Peito / Tríceps, Ombro e Core'), ['Peito', 'Tríceps', 'Ombro', 'Core']);
});

test('primeiro músculo conta 1, os demais 0,5; aquecimento fica de fora', () => {
  const v = weeklyMuscleVolume(
    [plan(ex('Peito / Tríceps', 4), ex('TRICEPS', 3), ex('OMBRO', 2, 'AQUECIMENTO'))],
    null,
  );
  assert.equal(v.byGroup.PEITO, 4);
  assert.equal(v.byGroup.TRICEPS, 2 + 3);
  assert.equal(v.byGroup.OMBRO, 0);
});

test('não reconhecidos e sem grupo não somem', () => {
  const v = weeklyMuscleVolume([plan(ex('Pernas / Glúteos', 4), ex(null, 3))], null);
  assert.equal(v.unmatched.Pernas, 4);
  assert.equal(v.byGroup.GLUTEOS, 2);
  assert.equal(v.unmatched[NO_GROUP], 3);
});

test('frequência semanal distribui as fichas em rodízio', () => {
  // 2 fichas, 4 treinos/semana → cada ficha 2x.
  const v = weeklyMuscleVolume([plan(ex('PEITO', 3)), plan(ex('COSTAS', 3))], 4);
  assert.equal(v.perPlanWeekly, 2);
  assert.equal(v.byGroup.PEITO, 6);
  assert.equal(v.byGroup.COSTAS, 6);
});
