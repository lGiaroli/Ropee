import { RoutinePhaseType, WorkoutPhase, WorkoutPlan, WorkoutRoutine } from '@/types/domain';

export interface RoutineValidationResult {
  valid: boolean;
  errors: string[];
}

const phaseMessages: Record<RoutinePhaseType, string> = {
  warmup: 'Calentá suave antes de empezar.',
  jump: 'Ritmo constante.',
  short_rest: 'Respirá, recuperá y volvemos.',
  long_rest: 'Descanso largo, recuperá el aire.',
  recovery: 'Caminá suave y bajá pulsaciones.',
  cooldown: 'Bajá un cambio y soltá piernas.',
  strength: 'Cierre fuerte, técnica primero.',
};

const restTypes = new Set<RoutinePhaseType>(['short_rest', 'long_rest', 'recovery', 'cooldown']);

export const validateRoutine = (routine: WorkoutRoutine): RoutineValidationResult => {
  const errors: string[] = [];
  if (!routine.name.trim()) errors.push('Poné un nombre para reconocer la rutina.');
  if (routine.blocks < 1 || routine.blocks > 20) errors.push('Los bloques deben estar entre 1 y 20.');
  if (routine.roundsPerBlock < 1 || routine.roundsPerBlock > 80) errors.push('Las rondas por bloque deben estar entre 1 y 80.');
  if (routine.jumpSeconds < 5 || routine.jumpSeconds > 600) errors.push('El salto debe estar entre 5 segundos y 10 minutos.');
  if (routine.shortRestSeconds < 0 || routine.shortRestSeconds > 300) errors.push('El descanso corto debe estar entre 0 y 5 minutos.');
  if (routine.longRestSeconds < 0 || routine.longRestSeconds > 600) errors.push('El descanso largo debe estar entre 0 y 10 minutos.');
  if (routine.warmupSeconds < 0 || routine.warmupSeconds > 900) errors.push('El calentamiento debe estar entre 0 y 15 minutos.');
  if (routine.cooldownSeconds < 0 || routine.cooldownSeconds > 900) errors.push('La recuperación final debe estar entre 0 y 15 minutos.');
  if (estimateRoutineDuration(routine).totalDuration > 7200) errors.push('La rutina no puede superar 2 horas.');
  return { valid: errors.length === 0, errors };
};

export const estimateRoutineDuration = (
  routine: Pick<
    WorkoutRoutine,
    | 'blocks'
    | 'roundsPerBlock'
    | 'jumpSeconds'
    | 'shortRestSeconds'
    | 'longRestSeconds'
    | 'warmupSeconds'
    | 'cooldownSeconds'
    | 'hasStrengthFinisher'
    | 'strengthExercises'
    | 'customPhases'
  >,
): Pick<WorkoutPlan, 'totalDuration' | 'jumpDuration' | 'restDuration' | 'strengthDuration'> => {
  const plan = buildWorkoutPlan({ ...routine, id: 'estimate' } as WorkoutRoutine, true);
  return {
    totalDuration: plan.totalDuration,
    jumpDuration: plan.jumpDuration,
    restDuration: plan.restDuration,
    strengthDuration: plan.strengthDuration,
  };
};

export const buildWorkoutPlan = (routine: WorkoutRoutine, includeStrength = true): WorkoutPlan => {
  const phases: WorkoutPhase[] = [];

  const addPhase = (
    type: RoutinePhaseType,
    durationSeconds: number,
    label: string,
    meta: Partial<WorkoutPhase> = {},
  ) => {
    if (durationSeconds <= 0) return;
    phases.push({
      id: `${routine.id}-${phases.length + 1}`,
      type,
      label,
      durationSeconds,
      message: meta.message ?? phaseMessages[type],
      block: meta.block,
      round: meta.round,
      module: meta.module,
      exerciseId: meta.exerciseId,
    });
  };

  addPhase('warmup', routine.warmupSeconds, 'Calentamiento');

  if (routine.customPhases?.length) {
    for (let block = 1; block <= routine.blocks; block += 1) {
      routine.customPhases.forEach((phase, index) => {
        addPhase(phase.type, phase.durationSeconds, phase.label, {
          block,
          round: index + 1,
          module: (block - 1) * routine.customPhases!.length + index + 1,
          message: phase.message,
        });
      });
      if (block < routine.blocks && routine.longRestSeconds > 0) {
        addPhase('long_rest', routine.longRestSeconds, 'Descanso largo', { block });
      }
    }
  } else {
    let module = 0;
    for (let block = 1; block <= routine.blocks; block += 1) {
      for (let round = 1; round <= routine.roundsPerBlock; round += 1) {
        module += 1;
        addPhase('jump', routine.jumpSeconds, 'Saltando', {
          block,
          round,
          module,
          message: round === routine.roundsPerBlock ? 'Última ronda. Prolijo y fuerte.' : 'Saltamos con rebotes cortos.',
        });

        const isLastRound = round === routine.roundsPerBlock;
        const isLastBlock = block === routine.blocks;
        if (!isLastRound && routine.shortRestSeconds > 0) {
          addPhase('short_rest', routine.shortRestSeconds, 'Descanso corto', { block, round, module });
        }
        if (isLastRound && !isLastBlock && routine.longRestSeconds > 0) {
          addPhase('long_rest', routine.longRestSeconds, 'Descanso largo', { block, round, module });
        }
      }
    }
  }

  addPhase('cooldown', routine.cooldownSeconds, 'Recuperación final');

  if (includeStrength && routine.hasStrengthFinisher) {
    routine.strengthExercises
      .filter((exercise) => exercise.enabled)
      .forEach((exercise, index, list) => {
        addPhase('strength', exercise.seconds, exercise.name, {
          exerciseId: exercise.id,
          message: `${exercise.name}. Control primero, velocidad después.`,
        });
        if (index < list.length - 1 && exercise.restSeconds > 0) {
          addPhase('recovery', exercise.restSeconds, 'Transición de fuerza', {
            exerciseId: exercise.id,
            message: 'Respirá y prepará el siguiente ejercicio.',
          });
        }
      });
  }

  return {
    routineId: routine.id,
    phases,
    totalDuration: phases.reduce((sum, phase) => sum + phase.durationSeconds, 0),
    jumpDuration: phases.filter((phase) => phase.type === 'jump').reduce((sum, phase) => sum + phase.durationSeconds, 0),
    restDuration: phases.filter((phase) => restTypes.has(phase.type)).reduce((sum, phase) => sum + phase.durationSeconds, 0),
    strengthDuration: phases.filter((phase) => phase.type === 'strength').reduce((sum, phase) => sum + phase.durationSeconds, 0),
  };
};

export const cloneRoutine = (routine: WorkoutRoutine, now = new Date()): WorkoutRoutine => {
  const cloned: WorkoutRoutine = {
    ...routine,
    id: `custom-${now.getTime()}`,
    name: `${routine.name} copia`,
    isCustom: true,
    isFavorite: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    strengthExercises: routine.strengthExercises.map((exercise) => ({ ...exercise })),
    customPhases: routine.customPhases?.map((phase) => ({ ...phase })),
  };
  const estimate = estimateRoutineDuration(cloned);
  return {
    ...cloned,
    estimatedDuration: estimate.totalDuration,
    estimatedJumpDuration: estimate.jumpDuration,
  };
};
