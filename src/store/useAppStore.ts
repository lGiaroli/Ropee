import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { claimableMissions, instanceMissionId } from '@/features/gamification/missions';
import { evaluateNewBadges } from '@/features/gamification/badges';
import { levelForXp } from '@/features/gamification/levels';
import { updateStreak } from '@/features/gamification/streaks';
import { calculateXp } from '@/features/gamification/xp';
import { progressionRecommendation } from '@/features/progress/recommendations';
import { estimateCalories, estimateJumps } from '@/features/progress/stats';
import { cloneRoutine, estimateRoutineDuration, validateRoutine } from '@/features/workouts/routineBuilder';
import { createId } from '@/utils/id';
import { defaultGamification, defaultProfile, initialRoutines } from '@/store/defaultState';
import {
  Badge,
  GamificationProfile,
  PerceivedDifficulty,
  UserProfile,
  WorkoutCompletionResult,
  WorkoutPlan,
  WorkoutRoutine,
  WorkoutSession,
} from '@/types/domain';

interface AppState {
  hydrated: boolean;
  onboardingComplete: boolean;
  profile: UserProfile;
  gamification: GamificationProfile;
  routines: WorkoutRoutine[];
  sessions: WorkoutSession[];
  unlockedBadges: Badge[];
  favoriteRoutineId?: string;
  lastCompletion?: WorkoutCompletionResult;
  setHydrated: (hydrated: boolean) => void;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  saveRoutine: (routine: WorkoutRoutine) => { ok: boolean; errors: string[] };
  duplicateRoutine: (routineId: string) => void;
  deleteRoutine: (routineId: string) => void;
  toggleFavoriteRoutine: (routineId: string) => void;
  recordWorkout: (input: RecordWorkoutInput) => WorkoutCompletionResult;
  rateWorkout: (sessionId: string, rating: PerceivedDifficulty) => void;
  clearLastCompletion: () => void;
  seedDemoUsage: () => void;
  resetLocalData: () => void;
  syncDefaultRoutines: () => void;
}

