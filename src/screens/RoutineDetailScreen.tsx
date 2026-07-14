import { ArrowLeft, Edit3, Play } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/useTheme';
import { buildWorkoutPlan } from '@/features/workouts/routineBuilder';
import { NavigationProps } from '@/navigation/navigation';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/tokens';
import { formatMinutes, formatSeconds } from '@/utils/format';

export const RoutineDetailScreen = ({ route, navigate }: NavigationProps) => {
  const routine = useAppStore((state) => state.routines.find((candidate) => candidate.id === route.routineId));
  const { colors } = useTheme();

  if (!routine) {
    return (
      <Screen>
        <AppText variant="headline">Rutina no encontrada</AppText>
        <AppButton label="Volver" onPress={() => navigate({ name: 'routines' })} />
      </Screen>
    );
  }

  const plan = buildWorkoutPlan(routine, routine.hasStrengthFinisher);

  return (
    <Screen>
      <MotionReveal distance={5} duration={360} style={styles.header}>
        <IconButton label="Volver" onPress={() => navigate({ name: 'routines' })} icon={<ArrowLeft size={22} color={colors.text} />} />
        <View style={styles.flex}>
          <AppText variant="headline">{routine.name}</AppText>
          <AppText variant="muted">{routine.description}</AppText>
        </View>
      </MotionReveal>

      <Card motionDelay={80}>
        <View style={styles.metaGrid}>
          <Metric label="Duración" value={formatMinutes(plan.totalDuration)} />
          <Metric label="Saltando" value={formatMinutes(plan.jumpDuration)} />
          <Metric label="Fases" value={String(plan.phases.length)} />
          <Metric label="Dificultad" value={routine.difficulty} />
        </View>
        <AppButton
          label="Iniciar entrenamiento"
          icon={<Play size={20} color="#FFFFFF" />}
          onPress={() => navigate({ name: 'timer', routineId: routine.id })}
        />
        <AppButton
          label="Editar rutina"
          variant="secondary"
          icon={<Edit3 size={18} color={colors.text} />}
          onPress={() => navigate({ name: 'routineEditor', routineId: routine.id })}
        />
      </Card>

      <Card motionDelay={150}>
        <AppText variant="title">Fases</AppText>
        {plan.phases.slice(0, 18).map((phase, index) => (
          <MotionReveal key={phase.id} delay={190 + Math.min(index, 8) * 30} distance={4}>
            <View style={styles.phaseRow}>
              <View style={[styles.phaseDot, { backgroundColor: phase.type === 'jump' ? colors.jump : phase.type === 'strength' ? colors.strength : colors.rest }]} />
              <View style={styles.flex}>
                <AppText weight="700">{phase.label}</AppText>
                <AppText variant="muted">{phase.message}</AppText>
              </View>
              <AppText weight="800">{formatSeconds(phase.durationSeconds)}</AppText>
            </View>
          </MotionReveal>
        ))}
        {plan.phases.length > 18 ? <AppText variant="muted">+ {plan.phases.length - 18} fases más en esta rutina.</AppText> : null}
      </Card>

      <Card motionDelay={240}>
        <AppText variant="title">Seguridad rápida</AppText>
        <AppText variant="muted">Calentá antes de empezar. Usá zapatillas adecuadas. Frená si sentís dolor fuerte, mareo o falta de aire fuera de lo normal.</AppText>
      </Card>
    </Screen>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metric}>
    <AppText variant="label">{label}</AppText>
    <AppText weight="800">{value}</AppText>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    width: '46%',
    minHeight: 54,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 58,
  },
  phaseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
