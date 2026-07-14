import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createTimerSnapshot,
  currentPhaseProgress,
  nextPhase,
  previousTimerPhase,
  skipTimerPhase,
  skippedPhaseCount,
  tickTimerSnapshot,
  totalProgress,
  WorkoutTimerMetrics,
  WorkoutTimerSnapshot,
  workoutMetricsFromSnapshot,
} from '@/features/timer/timerEngine';
import { WorkoutPhase, WorkoutPlan } from '@/types/domain';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

interface UseWorkoutTimerOptions {
  onPhaseChange?: (phase: WorkoutPhase) => void;
  onCountdown?: (seconds: number) => void;
  onComplete?: (metrics: WorkoutTimerMetrics) => void;
}

export const useWorkoutTimer = (plan: WorkoutPlan, options: UseWorkoutTimerOptions = {}) => {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [snapshot, setSnapshot] = useState<WorkoutTimerSnapshot>(() => createTimerSnapshot(plan));
  const [startedAt, setStartedAt] = useState<string | undefined>();
  const statusRef = useRef<TimerStatus>('idle');
  const snapshotRef = useRef(snapshot);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const applySnapshot = useCallback((nextSnapshot: WorkoutTimerSnapshot) => {
    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);
  }, []);

  useEffect(() => {
    const initialSnapshot = createTimerSnapshot(plan);
    snapshotRef.current = initialSnapshot;
    statusRef.current = 'idle';
    // The timer must reset when a different routine is loaded into this screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(initialSnapshot);
    setStatus('idle');
    setStartedAt(undefined);
  }, [plan]);

  const notifyPhaseChange = useCallback(
    (index: number) => {
      const phase = plan.phases[index];
      if (phase) optionsRef.current.onPhaseChange?.(phase);
    },
    [plan.phases],
  );

  const complete = useCallback(
    (finalSnapshot = snapshotRef.current) => {
      if (statusRef.current === 'completed') return;
      statusRef.current = 'completed';
      setStatus('completed');
      optionsRef.current.onComplete?.(workoutMetricsFromSnapshot(plan, finalSnapshot));
    },
    [plan],
  );

  useEffect(() => {
    if (status !== 'running') return undefined;

    const interval = setInterval(() => {
      const previousSnapshot = snapshotRef.current;
      const countdownSeconds = Math.max(0, previousSnapshot.remainingSeconds - 1);
      const nextSnapshot = tickTimerSnapshot(plan, previousSnapshot);
      applySnapshot(nextSnapshot);

      if (nextSnapshot.currentIndex === previousSnapshot.currentIndex) {
        if (countdownSeconds > 0 && countdownSeconds <= 3) {
          optionsRef.current.onCountdown?.(countdownSeconds);
        }
        return;
      }

      if (nextSnapshot.currentIndex >= plan.phases.length) {
        complete(nextSnapshot);
        return;
      }
      notifyPhaseChange(nextSnapshot.currentIndex);
    }, 1000);

    return () => clearInterval(interval);
  }, [applySnapshot, complete, notifyPhaseChange, plan, status]);

  const start = useCallback(() => {
    if (statusRef.current === 'completed') return;
    if (!startedAt) setStartedAt(new Date().toISOString());
    statusRef.current = 'running';
    setStatus('running');
    notifyPhaseChange(snapshotRef.current.currentIndex);
  }, [notifyPhaseChange, startedAt]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    statusRef.current = 'paused';
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    statusRef.current = 'running';
    setStatus('running');
  }, []);

  const restart = useCallback(() => {
    const initialSnapshot = createTimerSnapshot(plan);
    applySnapshot(initialSnapshot);
    setStartedAt(new Date().toISOString());
    statusRef.current = 'running';
    setStatus('running');
    notifyPhaseChange(0);
  }, [applySnapshot, notifyPhaseChange, plan]);

  const skipPhase = useCallback(() => {
    const nextSnapshot = skipTimerPhase(plan, snapshotRef.current);
    applySnapshot(nextSnapshot);
    if (nextSnapshot.currentIndex >= plan.phases.length) {
      complete(nextSnapshot);
      return;
    }
    notifyPhaseChange(nextSnapshot.currentIndex);
  }, [applySnapshot, complete, notifyPhaseChange, plan]);

  const previousPhase = useCallback(() => {
    const nextSnapshot = previousTimerPhase(plan, snapshotRef.current);
    if (nextSnapshot === snapshotRef.current) return;
    applySnapshot(nextSnapshot);
    notifyPhaseChange(nextSnapshot.currentIndex);
  }, [applySnapshot, notifyPhaseChange, plan]);

  const finish = useCallback(() => complete(snapshotRef.current), [complete]);
  const currentPhase = plan.phases[snapshot.currentIndex];
  const metrics = useMemo(() => workoutMetricsFromSnapshot(plan, snapshot), [plan, snapshot]);
  const progress = useMemo(
    () => ({
      phase: currentPhaseProgress(currentPhase, snapshot.remainingSeconds),
      total: totalProgress(plan, snapshot.currentIndex, snapshot.remainingSeconds),
    }),
    [currentPhase, plan, snapshot.currentIndex, snapshot.remainingSeconds],
  );
  const totalRemainingSeconds = useMemo(() => {
    if (!currentPhase) return 0;
    return (
      snapshot.remainingSeconds +
      plan.phases.slice(snapshot.currentIndex + 1).reduce((sum, phase) => sum + phase.durationSeconds, 0)
    );
  }, [currentPhase, plan.phases, snapshot.currentIndex, snapshot.remainingSeconds]);

  return {
    status,
    currentIndex: snapshot.currentIndex,
    currentPhase,
    nextPhase: nextPhase(plan, snapshot.currentIndex),
    remainingSeconds: snapshot.remainingSeconds,
    elapsedSeconds: metrics.totalSeconds,
    totalRemainingSeconds,
    skippedPhases: skippedPhaseCount(snapshot),
    startedAt: startedAt ?? new Date().toISOString(),
    metrics,
    progress,
    canGoBack: snapshot.currentIndex > 0,
    start,
    pause,
    resume,
    restart,
    skipPhase,
    previousPhase,
    finish,
  };
};
