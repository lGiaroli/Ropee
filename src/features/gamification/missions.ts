import { endOfWeek, isSameDay, isWithinInterval, parseISO, startOfWeek } from 'date-fns';
import { missionTemplates } from '@/data/gamification';
import { GamificationProfile, Mission, WorkoutSession } from '@/types/domain';
import { localDateKey, localWeekKey } from '@/utils/date';

export const buildMissions = (
  sessions: WorkoutSession[],
  gamification: GamificationProfile,
  now = new Date(),
  claimedMissionIds: string[] = gamification.completedMissions,
): Mission[] =>
  missionTemplates.map((template) => {
    const progress = missionProgress(template.type, sessions, gamification, now);
    const completed = progress >= template.target;
    return {
      ...template,
      progress: Math.min(template.target, progress),
      status: claimedMissionIds.includes(instanceMissionId(template.id, now))
        ? 'claimed'
        : completed
          ? 'completed'
          : 'active',
    };
  });

export const instanceMissionId = (templateId: string, now = new Date()) => {
  const week = localWeekKey(now);
  const day = localDateKey(now);
  return `${templateId}-${templateId.startsWith('weekly') ? week : day}`;
};

export const claimableMissions = (
  sessions: WorkoutSession[],
  gamification: GamificationProfile,
  now = new Date(),
) => buildMissions(sessions, gamification, now).filter((mission) => mission.status === 'completed');

const missionProgress = (
  type: Mission['type'],
  sessions: WorkoutSession[],
  gamification: GamificationProfile,
  now: Date,
) => {
  const todaySessions = sessions.filter((session) => isSameDay(parseISO(session.completedAt), now));
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weeklySessions = sessions.filter((session) =>
    isWithinInterval(parseISO(session.completedAt), { start: weekStart, end: weekEnd }),
  );

  switch (type) {
    case 'daily_workout':
      return todaySessions.filter((session) => session.status === 'completed').length;
    case 'jump_minutes':
      return Math.floor(todaySessions.reduce((sum, session) => sum + session.jumpDuration, 0) / 60);
    case 'streak':
      return gamification.currentStreak;
    case 'no_skip':
      return todaySessions.some((session) => session.status === 'completed' && session.skippedPhases === 0) ? 1 : 0;
    case 'new_routine':
      return 0;
    case 'strength_finisher':
      return todaySessions.some((session) => session.completedStrengthFinisher) ? 1 : 0;
    case 'weekly_jumps':
      return weeklySessions.reduce((sum, session) => sum + session.jumpsEstimated, 0);
    case 'weekly_workouts':
      return weeklySessions.filter((session) => session.status === 'completed').length;
    case 'weekly_best': {
      const weeklyJump = weeklySessions.reduce((sum, session) => sum + session.jumpDuration, 0);
      const previousBest = bestPreviousWeeklyJumpSeconds(sessions, weekStart);
      return previousBest > 0 && weeklyJump > previousBest ? 1 : 0;
    }
    default:
      return 0;
  }
};

const bestPreviousWeeklyJumpSeconds = (sessions: WorkoutSession[], currentWeekStart: Date) => {
  const totals = new Map<string, number>();
  sessions.forEach((session) => {
    const completedAt = parseISO(session.completedAt);
    if (completedAt >= currentWeekStart) return;
    const week = localWeekKey(completedAt);
    totals.set(week, (totals.get(week) ?? 0) + session.jumpDuration);
  });
  return Math.max(0, ...Array.from(totals.values()));
};
