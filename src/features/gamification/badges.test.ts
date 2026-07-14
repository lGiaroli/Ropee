import { describe, expect, it } from 'vitest';
import { achievementVisualsById } from '@/data/achievementVisuals';
import { badgeCatalog } from '@/data/gamification';
import { evaluateNewBadges } from '@/features/gamification/badges';
import { defaultGamification } from '@/store/defaultState';
import { WorkoutSession } from '@/types/domain';

const makeSession = (index: number, overrides: Partial<WorkoutSession> = {}): WorkoutSession => {
  const completedAt = new Date(Date.UTC(2026, 6, 6 + index, 10, 10)).toISOString();
  const startedAt = new Date(Date.UTC(2026, 6, 6 + index, 10, 0)).toISOString();

  return {
    id: `session-${index}`,
    routineId: 'initial-6x20',
    routineName: 'Rutina inicial',
    startedAt,
    completedAt,
    status: 'completed',
    totalDuration: 600,
    jumpDuration: 300,
    restDuration: 300,
    skippedPhases: 0,
    completedStrengthFinisher: false,
    caloriesEstimated: 80,
    jumpsEstimated: 800,
    xpEarned: 80,
    ...overrides,
  };
};

describe('badges', () => {
  it('keeps the 50 achievement catalog structurally valid', () => {
    const ids = new Set(badgeCatalog.map((badge) => badge.id));
    const missingDependencies = badgeCatalog.flatMap((badge) =>
      (badge.requires ?? []).filter((requiredBadgeId) => !ids.has(requiredBadgeId)),
    );
    const missingVisuals = badgeCatalog.filter((badge) => !achievementVisualsById[badge.id]).map((badge) => badge.id);
    const orphanVisuals = Object.keys(achievementVisualsById).filter((badgeId) => !ids.has(badgeId));

    expect(badgeCatalog).toHaveLength(50);
    expect(ids.size).toBe(50);
    expect(missingDependencies).toEqual([]);
    expect(missingVisuals).toEqual([]);
    expect(orphanVisuals).toEqual([]);
    badgeCatalog.forEach((badge) => {
      expect(badge.title).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.objective).toBeTruthy();
      expect(badge.icon).toBeTruthy();
    });
  });

  it('unlocks prerequisite chains when a bigger milestone is reached', () => {
    const unlocked = evaluateNewBadges(
      [
        makeSession(0, {
          totalDuration: 4200,
          jumpDuration: 3600,
          restDuration: 600,
          caloriesEstimated: 500,
          jumpsEstimated: 6000,
        }),
      ],
      { ...defaultGamification, currentStreak: 1 },
      new Date('2026-07-06T12:00:00.000Z'),
    ).map((badge) => badge.id);

    expect(unlocked).toEqual(
      expect.arrayContaining([
        'first-workout',
        'five-jump-minutes',
        'fifteen-jump-minutes',
        'thirty-jump-minutes',
        'one-hour-jumping',
        'ten-min-single-session',
        'twenty-min-single-session',
        'thirty-min-single-session',
        'one-thousand-jumps',
        'five-thousand-jumps',
      ]),
    );
  });

  it('does not unlock dependent streak achievements without their prerequisite', () => {
    const unlocked = evaluateNewBadges(
      [],
      { ...defaultGamification, currentStreak: 3 },
      new Date('2026-07-06T12:00:00.000Z'),
    ).map((badge) => badge.id);

    expect(unlocked).not.toContain('two-day-streak');
    expect(unlocked).not.toContain('three-day-streak');
  });

  it('unlocks weekly achievements once the same-week goal and prerequisites are met', () => {
    const sessions = [0, 1, 2, 3].map((index) => makeSession(index));
    const unlocked = evaluateNewBadges(
      sessions,
      { ...defaultGamification, currentStreak: 1 },
      new Date('2026-07-10T12:00:00.000Z'),
    ).map((badge) => badge.id);

    expect(unlocked).toEqual(expect.arrayContaining(['three-workouts', 'three-workouts-week', 'four-workouts-week']));
    expect(unlocked).not.toContain('five-workouts');
  });
});
