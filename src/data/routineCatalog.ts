import { Difficulty } from '@/types/domain';

export type RoutineCategoryId = 'short' | 'fatBurn' | 'strengthCardio' | 'challenge' | 'relax';
export type RoutineCategoryIcon = 'clock' | 'flame' | 'dumbbell' | 'trophy' | 'heart';

export interface RoutineCategory {
  accent: string;
  background: string;
  description: string;
  gradient: string;
  icon: RoutineCategoryIcon;
  id: RoutineCategoryId;
  range: string;
  routineIds: string[];
  title: string;
}

export const difficultyCopy: Record<Difficulty, string> = {
  advanced: 'Avanzado',
  beginner: 'Principiante',
  medium: 'Intermedio',
};

export const difficultyColors: Record<Difficulty, string> = {
  advanced: '#FF8A33',
  beginner: '#31C77A',
  medium: '#5F7CFF',
};

export const routineCategories: RoutineCategory[] = [
  {
    accent: '#8B61FF',
    background: '#F2EDFF',
    description: 'Sesiones cortas para moverte incluso en dias ocupados.',
    gradient: '#8B61FF',
    icon: 'clock',
    id: 'short',
    range: '< 15 min',
    routineIds: ['initial-6x20', 'quick-spark-8', 'coffee-break-12', 'rope-tabata-14', 'micro-footwork-9', 'lunch-reset-13'],
    title: 'Cortas',
  },
  {
    accent: '#31C77A',
    background: '#ECFFF5',
    description: 'Cardio sostenido con foco en minutos reales y gasto estimado.',
    gradient: '#31C77A',
    icon: 'flame',
    id: 'fatBurn',
    range: '15-30 min',
    routineIds: ['fat-burn-15', 'pomodoro-medium', 'sweat-24', 'steady-burn-28', 'intervals-30', 'calorie-ladder-22'],
    title: 'Quema grasa',
  },
  {
    accent: '#4BA7FF',
    background: '#ECF7FF',
    description: 'Circuitos mixtos con soga, fuerza, core y movilidad activa.',
    gradient: '#4BA7FF',
    icon: 'dumbbell',
    id: 'strengthCardio',
    range: '20-40 min',
    routineIds: ['base-8x6', 'rope-core-circuit-22', 'legs-rope-25', 'upper-cardio-28', 'power-mix-32', 'athletic-40'],
    title: 'Fuerza + cardio',
  },
  {
    accent: '#FF8A33',
    background: '#FFF4E8',
    description: 'Entrenos largos o exigentes para desbloquear nuevas marcas.',
    gradient: '#FF8A33',
    icon: 'trophy',
    id: 'challenge',
    range: '30+ min',
    routineIds: ['long-80x25', 'total-30', 'endurance-45', 'beast-60', 'ladder-pro-38'],
    title: 'Desafio',
  },
  {
    accent: '#FF6FA8',
    background: '#FFF0F7',
    description: 'Recuperacion, movilidad y respiracion para entrenar sin romperte.',
    gradient: '#FF6FA8',
    icon: 'heart',
    id: 'relax',
    range: 'Flexibles',
    routineIds: ['mobility-8', 'soft-flow-12', 'breath-recovery-15', 'ankle-care-10', 'bedtime-release-18'],
    title: 'Relajacion',
  },
];

export const findRoutineCategory = (categoryId?: string) =>
  routineCategories.find((category) => category.id === categoryId) ?? routineCategories[0]!;
