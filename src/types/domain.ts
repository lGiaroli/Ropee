export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type Goal =
  | 'fat_loss'
  | 'endurance'
  | 'habit'
  | 'cardio'
  | 'gym_companion';

export type IntensityPreference = 'low' | 'medium' | 'high';

export type Difficulty = 'beginner' | 'medium' | 'advanced';

export type RoutinePhaseType =
  | 'warmup'
  | 'jump'
  | 'short_rest'
  | 'long_rest'
  | 'recovery'
  | 'cooldown'
  | 'strength';

export type SessionStatus = 'completed' | 'abandoned';

export type PerceivedDifficulty = 1 | 2 | 3 | 4 | 5;

export type MissionType =
  | 'daily_workout'
  | 'jump_minutes'
  | 'streak'
  | 'no_skip'
  | 'new_routine'
  | 'strength_finisher'
  | 'weekly_jumps'
  | 'weekly_workouts'
  | 'weekly_best';

export type MissionStatus = 'active' | 'completed' | 'claimed';

export type CueType =
  | 'jump'
  | 'rest'
  | 'long_rest'
  | 'countdown'
  | 'finish'
  | 'strength';

export interface UserProfile {
  id: string;
  name: string;
  level: FitnessLevel;
  goal: Goal;
  availableTime: number;
  weeklyGoal: number;
  intensityPreference: IntensityPreference;
  weightKg?: number;
  jumpCadenceSpm?: number;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
  remindersEnabled: boolean;
  reminderTime: string;
  silentMode: boolean;
  vibrationOnly: boolean;
}

export interface RoutinePhaseTemplate {
  type: RoutinePhaseType;
  durationSeconds: number;
  label: string;
  message?: string;
}

export interface StrengthExercise {
  id: string;
  name: string;
  seconds: number;
  restSeconds: number;
  enabled: boolean;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  blocks: number;
  roundsPerBlock: number;
  jumpSeconds: number;
  shortRestSeconds: number;
  longRestSeconds: number;
  warmupSeconds: number;
  cooldownSeconds: number;
  hasStrengthFinisher: boolean;
  strengthExercises: StrengthExercise[];
  estimatedDuration: number;
  estimatedJumpDuration: number;
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  customPhases?: RoutinePhaseTemplate[];
}

export interface WorkoutPhase {
  id: string;
  type: RoutinePhaseType;
  label: string;
  durationSeconds: number;
  block?: number;
  round?: number;
  module?: number;
  exerciseId?: string;
  message: string;
}

export interface WorkoutPlan {
  routineId: string;
  phases: WorkoutPhase[];
  totalDuration: number;
  jumpDuration: number;
  restDuration: number;
  strengthDuration: number;
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  startedAt: string;
  completedAt: string;
  status: SessionStatus;
  totalDuration: number;
  jumpDuration: number;
  restDuration: number;
  skippedPhases: number;
  completedStrengthFinisher: boolean;
  caloriesEstimated: number;
  jumpsEstimated: number;
  xpEarned: number;
  perceivedDifficulty?: PerceivedDifficulty;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastWorkoutDate?: string;
  streakRepairTokens: number;
  completedMissions: string[];
  badges: string[];
}

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardXp: number;
  status: MissionStatus;
  cadence: 'daily' | 'weekly';
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  objective: string;
  icon: string;
  requires?: string[];
  unlockedAt?: string;
}

export interface Zone {
  id: string;
  title: string;
  description: string;
  minLevel: number;
  color: string;
  suggestedRoutineIds: string[];
}

export interface WorkoutCompletionResult {
  session: WorkoutSession;
  xpBreakdown: XpBreakdown;
  unlockedBadges: Badge[];
  completedMissions: Mission[];
  levelBefore: number;
  levelAfter: number;
  recommendation: string;
}

export interface XpBreakdown {
  base: number;
  jumpMinutes: number;
  dailyGoal: number;
  streak: number;
  skipAdjustment: number;
  total: number;
}
