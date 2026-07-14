import { parseISO, startOfWeek } from 'date-fns';
import { badgeCatalog } from '@/data/gamification';
import { Badge, GamificationProfile, WorkoutSession } from '@/types/domain';

const weekKey = (isoDate: string) => {
  const weekStart = startOfWeek(parseISO(isoDate), { weekStartsOn: 1 });
  return weekStart.toISOString().slice(0, 10);
};

const maxCompletedWorkoutsInWeek = (sessions: WorkoutSession[]) => {
  const counts = new Map<string, number>();
  sessions.forEach((session) => {
    const key = weekKey(session.completedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Math.max(0, ...counts.values());
};

export const evaluateNewBadges = (
  sessions: WorkoutSession[],
  gamification: GamificationProfile,
  now = new Date(),
): Badge[] => {
  const alreadyUnlocked = new Set(gamification.badges);
  const completedSessions = sessions.filter((session) => session.status === 'completed');
  const completedCount = completedSessions.length;
  const jumpMinutes = completedSessions.reduce((sum, session) => sum + session.jumpDuration, 0) / 60;
  const totalJumps = completedSessions.reduce((sum, session) => sum + session.jumpsEstimated, 0);
  const totalCalories = completedSessions.reduce((sum, session) => sum + session.caloriesEstimated, 0);
  const noSkipCount = completedSessions.filter((session) => session.skippedPhases === 0).length;
  const strengthFinisherCount = completedSessions.filter((session) => session.completedStrengthFinisher).length;
  const bestSingleJumpMinutes = Math.max(0, ...completedSessions.map((session) => session.jumpDuration / 60));
  const bestWeekWorkouts = maxCompletedWorkoutsInWeek(completedSessions);

  const checks: Record<string, boolean> = {
    'first-workout': completedCount >= 1,
    'two-day-streak': gamification.currentStreak >= 2,
    'three-day-streak': gamification.currentStreak >= 3,
    'five-day-streak': gamification.currentStreak >= 5,
    'seven-day-streak': gamification.currentStreak >= 7,
    'fourteen-day-streak': gamification.currentStreak >= 14,
    'thirty-day-streak': gamification.currentStreak >= 30,
    'sixty-day-streak': gamification.currentStreak >= 60,
    'hundred-day-streak': gamification.currentStreak >= 100,
    'three-workouts': completedCount >= 3,
    'five-workouts': completedCount >= 5,
    'ten-workouts': completedCount >= 10,
    'twenty-five-workouts': completedCount >= 25,
    'fifty-workouts': completedCount >= 50,
    'hundred-workouts': completedCount >= 100,
    'two-fifty-workouts': completedCount >= 250,
    'five-hundred-workouts': completedCount >= 500,
    'five-jump-minutes': jumpMinutes >= 5,
    'fifteen-jump-minutes': jumpMinutes >= 15,
    'thirty-jump-minutes': jumpMinutes >= 30,
    'one-hour-jumping': jumpMinutes >= 60,
    'two-hours-jumping': jumpMinutes >= 120,
    'five-hours-jumping': jumpMinutes >= 300,
    'ten-hours-jumping': jumpMinutes >= 600,
    'twenty-hours-jumping': jumpMinutes >= 1200,
    'first-no-skip': noSkipCount >= 1,
    'ten-no-skip': noSkipCount >= 10,
    'fifty-no-skip': noSkipCount >= 50,
    'strength-finisher': strengthFinisherCount >= 1,
    'five-strength-finishers': strengthFinisherCount >= 5,
    'twenty-five-strength-finishers': strengthFinisherCount >= 25,
    'one-thousand-jumps': totalJumps >= 1000,
    'five-thousand-jumps': totalJumps >= 5000,
    'ten-thousand-jumps': totalJumps >= 10000,
    'fifty-thousand-jumps': totalJumps >= 50000,
    'hundred-thousand-jumps': totalJumps >= 100000,
    'hundred-calories': totalCalories >= 100,
    'thousand-calories': totalCalories >= 1000,
    'five-thousand-calories': totalCalories >= 5000,
    'ten-thousand-calories': totalCalories >= 10000,
    'ten-min-single-session': bestSingleJumpMinutes >= 10,
    'twenty-min-single-session': bestSingleJumpMinutes >= 20,
    'thirty-min-single-session': bestSingleJumpMinutes >= 30,
    'three-workouts-week': bestWeekWorkouts >= 3,
    'four-workouts-week': bestWeekWorkouts >= 4,
    'level-two': gamification.level >= 2,
    'level-five': gamification.level >= 5,
    'level-ten': gamification.level >= 10,
    'level-eighteen': gamification.level >= 18,
    'level-twenty-five': gamification.level >= 25,
  };

  const fulfilled = new Set(alreadyUnlocked);
  const newlyUnlocked = new Set<string>();
  let changed = true;

  while (changed) {
    changed = false;
    badgeCatalog.forEach((badge) => {
      if (fulfilled.has(badge.id) || !checks[badge.id]) return;
      const requirements = badge.requires ?? [];
      const requirementsMet = requirements.every((requiredBadgeId) => fulfilled.has(requiredBadgeId));
      if (!requirementsMet) return;

      fulfilled.add(badge.id);
      newlyUnlocked.add(badge.id);
      changed = true;
    });
  }

  return badgeCatalog
    .filter((badge) => newlyUnlocked.has(badge.id))
    .map((badge) => ({
      ...badge,
      unlockedAt: now.toISOString(),
    }));
};

export const badgesWithUnlockState = (badgeIds: string[], unlockedBadges: Badge[]) =>
  badgeCatalog.map((badge) => {
    const unlocked = unlockedBadges.find((candidate) => candidate.id === badge.id);
    return {
      ...badge,
      unlockedAt: unlocked?.unlockedAt ?? (badgeIds.includes(badge.id) ? new Date().toISOString() : undefined),
    };
  });
