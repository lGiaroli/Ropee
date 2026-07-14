import { describe, expect, it } from 'vitest';
import { calculateXp } from '@/features/gamification/xp';
import { levelForXp, progressToNextLevel } from '@/features/gamification/levels';
import { updateStreak } from '@/features/gamification/streaks';

describe('gamification', () => {
  it('calculates XP with jump minutes, daily goal and streak bonus', () => {
    const xp = calculateXp({
      completed: true,
      jumpSeconds: 12 * 60,
      skippedPhases: 0,
      completedDailyGoal: true,
      streakAfterWorkout: 7,
    });
    expect(xp.total).toBe(160);
    expect(xp.streak).toBe(25);
  });

  it('keeps same-day streak stable', () => {
    const result = updateStreak('2026-07-06T20:00:00.000Z', '2026-07-06T10:00:00.000Z', 4, 4, 1);
    expect(result.currentStreak).toBe(4);
    expect(result.bestStreak).toBe(4);
  });

  it('uses one repair token for a one-day gap', () => {
    const result = updateStreak('2026-07-08T20:00:00.000Z', '2026-07-06T20:00:00.000Z', 4, 4, 1);
    expect(result.currentStreak).toBe(5);
    expect(result.usedRepair).toBe(true);
    expect(result.streakRepairTokens).toBe(0);
  });

  it('keeps the streak through configured rest days', () => {
    const result = updateStreak('2026-07-10T20:00:00.000Z', '2026-07-06T20:00:00.000Z', 4, 4, 1, 4);
    expect(result.currentStreak).toBe(5);
    expect(result.usedRepair).toBe(false);
    expect(result.streakRepairTokens).toBe(1);
  });

  it('breaks the streak after exceeding weekly rest allowance', () => {
    const result = updateStreak('2026-07-11T20:00:00.000Z', '2026-07-06T20:00:00.000Z', 4, 8, 0, 4);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(8);
  });

  it('uses a repair token for one extra rest day beyond the plan', () => {
    const result = updateStreak('2026-07-11T20:00:00.000Z', '2026-07-06T20:00:00.000Z', 4, 4, 1, 4);
    expect(result.currentStreak).toBe(5);
    expect(result.usedRepair).toBe(true);
    expect(result.streakRepairTokens).toBe(0);
  });

  it('maps level thresholds', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(200)).toBe(2);
    expect(progressToNextLevel(250).level).toBe(2);
  });
});
