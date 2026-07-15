import { WorkoutPhase, WorkoutPlan } from '@/types/domain';

export interface WorkoutTimerSnapshot {
  currentIndex: number;
  remainingSeconds: number;
  elapsedByPhase: number[];
  skippedByPhase: boolean[];
}

export interface WorkoutTimerMetrics {
  totalSeconds: number;
  jumpSeconds: number;
  restSeconds: number;
  strengthSeconds: number;
}

const restPhaseTypes = new Set<WorkoutPhase['type']>(['short_rest', 'long_rest', 'recovery', 'cooldown']);

const clampedElapsed = (phase: WorkoutPhase | undefined, elapsedSeconds: number | undefined) => {
  if (!phase) return 0;
  return Math.min(phase.durationSeconds, Math.max(0, Math.floor(elapsedSeconds ?? 0)));
};

export const createTimerSnapshot = (plan: WorkoutPlan): WorkoutTimerSnapshot => ({
  currentIndex: 0,
  remainingSeconds: plan.phases[0]?.durationSeconds ?? 0,
  elapsedByPhase: plan.phases.map(() => 0),
  skippedByPhase: plan.phases.map(() => false),
});

export const tickTimerSnapshot = (plan: WorkoutPlan, snapshot: WorkoutTimerSnapshot): WorkoutTimerSnapshot => {
  const phase = plan.phases[snapshot.currentIndex];
  if (!phase) return snapshot;

  const elapsedByPhase = [...snapshot.elapsedByPhase];
  const elapsed = Math.min(phase.durationSeconds, clampedElapsed(phase, elapsedByPhase[snapshot.currentIndex]) + 1);
  elapsedByPhase[snapshot.currentIndex] = elapsed;
  const remainingSeconds = phase.durationSeconds - elapsed;

  if (remainingSeconds > 0) {
    return { ...snapshot, elapsedByPhase, remainingSeconds };
  }

  const currentIndex = snapshot.currentIndex + 1;
  return {
    ...snapshot,
    currentIndex,
    elapsedByPhase,
    remainingSeconds: plan.phases[currentIndex]?.durationSeconds ?? 0,
  };
};

export const advanceTimerSnapshot = (
  plan: WorkoutPlan,
  snapshot: WorkoutTimerSnapshot,
  elapsedSeconds: number,
): WorkoutTimerSnapshot => {
  let nextSnapshot = snapshot;
  const seconds = Math.max(0, Math.floor(elapsedSeconds));

  for (let second = 0; second < seconds && nextSnapshot.currentIndex < plan.phases.length; second += 1) {
    nextSnapshot = tickTimerSnapshot(plan, nextSnapshot);
  }

  return nextSnapshot;
};

export const skipTimerPhase = (plan: WorkoutPlan, snapshot: WorkoutTimerSnapshot): WorkoutTimerSnapshot => {
  const phase = plan.phases[snapshot.currentIndex];
  if (!phase) return snapshot;

  const skippedByPhase = [...snapshot.skippedByPhase];
  skippedByPhase[snapshot.currentIndex] = clampedElapsed(phase, snapshot.elapsedByPhase[snapshot.currentIndex]) < phase.durationSeconds;
  const currentIndex = snapshot.currentIndex + 1;

  return {
    ...snapshot,
    currentIndex,
    skippedByPhase,
    remainingSeconds: plan.phases[currentIndex]?.durationSeconds ?? 0,
  };
};

export const previousTimerPhase = (plan: WorkoutPlan, snapshot: WorkoutTimerSnapshot): WorkoutTimerSnapshot => {
  if (snapshot.currentIndex <= 0) return snapshot;

  const currentIndex = Math.min(snapshot.currentIndex - 1, plan.phases.length - 1);
  const elapsedByPhase = [...snapshot.elapsedByPhase];
  const skippedByPhase = [...snapshot.skippedByPhase];

  // Rewinding invalidates both the abandoned phase and the phase being retried.
  if (snapshot.currentIndex < plan.phases.length) {
    elapsedByPhase[snapshot.currentIndex] = 0;
    skippedByPhase[snapshot.currentIndex] = false;
  }
  elapsedByPhase[currentIndex] = 0;
  skippedByPhase[currentIndex] = false;

  return {
    currentIndex,
    elapsedByPhase,
    skippedByPhase,
    remainingSeconds: plan.phases[currentIndex]?.durationSeconds ?? 0,
  };
};

export const workoutMetricsFromSnapshot = (
  plan: WorkoutPlan,
  snapshot: WorkoutTimerSnapshot,
): WorkoutTimerMetrics =>
  plan.phases.reduce<WorkoutTimerMetrics>(
    (metrics, phase, index) => {
      const elapsed = clampedElapsed(phase, snapshot.elapsedByPhase[index]);
      metrics.totalSeconds += elapsed;
      if (phase.type === 'jump') metrics.jumpSeconds += elapsed;
      if (phase.type === 'strength') metrics.strengthSeconds += elapsed;
      if (restPhaseTypes.has(phase.type)) metrics.restSeconds += elapsed;
      return metrics;
    },
    { totalSeconds: 0, jumpSeconds: 0, restSeconds: 0, strengthSeconds: 0 },
  );

export const skippedPhaseCount = (snapshot: WorkoutTimerSnapshot) =>
  snapshot.skippedByPhase.filter(Boolean).length;

export const currentPhaseProgress = (phase: WorkoutPhase | undefined, remainingSeconds: number) => {
  if (!phase || phase.durationSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, (phase.durationSeconds - remainingSeconds) / phase.durationSeconds));
};

export const totalProgress = (plan: WorkoutPlan, currentIndex: number, remainingSeconds: number) => {
  const completedBefore = plan.phases
    .slice(0, currentIndex)
    .reduce((sum, phase) => sum + phase.durationSeconds, 0);
  const currentPhase = plan.phases[currentIndex];
  const currentElapsed = currentPhase ? currentPhase.durationSeconds - remainingSeconds : 0;
  if (plan.totalDuration <= 0) return 0;
  return Math.min(1, Math.max(0, (completedBefore + currentElapsed) / plan.totalDuration));
};

export const nextPhase = (plan: WorkoutPlan, currentIndex: number) => plan.phases[currentIndex + 1];

export const elapsedFromTimer = (plan: WorkoutPlan, currentIndex: number, remainingSeconds: number) => {
  const completedBefore = plan.phases
    .slice(0, currentIndex)
    .reduce((sum, phase) => sum + phase.durationSeconds, 0);
  const current = plan.phases[currentIndex];
  return completedBefore + (current ? current.durationSeconds - remainingSeconds : 0);
};
