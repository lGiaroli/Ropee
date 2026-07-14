import { WorkoutRoutine, WorkoutSession } from '@/types/domain';

export const progressionRecommendation = (
  sessions: WorkoutSession[],
  routines: WorkoutRoutine[],
  currentRoutineId?: string,
) => {
  const recent = sessions.slice(0, 5);
  const sameRoutineCompleted = currentRoutineId
    ? recent.filter(
        (session) =>
          session.routineId === currentRoutineId && session.status === 'completed' && session.skippedPhases === 0,
      )
    : [];
  const abandoned = recent.filter((session) => session.status === 'abandoned').length;

  if (sameRoutineCompleted.length >= 3) {
    const routine = routines.find((candidate) => candidate.id === currentRoutineId);
    const nextRoutine = routines.find((candidate) => candidate.estimatedDuration > (routine?.estimatedDuration ?? 0));
    return nextRoutine
      ? `Completaste ${routine?.name ?? 'esta rutina'} tres veces con control. Probá ${nextRoutine.name}.`
      : 'Vas sólido. Sumá un bloque más solo si la técnica sigue limpia.';
  }

  if (abandoned >= 3) {
    const shorter = routines
      .slice()
      .sort((a, b) => a.estimatedDuration - b.estimatedDuration)
      .find((routine) => routine.estimatedDuration < (routines.find((r) => r.id === currentRoutineId)?.estimatedDuration ?? 99999));
    return shorter
      ? `Últimamente costó terminar. Bajá a ${shorter.name} y ganá continuidad.`
      : 'Mejor 10 minutos reales que 0 minutos perfectos.';
  }

  const sevenDayStreak = sessions.slice(0, 7).filter((session) => session.status === 'completed').length >= 5;
  if (sevenDayStreak) {
    return 'Venís muy constante. Mañana puede ser suave o descanso activo.';
  }

  return 'Hoy toca moverse. Elegí una rutina que puedas terminar con buena técnica.';
};