interface RecordWorkoutInput {
  routineId: string;
  plan: WorkoutPlan;
  startedAt: string;
  completedAt?: string;
  elapsedSeconds: number;
  jumpElapsedSeconds: number;
  restElapsedSeconds: number;
  strengthElapsedSeconds: number;
  skippedPhases: number;
  completed: boolean;
  completedStrengthFinisher: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboardingComplete: false,
      profile: defaultProfile,
      gamification: defaultGamification,
      routines: initialRoutines,
      sessions: [],
      unlockedBadges: [],
      favoriteRoutineId: 'initial-6x20',
      setHydrated: (hydrated) => set({ hydrated }),
      completeOnboarding: (profile) => {
        set({
          onboardingComplete: true,
          profile,
          favoriteRoutineId: recommendedRoutineForProfile(profile),
        });
      },
      updateProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),
      saveRoutine: (routine) => {
        const estimate = estimateRoutineDuration(routine);
        const nextRoutine: WorkoutRoutine = {
          ...routine,
          estimatedDuration: estimate.totalDuration,
          estimatedJumpDuration: estimate.jumpDuration,
          updatedAt: new Date().toISOString(),
        };
        const validation = validateRoutine(nextRoutine);
        if (!validation.valid) return { ok: false, errors: validation.errors };

        set((state) => ({
          routines: state.routines.some((candidate) => candidate.id === nextRoutine.id)
            ? state.routines.map((candidate) => (candidate.id === nextRoutine.id ? nextRoutine : candidate))
            : [nextRoutine, ...state.routines],
        }));
        return { ok: true, errors: [] };
      },
      duplicateRoutine: (routineId) => {
        const routine = get().routines.find((candidate) => candidate.id === routineId);
        if (!routine) return;
        const cloned = cloneRoutine(routine);
        set((state) => ({ routines: [cloned, ...state.routines] }));
      },
      deleteRoutine: (routineId) =>
        set((state) => ({
          routines: state.routines.filter((routine) => routine.id !== routineId || !routine.isCustom),
          favoriteRoutineId: state.favoriteRoutineId === routineId ? 'initial-6x20' : state.favoriteRoutineId,
        })),
      toggleFavoriteRoutine: (routineId) =>
        set((state) => {
          const target = state.routines.find((routine) => routine.id === routineId);
          if (!target) return state;

          const nextIsFavorite = !target.isFavorite;
          const routines = state.routines.map((routine) =>
            routine.id === routineId ? { ...routine, isFavorite: nextIsFavorite } : routine,
          );
          const nextFavoriteRoutineId = nextIsFavorite
            ? routineId
            : routines.find((routine) => routine.isFavorite)?.id;

          return {
            routines,
            favoriteRoutineId: nextFavoriteRoutineId,
          };
        }),
      recordWorkout: (input) => {
        const state = get();
        const routine = state.routines.find((candidate) => candidate.id === input.routineId) ?? initialRoutines[0];
        if (!routine) {
          throw new Error('No workout routine available');
        }
        const completedAt = input.completedAt ?? new Date().toISOString();
        const totalDuration = Math.min(input.plan.totalDuration, Math.max(0, input.elapsedSeconds));
        const jumpDuration = Math.min(input.plan.jumpDuration, Math.max(0, input.jumpElapsedSeconds));
        const restDuration = Math.min(input.plan.restDuration, Math.max(0, input.restElapsedSeconds));
        const strengthDuration = Math.min(input.plan.strengthDuration, Math.max(0, input.strengthElapsedSeconds));
        const streak = input.completed
          ? updateStreak(
              completedAt,
              state.gamification.lastWorkoutDate,
              state.gamification.currentStreak,
              state.gamification.bestStreak,
              state.gamification.streakRepairTokens,
              state.profile.weeklyGoal,
            )
          : {
              currentStreak: state.gamification.currentStreak,
              bestStreak: state.gamification.bestStreak,
              usedRepair: false,
              lastWorkoutDate: state.gamification.lastWorkoutDate ?? completedAt,
              streakRepairTokens: state.gamification.streakRepairTokens,
            };

        const completedTodayBefore = state.sessions.some(
          (session) => session.status === 'completed' && session.completedAt.slice(0, 10) === completedAt.slice(0, 10),
        );
        const xpBreakdown = calculateXp({
          completed: input.completed,
          jumpSeconds: jumpDuration,
          skippedPhases: input.skippedPhases,
          completedDailyGoal: input.completed && !completedTodayBefore,
          streakAfterWorkout: streak.currentStreak,
        });

        const session: WorkoutSession = {
          id: createId('session'),
          routineId: routine.id,
          routineName: routine.name,
          startedAt: input.startedAt,
          completedAt,
          status: input.completed ? 'completed' : 'abandoned',
          totalDuration,
          jumpDuration,
          restDuration,
          skippedPhases: input.skippedPhases,
          completedStrengthFinisher:
            input.completedStrengthFinisher &&
            input.plan.strengthDuration > 0 &&
            strengthDuration >= input.plan.strengthDuration,
          caloriesEstimated: estimateCalories(jumpDuration, state.profile.weightKg, 10, state.profile.jumpCadenceSpm),
          jumpsEstimated: estimateJumps(jumpDuration, state.profile.jumpCadenceSpm),
          xpEarned: xpBreakdown.total,
        };

        const nextSessions = [session, ...state.sessions].slice(0, 250);
        const levelBefore = state.gamification.level;
        const baseGamification: GamificationProfile = {
          ...state.gamification,
          xp: state.gamification.xp + xpBreakdown.total,
          currentStreak: streak.currentStreak,
          bestStreak: streak.bestStreak,
          lastWorkoutDate: input.completed ? streak.lastWorkoutDate : state.gamification.lastWorkoutDate,
          streakRepairTokens: streak.streakRepairTokens,
        };
        const levelAfter = levelForXp(baseGamification.xp);
        const leveledGamification = {
          ...baseGamification,
          level: levelAfter,
        };

        const claimable = claimableMissions(nextSessions, leveledGamification, new Date(completedAt));
        const claimIds = claimable.map((mission) => instanceMissionId(mission.id, new Date(completedAt)));
        const missionXp = claimable.reduce((sum, mission) => sum + mission.rewardXp, 0);
        const withMissionXp = {
          ...leveledGamification,
          xp: leveledGamification.xp + missionXp,
          completedMissions: Array.from(new Set([...leveledGamification.completedMissions, ...claimIds])),
        };
        withMissionXp.level = levelForXp(withMissionXp.xp);

        const newBadges = evaluateNewBadges(nextSessions, withMissionXp, new Date(completedAt));
        const nextGamification = {
          ...withMissionXp,
          badges: Array.from(new Set([...withMissionXp.badges, ...newBadges.map((badge) => badge.id)])),
        };

        const result: WorkoutCompletionResult = {
          session: { ...session, xpEarned: session.xpEarned + missionXp },
          xpBreakdown: {
            ...xpBreakdown,
            total: xpBreakdown.total + missionXp,
          },
          unlockedBadges: newBadges,
          completedMissions: claimable,
          levelBefore,
          levelAfter: nextGamification.level,
          recommendation: progressionRecommendation(nextSessions, state.routines, routine.id),
        };

        set({
          sessions: nextSessions,
          gamification: nextGamification,
          unlockedBadges: [...newBadges, ...state.unlockedBadges].slice(0, 100),
          lastCompletion: result,
        });

        return result;
      },
      rateWorkout: (sessionId, rating) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, perceivedDifficulty: rating } : session,
          ),
          lastCompletion:
            state.lastCompletion?.session.id === sessionId
              ? {
                  ...state.lastCompletion,
                  session: { ...state.lastCompletion.session, perceivedDifficulty: rating },
                }
              : state.lastCompletion,
        })),
      clearLastCompletion: () => set({ lastCompletion: undefined }),
      syncDefaultRoutines: () =>
        set((state) => ({
          routines: mergeDefaultRoutines(state.routines),
        })),
      seedDemoUsage: () => {
        const now = new Date();
        const profile: UserProfile = {
          ...defaultProfile,
          availableTime: 20,
          jumpCadenceSpm: 150,
          weeklyGoal: 4,
          weightKg: 70,
        };
        const sessions = buildDemoUsageSessions(now, profile.weightKg, profile.jumpCadenceSpm).slice(0, 250);
        const xp = sessions.reduce((sum, session) => sum + session.xpEarned, 0);
        const lastWorkoutDate = sessions[0]?.completedAt;
        const gamification: GamificationProfile = {
          ...defaultGamification,
          xp,
          level: levelForXp(xp),
          currentStreak: 12,
          bestStreak: 18,
          lastWorkoutDate,
          streakRepairTokens: 1,
          badges: [
            'first-workout',
            'three-workouts',
            'five-jump-minutes',
            'thirty-jump-minutes',
            'hundred-calories',
            'level-two',
          ],
        };

        set({
          onboardingComplete: true,
          profile,
          gamification,
          routines: initialRoutines,
          sessions,
          unlockedBadges: [],
          favoriteRoutineId: 'base-8x6',
          lastCompletion: undefined,
        });
      },
      resetLocalData: () =>
        set({
          onboardingComplete: false,
          profile: defaultProfile,
          gamification: defaultGamification,
          routines: initialRoutines,
          sessions: [],
          unlockedBadges: [],
          favoriteRoutineId: 'initial-6x20',
          lastCompletion: undefined,
        }),
    }),
    {
      name: 'ropequest-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.syncDefaultRoutines();
        state?.setHydrated(true);
      },
    },
  ),
);

