import { ArrowLeft, Save, Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { StepperRow } from '@/components/StepperRow';
import { ToggleRow } from '@/components/ToggleRow';
import { useTheme } from '@/components/useTheme';
import { defaultStrengthExercises } from '@/data/strength';
import { estimateRoutineDuration } from '@/features/workouts/routineBuilder';
import { NavigationProps } from '@/navigation/navigation';
import { useAppStore } from '@/store/useAppStore';
import { WorkoutRoutine } from '@/types/domain';
import { radius, spacing } from '@/theme/tokens';
import { formatMinutes } from '@/utils/format';

export const RoutineEditorScreen = ({ route, navigate }: NavigationProps) => {
  const existing = useAppStore((state) => state.routines.find((routine) => routine.id === route.routineId));
  const saveRoutine = useAppStore((state) => state.saveRoutine);
  const { colors } = useTheme();
  const [errors, setErrors] = useState<string[]>([]);
  const [routine, setRoutine] = useState<WorkoutRoutine>(() => {
    if (existing && !route.editingNew) return { ...existing, strengthExercises: existing.strengthExercises.map((item) => ({ ...item })) };
    const now = new Date().toISOString();
    return {
      id: `custom-${Date.now()}`,
      name: 'Mi rutina',
      description: 'Rutina personalizada de soga.',
      difficulty: 'beginner',
      blocks: 1,
      roundsPerBlock: 6,
      jumpSeconds: 20,
      shortRestSeconds: 10,
      longRestSeconds: 60,
      warmupSeconds: 45,
      cooldownSeconds: 45,
      hasStrengthFinisher: false,
      strengthExercises: defaultStrengthExercises.map((exercise) => ({ ...exercise })),
      estimatedDuration: 0,
      estimatedJumpDuration: 0,
      isFavorite: false,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };
  });

  const estimate = useMemo(() => estimateRoutineDuration(routine), [routine]);

  const update = (patch: Partial<WorkoutRoutine>) => setRoutine((current) => ({ ...current, ...patch }));

  const save = () => {
    const result = saveRoutine({ ...routine, isCustom: true });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    navigate({ name: 'routines' });
  };

  return (
    <Screen>
      <MotionReveal distance={5} duration={360} style={styles.header}>
        <IconButton label="Volver" onPress={() => navigate({ name: 'routines' })} icon={<ArrowLeft size={22} color={colors.text} />} />
        <View style={styles.flex}>
          <AppText variant="headline">{route.editingNew ? 'Crear rutina' : 'Editar rutina'}</AppText>
          <AppText variant="muted">{formatMinutes(estimate.totalDuration)} · {formatMinutes(estimate.jumpDuration)} saltando</AppText>
        </View>
      </MotionReveal>

      <Card motionDelay={70}>
        <AppText variant="title">Identidad</AppText>
        <TextInput
          accessibilityLabel="Nombre de rutina"
          value={routine.name}
          onChangeText={(name) => update({ name })}
          placeholder="Nombre"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}
        />
        <TextInput
          accessibilityLabel="Descripción de rutina"
          value={routine.description}
          onChangeText={(description) => update({ description })}
          placeholder="Descripción"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[styles.input, styles.textarea, { color: colors.text, backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}
        />
        <ToggleRow
          label="Favorita"
          value={routine.isFavorite}
          onValueChange={(isFavorite) => update({ isFavorite })}
          icon={<Star size={20} color={colors.accent} />}
        />
      </Card>

      <Card motionDelay={130}>
        <AppText variant="title">Estructura</AppText>
        <StepperRow label="Bloques" value={routine.blocks} min={1} max={20} onChange={(blocks) => update({ blocks })} />
        <StepperRow label="Rondas por bloque" value={routine.roundsPerBlock} min={1} max={80} onChange={(roundsPerBlock) => update({ roundsPerBlock })} />
        <StepperRow label="Salto" value={routine.jumpSeconds} suffix="seg" step={5} min={5} max={600} onChange={(jumpSeconds) => update({ jumpSeconds })} />
        <StepperRow label="Descanso corto" value={routine.shortRestSeconds} suffix="seg" step={5} min={0} max={300} onChange={(shortRestSeconds) => update({ shortRestSeconds })} />
        <StepperRow label="Descanso largo" value={routine.longRestSeconds} suffix="seg" step={15} min={0} max={600} onChange={(longRestSeconds) => update({ longRestSeconds })} />
        <StepperRow label="Calentamiento" value={routine.warmupSeconds} suffix="seg" step={15} min={0} max={900} onChange={(warmupSeconds) => update({ warmupSeconds })} />
        <StepperRow label="Recuperación final" value={routine.cooldownSeconds} suffix="seg" step={15} min={0} max={900} onChange={(cooldownSeconds) => update({ cooldownSeconds })} />
      </Card>

      <Card motionDelay={190}>
        <AppText variant="title">Finisher de fuerza</AppText>
        <ToggleRow
          label="Ofrecer finisher"
          description="Sentadillas, flexiones, plancha y variantes."
          value={routine.hasStrengthFinisher}
          onValueChange={(hasStrengthFinisher) => update({ hasStrengthFinisher })}
        />
        {routine.strengthExercises.map((exercise) => (
          <ToggleRow
            key={exercise.id}
            label={exercise.name}
            description={`${exercise.seconds}s + ${exercise.restSeconds}s transición`}
            value={exercise.enabled}
            onValueChange={(enabled) =>
              update({
                strengthExercises: routine.strengthExercises.map((item) =>
                  item.id === exercise.id ? { ...item, enabled } : item,
                ),
              })
            }
          />
        ))}
      </Card>

      {errors.length ? (
        <Card motionDelay={40}>
          <AppText variant="title">Revisá la rutina</AppText>
          {errors.map((error) => (
            <AppText key={error} variant="muted" style={{ color: colors.danger }}>
              {error}
            </AppText>
          ))}
        </Card>
      ) : null}

      <MotionReveal delay={250} distance={5}>
        <AppButton label="Guardar rutina" icon={<Save size={20} color="#FFFFFF" />} onPress={save} />
      </MotionReveal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  textarea: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
});
