import { describe, expect, it } from 'vitest';
import { localDateKey, localWeekKey } from '@/utils/date';

describe('local date keys', () => {
  it('keeps late local activity on the local calendar day', () => {
    const lateWorkout = new Date(2026, 6, 14, 23, 45);

    expect(localDateKey(lateWorkout)).toBe('2026-07-14');
  });

  it('uses Monday as the local week boundary', () => {
    const sunday = new Date(2026, 6, 19, 23, 30);

    expect(localWeekKey(sunday)).toBe('2026-07-13');
  });
});
