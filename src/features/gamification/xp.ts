import { XpBreakdown } from '@/types/domain';

export interface XpInput {
  completed: boolean;
  jumpSeconds: number;
  skippedPhases: number;
  completedDailyGoal: boolean;
  streakAfterWorkout: number;
}

export const calculateXp = (input: XpInput): XpBreakdown => {
  const base = input.completed ? 50 : 10;
  const jumpMinutes = Math.floor(input.jumpSeconds / 60) * 5;
  const dailyGoal = input.completedDailyGoal ? 25 : 0;
  const streak = streakBonus(input.streakAfterWorkout);
  const skippedPenalty = input.skippedPhases >= 4 ? -25 : input.skippedPhases >= 2 ? -10 : 0;
  const skipAdjustment = input.completed ? skippedPenalty : 0;
  const total = Math.max(5, base + jumpMinutes + dailyGoal + streak + skipAdjustment);

  return {
    base,
    jumpMinutes,
    dailyGoal,
    streak,
    skipAdjustment,
    total,
  };
};

export const streakBonus = (streak: number) => {
  if (streak >= 30) return 100;
  if (streak >= 14) return 50;
  if (streak >= 7) return 25;
  if (streak >= 3) return 10;
  return 0;
};
