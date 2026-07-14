import { StrengthExercise } from '@/types/domain';

export const defaultStrengthExercises: StrengthExercise[] = [
  { id: 'squats', name: 'Sentadillas', seconds: 35, restSeconds: 15, enabled: true },
  { id: 'pushups', name: 'Flexiones', seconds: 30, restSeconds: 20, enabled: true },
  { id: 'plank', name: 'Plancha', seconds: 40, restSeconds: 20, enabled: true },
  { id: 'crunches', name: 'Abdominales', seconds: 35, restSeconds: 15, enabled: true },
  { id: 'lunges', name: 'Zancadas', seconds: 35, restSeconds: 15, enabled: false },
  { id: 'mountain-climbers', name: 'Mountain climbers', seconds: 30, restSeconds: 20, enabled: false },
];
