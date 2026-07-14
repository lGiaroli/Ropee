import { describe, expect, it } from 'vitest';
import { estimateCalories, estimateJumps, normalizeJumpCadenceSpm } from '@/features/progress/stats';

describe('progress stats estimates', () => {
  it('uses jump cadence for estimated jumps', () => {
    expect(estimateJumps(60, 180)).toBe(180);
    expect(estimateJumps(60, 90)).toBe(90);
  });

  it('adjusts estimated calories by jump cadence', () => {
    const baseline = estimateCalories(20 * 60, 70, 10, 120);
    const faster = estimateCalories(20 * 60, 70, 10, 180);

    expect(faster).toBeGreaterThan(baseline);
  });

  it('normalizes unrealistic cadence values', () => {
    expect(normalizeJumpCadenceSpm(20)).toBe(60);
    expect(normalizeJumpCadenceSpm(300)).toBe(240);
  });
});
