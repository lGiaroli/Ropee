import { describe, expect, it } from 'vitest';
import { buildMissions } from '@/features/gamification/missions';
import { defaultGamification } from '@/store/defaultState';
import { WorkoutSession } from '@/types/domain';

const session: WorkoutSession = {
  id: 's1',
  routineId: 'initial-6x20',
  routineName: 'Rutina inicial',
  startedAt: '2026-07-06T10:00:00.000Z',
  completedAt: '2026-07-06T10:10:00.000Z',
  status: 'completed',
  totalDuration: 600,
  jumpDuration: 600,
  restDuration: 0,
  skippedPhases: 0,
  completedStrengthFinisher: true,
  caloriesEstimated: 90,
  jumpsEstimated: 1200,
  xpEarned: 125,
};

describe('missions', () => {
  it('marks daily workout, jump minutes and strength finisher as completed', () => {
    const missions = buildMissions([session], { ...defaultGamification, currentStreak: 1 }, new Date('2026-07-06T12:00:00.000Z'));
    expect(missions.find((mission) => mission.id === 'daily-workout')?.status).toBe('completed');
    expect(missions.find((mission) => mission.id === 'daily-10-jump-min')?.status).toBe('completed');
    expect(missions.find((mission) => mission.id === 'daily-strength')?.status).toBe('completed');
  });
});