const mergeDefaultRoutines = (routines: WorkoutRoutine[]) => {
  const existingById = new Map(routines.map((routine) => [routine.id, routine]));
  const defaultIds = new Set(initialRoutines.map((routine) => routine.id));

  const defaults = initialRoutines.map((defaultRoutine) => {
    const existing = existingById.get(defaultRoutine.id);
    if (!existing || existing.isCustom) return defaultRoutine;
    return {
      ...defaultRoutine,
      createdAt: existing.createdAt ?? defaultRoutine.createdAt,
      isFavorite: existing.isFavorite,
    };
  });

  const customAndUnknown = routines.filter((routine) => routine.isCustom || !defaultIds.has(routine.id));
  return [...defaults, ...customAndUnknown];
};

const recommendedRoutineForProfile = (profile: UserProfile) => {
  if (profile.level === 'advanced' || profile.availableTime >= 45) return 'long-80x25';
  if (profile.level === 'intermediate' || profile.availableTime >= 20) return 'base-8x6';
  return 'initial-6x20';
};

const demoUsagePattern = [
  { daysAgo: 3, minutes: 24, routineId: 'base-8x6', routineName: 'Rutina base' },
  { daysAgo: 1, minutes: 31, routineId: 'pomodoro-medium', routineName: 'Ritmo medio Pomodoro' },
  { daysAgo: -1, minutes: 27, routineId: 'base-8x6', routineName: 'Rutina base' },
  { daysAgo: -3, minutes: 35, routineId: 'long-80x25', routineName: 'Rutina larga' },
  { daysAgo: 8, minutes: 28, routineId: 'base-8x6', routineName: 'Rutina base' },
  { daysAgo: 10, minutes: 20, routineId: 'pomodoro-medium', routineName: 'Ritmo medio Pomodoro' },
  { daysAgo: 12, minutes: 24, routineId: 'base-8x6', routineName: 'Rutina base' },
  { daysAgo: 14, minutes: 17, routineId: 'initial-6x20', routineName: 'Rutina inicial' },
  { daysAgo: 15, minutes: 31, routineId: 'base-8x6', routineName: 'Rutina base' },
  { daysAgo: 17, minutes: 21, routineId: 'pomodoro-medium', routineName: 'Ritmo medio Pomodoro' },
  { daysAgo: 19, minutes: 27, routineId: 'base-8x6', routineName: 'Rutina base' },
  { daysAgo: 21, minutes: 19, routineId: 'initial-6x20', routineName: 'Rutina inicial' },
  { daysAgo: 23, minutes: 25, routineId: 'base-8x6', routineName: 'Rutina base' },
  { daysAgo: 26, minutes: 22, routineId: 'pomodoro-medium', routineName: 'Ritmo medio Pomodoro' },
  { daysAgo: 28, minutes: 15, routineId: 'initial-6x20', routineName: 'Rutina inicial' },
];

