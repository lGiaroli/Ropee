import { describe, expect, it } from 'vitest';
import { routineCategories } from '@/data/routineCatalog';
import { defaultRoutines } from '@/data/routines';

describe('routine catalog', () => {
  it('offers a broad library with at least three routines per category', () => {
    expect(defaultRoutines.length).toBeGreaterThan(25);

    for (const category of routineCategories) {
      expect(category.routineIds.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps every category routine reference valid', () => {
    const routineIds = new Set(defaultRoutines.map((routine) => routine.id));

    for (const category of routineCategories) {
      for (const routineId of category.routineIds) {
        expect(routineIds.has(routineId)).toBe(true);
      }
    }
  });

  it('includes mixed training and recovery routines beyond rope-only sessions', () => {
    const strengthCardioIds = routineCategories.find((category) => category.id === 'strengthCardio')?.routineIds ?? [];
    const relaxIds = routineCategories.find((category) => category.id === 'relax')?.routineIds ?? [];

    const strengthCardioRoutines = defaultRoutines.filter((routine) => strengthCardioIds.includes(routine.id));
    const relaxRoutines = defaultRoutines.filter((routine) => relaxIds.includes(routine.id));

    expect(strengthCardioRoutines.some((routine) => routine.customPhases?.some((phase) => phase.type === 'strength'))).toBe(true);
    expect(relaxRoutines.every((routine) => routine.customPhases?.some((phase) => phase.type === 'recovery'))).toBe(true);
  });
});
