import { describe, expect, it } from 'vitest';
import { defaultRoutines } from '@/data/routines';
import { buildWorkoutPlan } from '@/features/workouts/routineBuilder';
import {
  createTimerSnapshot,
  currentPhaseProgress,
  elapsedFromTimer,
  previousTimerPhase,
  skipTimerPhase,
  skippedPhaseCount,
  tickTimerSnapshot,
  totalProgress,
  workoutMetricsFromSnapshot,
} from '@/features/timer/timerEngine';

describe('timerEngine', () => {
  it('calculates current and total progress', () => {
    const plan = buildWorkoutPlan(defaultRoutines[0]!);
    const phase = plan.phases[0];
    expect(currentPhaseProgress(phase, 15)).toBeCloseTo(0.666, 2);
    expect(totalProgress(plan, 0, 15)).toBeGreaterThan(0);
    expect(elapsedFromTimer(plan, 0, 15)).toBe(30);
  });

  it('counts only seconds that were actually performed when a phase is skipped', () => {
    const plan = buildWorkoutPlan(defaultRoutines[0]!);
    let snapshot = createTimerSnapshot(plan);
    for (let second = 0; second < 12; second += 1) snapshot = tickTimerSnapshot(plan, snapshot);

    snapshot = skipTimerPhase(plan, snapshot);

    expect(workoutMetricsFromSnapshot(plan, snapshot).totalSeconds).toBe(12);
    expect(skippedPhaseCount(snapshot)).toBe(1);
  });

  it('erases the previous attempt when the user rewinds a phase', () => {
    const plan = buildWorkoutPlan(defaultRoutines[0]!);
    let snapshot = createTimerSnapshot(plan);
    for (let second = 0; second < plan.phases[0]!.durationSeconds; second += 1) {
      snapshot = tickTimerSnapshot(plan, snapshot);
    }
    for (let second = 0; second < 5; second += 1) snapshot = tickTimerSnapshot(plan, snapshot);

    snapshot = previousTimerPhase(plan, snapshot);

    expect(snapshot.currentIndex).toBe(0);
    expect(snapshot.remainingSeconds).toBe(plan.phases[0]!.durationSeconds);
    expect(workoutMetricsFromSnapshot(plan, snapshot).totalSeconds).toBe(0);
  });
});
