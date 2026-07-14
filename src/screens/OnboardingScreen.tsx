import { Activity, Bell, Dumbbell, Gauge, Target, User } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, TextInput, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Mascot, type MascotMood } from '@/components/Mascot';
import { MotionPressable } from '@/components/MotionPressable';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { ToggleRow } from '@/components/ToggleRow';
import { useTheme } from '@/components/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { scheduleDailyReminder } from '@/services/notificationService';
import { defaultProfile } from '@/store/defaultState';
import { useAppStore } from '@/store/useAppStore';
import { Goal, UserProfile } from '@/types/domain';
import { radius, spacing } from '@/theme/tokens';

const levels = [
  { value: 'beginner', label: 'Principiante', body: 'Estoy armando base.' },
  { value: 'intermediate', label: 'Intermedio', body: 'Ya puedo sostener bloques.' },
  { value: 'advanced', label: 'Avanzado', body: 'Busco volumen y control.' },
] as const;

const goals: { value: Goal; label: string }[] = [
  { value: 'habit', label: 'Crear hábito' },
  { value: 'endurance', label: 'Ganar resistencia' },
  { value: 'fat_loss', label: 'Bajar grasa' },
  { value: 'cardio', label: 'Mejorar cardio' },
  { value: 'gym_companion', label: 'Complementar gimnasio' },
];

const times = [5, 10, 20, 30, 45];
const days = [2, 3, 4, 5, 6];
const onboardingMascotLoop: MascotMood[] = ['wave', 'ready'];

