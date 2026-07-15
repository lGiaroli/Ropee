import { addDays, endOfWeek, isSameDay, isWithinInterval, parseISO, startOfWeek, subDays } from 'date-fns';
import { WorkoutSession } from '@/types/domain';
import { localDateKey } from '@/utils/date';

const weekDayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
export const DEFAULT_JUMP_CADENCE_SPM = 120;
export const JUMP_CADENCE_OPTIONS = [90, 120, 150, 180, 210] as const;

export const normalizeJumpCadenceSpm = (cadencePerMinute = DEFAULT_JUMP_CADENCE_SPM) =>
  Math.min(240, Math.max(60, Math.round(cadencePerMinute)));

const calorieCadenceMultiplier = (cadencePerMinute = DEFAULT_JUMP_CADENCE_SPM) => {
  const cadenceRatio = normalizeJumpCadenceSpm(cadencePerMinute) / DEFAULT_JUMP_CADENCE_SPM;
  return Math.min(1.45, Math.max(0.75, cadenceRatio));
};

export const estimateCalories = (
  jumpSeconds: number,
  weightKg = 70,
  intensity = 10,
  cadencePerMinute = DEFAULT_JUMP_CADENCE_SPM,
) => {
  const hours = jumpSeconds / 3600;
  return Math.round(intensity * weightKg * hours * calorieCadenceMultiplier(cadencePerMinute));
};

export const estimateJumps = (jumpSeconds: number, cadencePerMinute = DEFAULT_JUMP_CADENCE_SPM) =>
  Math.round((jumpSeconds / 60) * normalizeJumpCadenceSpm(cadencePerMinute));

export const weeklySummary = (sessions: WorkoutSession[], now = new Date()) => {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  const weekSessions = sessions.filter((session) =>
    isWithinInterval(parseISO(session.completedAt), { start, end }),
  );
  return summarizeSessions(weekSessions);
};

export const dailySummary = (sessions: WorkoutSession[], now = new Date()) => {
  const daySessions = sessions.filter((session) => isSameDay(parseISO(session.completedAt), now));
  return summarizeSessions(daySessions);
};

export const currentWeekJumpReport = (sessions: WorkoutSession[], now = new Date()) => {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  return Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(start, index);
    const daySessions = sessions.filter((session) => isSameDay(parseISO(session.completedAt), date));
    const jumpDuration = daySessions.reduce((sum, session) => sum + session.jumpDuration, 0);
    return {
      date: localDateKey(date),
      label: weekDayLabels[index],
      jumpDuration,
      minutes: Math.round(jumpDuration / 60),
      isToday: isSameDay(date, now),
    };
  });
};

export const lastNDaysActivity = (sessions: WorkoutSession[], days = 7, now = new Date()) =>
  Array.from({ length: days }).map((_, index) => {
    const date = subDays(now, days - index - 1);
    const dayKey = localDateKey(date);
    const daySessions = sessions.filter((session) => localDateKey(session.completedAt) === dayKey);
    return {
      date: dayKey,
      minutes: Math.round(daySessions.reduce((sum, session) => sum + session.totalDuration, 0) / 60),
      completed: daySessions.some((session) => session.status === 'completed'),
    };
  });

export const summarizeSessions = (sessions: WorkoutSession[]) => {
  const completed = sessions.filter((session) => session.status === 'completed');
  const totalDuration = sessions.reduce((sum, session) => sum + session.totalDuration, 0);
  const jumpDuration = sessions.reduce((sum, session) => sum + session.jumpDuration, 0);
  const restDuration = sessions.reduce((sum, session) => sum + session.restDuration, 0);
  const calories = sessions.reduce((sum, session) => sum + session.caloriesEstimated, 0);
  const jumps = sessions.reduce((sum, session) => sum + session.jumpsEstimated, 0);
  const xp = sessions.reduce((sum, session) => sum + session.xpEarned, 0);
  const best = completed.slice().sort((a, b) => b.jumpDuration - a.jumpDuration)[0];

  return {
    totalDuration,
    jumpDuration,
    restDuration,
    workouts: completed.length,
    calories,
    jumps,
    xp,
    bestWorkout: best,
    averageMinutes: completed.length ? Math.round(totalDuration / 60 / completed.length) : 0,
  };
};
