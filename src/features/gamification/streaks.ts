import { differenceInCalendarDays, isSameDay, parseISO } from 'date-fns';

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  usedRepair: boolean;
  lastWorkoutDate: string;
  streakRepairTokens: number;
}

const allowedRestDaysForGoal = (weeklyGoal: number) =>
  7 - Math.min(7, Math.max(1, Math.round(weeklyGoal)));

export const isStreakActive = (
  nowIso: string,
  lastWorkoutDateIso: string | undefined,
  currentStreak: number,
  streakRepairTokens: number,
  weeklyGoal = 7,
) => {
  if (!lastWorkoutDateIso || currentStreak <= 0) return false;
  const daysSinceWorkout = differenceInCalendarDays(parseISO(nowIso), parseISO(lastWorkoutDateIso));
  if (daysSinceWorkout <= 0) return true;

  const restDaysSinceWorkout = daysSinceWorkout - 1;
  const repairAllowance = streakRepairTokens > 0 ? 1 : 0;
  return restDaysSinceWorkout <= allowedRestDaysForGoal(weeklyGoal) + repairAllowance;
};

export const updateStreak = (
  workoutDateIso: string,
  lastWorkoutDateIso: string | undefined,
  currentStreak: number,
  bestStreak: number,
  streakRepairTokens: number,
  weeklyGoal = 7,
): StreakResult => {
  const workoutDate = parseISO(workoutDateIso);
  const allowedRestDays = allowedRestDaysForGoal(weeklyGoal);
  if (!lastWorkoutDateIso) {
    return {
      currentStreak: 1,
      bestStreak: Math.max(bestStreak, 1),
      usedRepair: false,
      lastWorkoutDate: workoutDateIso,
      streakRepairTokens,
    };
  }

  const lastWorkoutDate = parseISO(lastWorkoutDateIso);
  if (isSameDay(workoutDate, lastWorkoutDate)) {
    return {
      currentStreak,
      bestStreak,
      usedRepair: false,
      lastWorkoutDate: workoutDateIso,
      streakRepairTokens,
    };
  }

  const diff = differenceInCalendarDays(workoutDate, lastWorkoutDate);
  const restDaysBetweenWorkouts = diff - 1;
  if (diff > 0 && restDaysBetweenWorkouts <= allowedRestDays) {
    const nextStreak = currentStreak + 1;
    return {
      currentStreak: nextStreak,
      bestStreak: Math.max(bestStreak, nextStreak),
      usedRepair: false,
      lastWorkoutDate: workoutDateIso,
      streakRepairTokens,
    };
  }

  if (diff > 0 && restDaysBetweenWorkouts === allowedRestDays + 1 && streakRepairTokens > 0) {
    const repairedStreak = currentStreak + 1;
    return {
      currentStreak: repairedStreak,
      bestStreak: Math.max(bestStreak, repairedStreak),
      usedRepair: true,
      lastWorkoutDate: workoutDateIso,
      streakRepairTokens: streakRepairTokens - 1,
    };
  }

  return {
    currentStreak: 1,
    bestStreak: Math.max(bestStreak, 1),
    usedRepair: false,
    lastWorkoutDate: workoutDateIso,
    streakRepairTokens,
  };
};
