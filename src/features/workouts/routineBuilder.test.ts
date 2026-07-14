import { describe, expect, it } from 'vitest';
import { defaultRoutines } from '@/data/routines';
import { buildWorkoutPlan, validateRoutine } from '@/features/workouts/routineBuilder';

describe('routineBuilder', () => {
  it('builds the initial routine with warmup, six jumps, rests and cooldown', () => {
    const routine = defaultRoutines.find((item) => item.id === 'initial-6x20');
    expect(routine).toBeTruthy();
    const plan = buildWorkoutPlan(routine!);
    expect(plan.phases.filter((phase) => phase.type === 'jump')).toHaveLength(6);
    expect(plan.jumpDuration).toBe(120);
    expect(plan.totalDuration).toBe(260);
  });

  it('builds the long routine as 80 modules with long rests between blocks', () => {
    const routine = defaultRoutines.find((item) => item.id === 'long-80x25');
    const plan = buildWorkoutPlan(routine!);
    expect(plan.phases.filter((phase) => phase.type === 'jump')).toHaveLength(80);
    expect(plan.jumpDuration).toBe(2000);
    expect(plan.phases.filter((phase) => phase.type === 'long_rest')).toHaveLength(9);
  });

  it('rejects unsafe custom values', () => {
    const routine = { ...defaultRoutines[0]!, jumpSeconds: 1, blocks: 0 };
    const validation = validateRoutine(routine);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});