export const OnboardingScreen = () => {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const { colors } = useTheme();
  const totalSteps = 5;

  const canContinue = useMemo(() => profile.name.trim().length > 0, [profile.name]);

  const finish = async () => {
    completeOnboarding({ ...profile, name: profile.name.trim() || 'Atleta' });
    await scheduleDailyReminder(profile.reminderTime, profile.remindersEnabled);
  };

  return (
    <Screen>
      <MotionReveal distance={6} duration={380}>
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Dumbbell size={28} color="#FFFFFF" />
          </View>
          <View style={styles.headerCopy}>
            <AppText variant="headline">RopeQuest</AppText>
            <AppText variant="muted">Soga, hábito y progreso sin vueltas.</AppText>
          </View>
          <Mascot size={92} sequence={onboardingMascotLoop} />
        </View>
      </MotionReveal>

      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <OnboardingStepDot
            key={index}
            active={index <= step}
            color={colors.primary}
            inactiveColor={colors.surfaceStrong}
          />
        ))}
      </View>

      <MotionReveal triggerKey={step} distance={7} duration={340} fromScale={0.992}>
        {step === 0 ? (
        <Card animated={false}>
          <User size={24} color={colors.primaryDark} />
          <AppText variant="title">Primero, lo básico</AppText>
          <TextInput
            accessibilityLabel="Nombre"
            value={profile.name}
            onChangeText={(name) => setProfile((current) => ({ ...current, name }))}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceStrong },
            ]}
          />
          <TextInput
            accessibilityLabel="Peso opcional"
            keyboardType="numeric"
            value={profile.weightKg ? String(profile.weightKg) : ''}
            onChangeText={(value) =>
              setProfile((current) => ({ ...current, weightKg: value ? Number(value) : undefined }))
            }
            placeholder="Peso opcional para estimar calorías"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceStrong },
            ]}
          />
        </Card>
      ) : null}

      {step === 1 ? (
        <Card animated={false}>
          <Gauge size={24} color={colors.primaryDark} />
          <AppText variant="title">Nivel actual</AppText>
          {levels.map((level) => (
            <Choice
              key={level.value}
              label={level.label}
              body={level.body}
              selected={profile.level === level.value}
              onPress={() => setProfile((current) => ({ ...current, level: level.value }))}
            />
          ))}
        </Card>
      ) : null}

      {step === 2 ? (
        <Card animated={false}>
          <Target size={24} color={colors.primaryDark} />
          <AppText variant="title">Objetivo principal</AppText>
          <View style={styles.wrap}>
            {goals.map((goal) => (
              <Choice
                key={goal.value}
                compact
                label={goal.label}
                selected={profile.goal === goal.value}
                onPress={() => setProfile((current) => ({ ...current, goal: goal.value }))}
              />
            ))}
          </View>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card animated={false}>
          <Activity size={24} color={colors.primaryDark} />
          <AppText variant="title">Tiempo y frecuencia</AppText>
          <AppText variant="muted">Elegí algo que puedas repetir en una semana normal.</AppText>
          <AppText weight="700">Tiempo disponible</AppText>
          <View style={styles.wrap}>
            {times.map((time) => (
              <Choice
                key={time}
                compact
                label={time >= 45 ? '45+ min' : `${time} min`}
                selected={profile.availableTime === time}
                onPress={() => setProfile((current) => ({ ...current, availableTime: time }))}
              />
            ))}
          </View>
          <AppText weight="700">Días por semana</AppText>
          <View style={styles.wrap}>
            {days.map((day) => (
              <Choice
                key={day}
                compact
                label={`${day} días`}
                selected={profile.weeklyGoal === day}
                onPress={() => setProfile((current) => ({ ...current, weeklyGoal: day }))}
              />
            ))}
          </View>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card animated={false}>
          <Bell size={24} color={colors.primaryDark} />
          <AppText variant="title">Guía durante el entrenamiento</AppText>
          <ToggleRow
            label="Voz"
            description="Avisos cortos al cambiar de fase."
            value={profile.voiceEnabled}
            onValueChange={(voiceEnabled) => setProfile((current) => ({ ...current, voiceEnabled }))}
          />
          <ToggleRow
            label="Sonidos"
            description="Cues para salto, descanso y cierre."
            value={profile.soundEnabled}
            onValueChange={(soundEnabled) => setProfile((current) => ({ ...current, soundEnabled }))}
          />
          <ToggleRow
            label="Vibración"
            description="Útil si entrenás con el teléfono cerca."
            value={profile.hapticsEnabled}
            onValueChange={(hapticsEnabled) => setProfile((current) => ({ ...current, hapticsEnabled }))}
          />
          <ToggleRow
            label="Recordatorio diario"
            description="Suave, sin spam."
            value={profile.remindersEnabled}
            onValueChange={(remindersEnabled) => setProfile((current) => ({ ...current, remindersEnabled }))}
          />
        </Card>
      ) : null}
      </MotionReveal>

      <MotionReveal triggerKey={step} delay={80} distance={5} duration={320}>
        <View style={styles.actions}>
          {step > 0 ? <AppButton label="Atrás" variant="secondary" onPress={() => setStep((value) => value - 1)} /> : null}
          <AppButton
            label={step === totalSteps - 1 ? 'Empezar' : 'Siguiente'}
            disabled={!canContinue}
            onPress={step === totalSteps - 1 ? finish : () => setStep((value) => value + 1)}
            style={styles.primaryAction}
          />
        </View>
      </MotionReveal>
    </Screen>
  );
};

interface ChoiceProps {
  label: string;
  body?: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}

const Choice = ({ label, body, selected, onPress, compact }: ChoiceProps) => {
  const { colors } = useTheme();
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      pressedScale={0.975}
      style={[
        compact ? styles.choiceCompact : styles.choice,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.surfaceStrong : colors.surface,
        },
      ]}
    >
      <AppText weight="800">{label}</AppText>
      {body ? <AppText variant="muted">{body}</AppText> : null}
    </MotionPressable>
  );
};

const OnboardingStepDot = ({
  active,
  color,
  inactiveColor,
}: {
  active: boolean;
  color: string;
  inactiveColor: string;
}) => {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(active ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(active ? 1 : 0);
      return undefined;
    }
    const animation = Animated.spring(progress, {
      toValue: active ? 1 : 0,
      damping: 16,
      stiffness: 240,
      mass: 0.55,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [active, progress, reducedMotion]);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, color],
  });
  const scaleY = progress.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1] });

  return <Animated.View style={[styles.stepDot, { backgroundColor, opacity, transform: [{ scaleY }] }]} />;
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepDot: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  choice: {
    minHeight: 70,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  choiceCompact: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  primaryAction: {
    flex: 1,
  },
});
