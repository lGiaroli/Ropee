export type AchievementFamily =
  | 'streak'
  | 'workouts'
  | 'minutes'
  | 'clean'
  | 'strength'
  | 'jumps'
  | 'calories'
  | 'session'
  | 'week'
  | 'level';

export type AchievementTier = 'starter' | 'bronze' | 'silver' | 'gold' | 'legendary';

export interface AchievementVisual {
  family: AchievementFamily;
  tier: AchievementTier;
}

export const fallbackAchievementVisual: AchievementVisual = {
  family: 'workouts',
  tier: 'starter',
};

export const achievementFamilyColors: Record<AchievementFamily, { primary: string; soft: string; border: string }> = {
  streak: { primary: '#FF765F', soft: 'rgba(255, 118, 95, 0.12)', border: 'rgba(255, 118, 95, 0.32)' },
  workouts: { primary: '#715BFF', soft: 'rgba(113, 91, 255, 0.11)', border: 'rgba(113, 91, 255, 0.3)' },
  minutes: { primary: '#8169F5', soft: 'rgba(129, 105, 245, 0.11)', border: 'rgba(129, 105, 245, 0.3)' },
  clean: { primary: '#31D0A6', soft: 'rgba(49, 208, 166, 0.12)', border: 'rgba(49, 208, 166, 0.32)' },
  strength: { primary: '#9B65F4', soft: 'rgba(155, 101, 244, 0.12)', border: 'rgba(155, 101, 244, 0.31)' },
  jumps: { primary: '#52CFC1', soft: 'rgba(82, 207, 193, 0.12)', border: 'rgba(82, 207, 193, 0.32)' },
  calories: { primary: '#FFAF45', soft: 'rgba(255, 175, 69, 0.13)', border: 'rgba(255, 175, 69, 0.34)' },
  session: { primary: '#6F5BFF', soft: 'rgba(111, 91, 255, 0.11)', border: 'rgba(111, 91, 255, 0.3)' },
  week: { primary: '#67B8FF', soft: 'rgba(103, 184, 255, 0.13)', border: 'rgba(103, 184, 255, 0.34)' },
  level: { primary: '#8C65FF', soft: 'rgba(140, 101, 255, 0.12)', border: 'rgba(140, 101, 255, 0.32)' },
};

export const achievementTierStyles: Record<
  AchievementTier,
  {
    rim: string;
    rimLight: string;
    core: string;
    shine: string;
  }
> = {
  starter: { rim: '#8FE6D0', rimLight: '#E4FFF6', core: '#31CFAA', shine: '#FFFFFF' },
  bronze: { rim: '#D99655', rimLight: '#FFE0BA', core: '#B86A2D', shine: '#FFF4DE' },
  silver: { rim: '#BFC7D8', rimLight: '#F5F7FF', core: '#7D8799', shine: '#FFFFFF' },
  gold: { rim: '#FFCB5B', rimLight: '#FFF1B8', core: '#D99A25', shine: '#FFFFFF' },
  legendary: { rim: '#8567FF', rimLight: '#E6D8FF', core: '#4EE0C2', shine: '#FFFFFF' },
};

export const achievementVisualsById: Record<string, AchievementVisual> = {
  'first-workout': { family: 'workouts', tier: 'starter' },
  'two-day-streak': { family: 'streak', tier: 'starter' },
  'three-day-streak': { family: 'streak', tier: 'starter' },
  'five-day-streak': { family: 'streak', tier: 'bronze' },
  'seven-day-streak': { family: 'streak', tier: 'bronze' },
  'fourteen-day-streak': { family: 'streak', tier: 'silver' },
  'thirty-day-streak': { family: 'streak', tier: 'silver' },
  'sixty-day-streak': { family: 'streak', tier: 'gold' },
  'hundred-day-streak': { family: 'streak', tier: 'legendary' },
  'three-workouts': { family: 'workouts', tier: 'bronze' },
  'five-workouts': { family: 'workouts', tier: 'bronze' },
  'ten-workouts': { family: 'workouts', tier: 'silver' },
  'twenty-five-workouts': { family: 'workouts', tier: 'silver' },
  'fifty-workouts': { family: 'workouts', tier: 'gold' },
  'hundred-workouts': { family: 'workouts', tier: 'gold' },
  'two-fifty-workouts': { family: 'workouts', tier: 'legendary' },
  'five-hundred-workouts': { family: 'workouts', tier: 'legendary' },
  'five-jump-minutes': { family: 'minutes', tier: 'starter' },
  'fifteen-jump-minutes': { family: 'minutes', tier: 'starter' },
  'thirty-jump-minutes': { family: 'minutes', tier: 'bronze' },
  'one-hour-jumping': { family: 'minutes', tier: 'bronze' },
  'two-hours-jumping': { family: 'minutes', tier: 'silver' },
  'five-hours-jumping': { family: 'minutes', tier: 'gold' },
  'ten-hours-jumping': { family: 'minutes', tier: 'legendary' },
  'twenty-hours-jumping': { family: 'minutes', tier: 'legendary' },
  'first-no-skip': { family: 'clean', tier: 'starter' },
  'ten-no-skip': { family: 'clean', tier: 'silver' },
  'fifty-no-skip': { family: 'clean', tier: 'legendary' },
  'strength-finisher': { family: 'strength', tier: 'starter' },
  'five-strength-finishers': { family: 'strength', tier: 'silver' },
  'twenty-five-strength-finishers': { family: 'strength', tier: 'legendary' },
  'one-thousand-jumps': { family: 'jumps', tier: 'starter' },
  'five-thousand-jumps': { family: 'jumps', tier: 'bronze' },
  'ten-thousand-jumps': { family: 'jumps', tier: 'silver' },
  'fifty-thousand-jumps': { family: 'jumps', tier: 'gold' },
  'hundred-thousand-jumps': { family: 'jumps', tier: 'legendary' },
  'hundred-calories': { family: 'calories', tier: 'starter' },
  'thousand-calories': { family: 'calories', tier: 'bronze' },
  'five-thousand-calories': { family: 'calories', tier: 'gold' },
  'ten-thousand-calories': { family: 'calories', tier: 'legendary' },
  'ten-min-single-session': { family: 'session', tier: 'bronze' },
  'twenty-min-single-session': { family: 'session', tier: 'gold' },
  'thirty-min-single-session': { family: 'session', tier: 'legendary' },
  'three-workouts-week': { family: 'week', tier: 'bronze' },
  'four-workouts-week': { family: 'week', tier: 'gold' },
  'level-two': { family: 'level', tier: 'starter' },
  'level-five': { family: 'level', tier: 'bronze' },
  'level-ten': { family: 'level', tier: 'silver' },
  'level-eighteen': { family: 'level', tier: 'gold' },
  'level-twenty-five': { family: 'level', tier: 'legendary' },
};

export const visualForAchievement = (id: string) => achievementVisualsById[id] ?? fallbackAchievementVisual;
