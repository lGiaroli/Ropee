import { WorkoutRoutine } from '@/types/domain';

const getDayOfYear = (date: Date) => {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const yearStart = new Date(date.getFullYear(), 0, 0);
  return Math.floor((today.getTime() - yearStart.getTime()) / 86_400_000);
};

export const getDailyChallengeRoutine = (routines: WorkoutRoutine[], date = new Date()) => {
  if (routines.length === 0) return undefined;
  const index = getDayOfYear(date) % routines.length;
  return routines[index] ?? routines[0];
};