const buildDemoUsageSessions = (now: Date, weightKg = 70, cadenceSpm = 120): WorkoutSession[] =>
  demoUsagePattern
    .map((entry, index) => {
      const completedAt = new Date(now);
      completedAt.setDate(now.getDate() - entry.daysAgo);
      completedAt.setHours(19, 10 + (index % 5) * 7, 0, 0);
      const jumpDuration = entry.minutes * 60;
      const restDuration = Math.round(jumpDuration * 0.42);
      const totalDuration = jumpDuration + restDuration + 150;
      return {
        id: `demo-session-${entry.daysAgo}`,
        routineId: entry.routineId,
        routineName: entry.routineName,
        startedAt: new Date(completedAt.getTime() - totalDuration * 1000).toISOString(),
        completedAt: completedAt.toISOString(),
        status: 'completed' as const,
        totalDuration,
        jumpDuration,
        restDuration,
        skippedPhases: index % 7 === 0 ? 1 : 0,
        completedStrengthFinisher: entry.routineId !== 'initial-6x20',
        caloriesEstimated: estimateCalories(jumpDuration, weightKg, 10, cadenceSpm),
        jumpsEstimated: estimateJumps(jumpDuration, cadenceSpm),
        xpEarned: 80 + entry.minutes * 6 + (index % 4 === 0 ? 35 : 0),
      };
    })
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
