import { defaultRoutines } from '@/data/routines';
import { GamificationProfile, UserProfile } from '@/types/domain';

export const defaultProfile: UserProfile = {
  id: 'local-user',
  name: 'Kari',
  level: 'beginner',
  goal: 'habit',
  availableTime: 10,
  weeklyGoal: 4,
  intensityPreference: 'medium',
  jumpCadenceSpm: 120,
  soundEnabled: true,
  voiceEnabled: true,
  hapticsEnabled: true,
  remindersEnabled: false,
  reminderTime: '19:00',
  silentMode: false,
  vibrationOnly: false,
};

export const defaultGamification: GamificationProfile = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  bestStreak: 0,
  streakRepairTokens: 1,
  completedMissions: [],
  badges: [],
};

export const initialRoutines = defaultRoutines;
