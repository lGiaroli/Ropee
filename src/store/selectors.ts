import { useMemo } from 'react';
import { badgeCatalog } from '@/data/gamification';
import { buildMissions } from '@/features/gamification/missions';
import { progressToNextLevel } from '@/features/gamification/levels';
import { currentWeekJumpReport, dailySummary, lastNDaysActivity, summarizeSessions, weeklySummary } from '@/features/progress/stats';
import { useAppStore } from '@/store/useAppStore';

export const useDashboardData = () => {
  const profile = useAppStore((state) => state.profile);
  const gamification = useAppStore((state) => state.gamification);
  const routines = useAppStore((state) => state.routines);
  const sessions = useAppStore((state) => state.sessions);
  const favoriteRoutineId = useAppStore((state) => state.favoriteRoutineId);

  return useMemo(() => {
    const now = new Date();
    const week = weeklySummary(sessions, now);
    const today = dailySummary(sessions, now);
    const weekDays = currentWeekJumpReport(sessions, now);
    const stats = summarizeSessions(sessions);
    const levelProgress = progressToNextLevel(gamification.xp);
    const missions = buildMissions(sessions, gamification).slice(0, 4);
    const routine =
      routines.find((candidate) => candidate.id === favoriteRoutineId) ??
      routines.find((candidate) => candidate.isFavorite) ??
      routines[0];
    return {
      profile,
      gamification,
      levelProgress,
      missions,
      routine,
      week,
      today,
      weekDays,
      stats,
      lastSession: sessions[0],
      activity: lastNDaysActivity(sessions, 7, now),
    };
  }, [favoriteRoutineId, gamification, profile, routines, sessions]);
};

export const useMissionData = () => {
  const sessions = useAppStore((state) => state.sessions);
  const gamification = useAppStore((state) => state.gamification);
  return useMemo(() => buildMissions(sessions, gamification), [gamification, sessions]);
};

export const useBadgeData = () => {
  const unlockedBadges = useAppStore((state) => state.unlockedBadges);
  const badgeIds = useAppStore((state) => state.gamification.badges);
  return useMemo(
    () =>
      badgeCatalog.map((badge) => ({
        ...badge,
        unlockedAt: unlockedBadges.find((unlocked) => unlocked.id === badge.id)?.unlockedAt,
        unlocked: badgeIds.includes(badge.id),
      })),
    [badgeIds, unlockedBadges],
  );
};
