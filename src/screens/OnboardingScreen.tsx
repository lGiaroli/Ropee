import {
  Activity,
  BellRing,
  CalendarDays,
  Check,
  ChevronLeft,
  Dumbbell,
  Flame,
  Gauge,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  UserRound,
  Vibrate,
  Volume2,
  Weight,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Mascot, type MascotMood } from '@/components/Mascot';
import { MotionPressable } from '@/components/MotionPressable';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { scheduleDailyReminder } from '@/services/notificationService';
import { defaultProfile } from '@/store/defaultState';
import { useAppStore } from '@/store/useAppStore';
import { Goal, UserProfile } from '@/types/domain';
import { radius, spacing } from '@/theme/tokens';

const levels = [
  {
    value: 'beginner',
    label: 'Principiante',
    body: 'Recién empiezo',
    icon: Sparkles,
    color: '#39C982',
    tint: '#ECFBF4',
  },
  {
    value: 'intermediate',
    label: 'Intermedio',
    body: 'Ya tengo algo de experiencia',
    icon: Gauge,
    color: '#F2A43A',
    tint: '#FFF7E7',
  },
  {
    value: 'advanced',
    label: 'Avanzado',
    body: 'Entreno seguido',
    icon: Trophy,
    color: '#7458F5',
    tint: '#F2EEFF',
  },
] as const;

const goals: {
  value: Goal;
  label: string;
  body: string;
  icon: LucideIcon;
  color: string;
  tint: string;
}[] = [
  {
    value: 'habit',
    label: 'Crear constancia',
    body: 'Moverme un poco cada semana',
    icon: CalendarDays,
    color: '#4E63EB',
    tint: '#EEF0FF',
  },
  {
    value: 'fat_loss',
    label: 'Bajar de peso',
    body: 'Quemar calorías y tonificar',
    icon: Flame,
    color: '#FF8C42',
    tint: '#FFF1E8',
  },
  {
    value: 'endurance',
    label: 'Ganar resistencia',
    body: 'Aguantar más y rendir mejor',
    icon: Activity,
    color: '#2AC589',
    tint: '#EAFBF5',
  },
  {
    value: 'cardio',
    label: 'Mejorar mi cardio',
    body: 'Entrenar corazón y respiración',
    icon: HeartPulse,
    color: '#F15F82',
    tint: '#FFF0F4',
  },
  {
    value: 'gym_companion',
    label: 'Complementar el gimnasio',
    body: 'Sumar cuerda a mis entrenamientos',
    icon: Dumbbell,
    color: '#8A5AE8',
    tint: '#F4EEFF',
  },
];

const times = [
  { value: 5, label: '5 min', body: 'Para empezar suave' },
  { value: 10, label: '10 min', body: 'Un hábito fácil de sostener' },
  { value: 20, label: '20 min', body: 'Una sesión completa' },
  { value: 30, label: '30 min', body: 'Para avanzar en serio' },
  { value: 45, label: '45+ min', body: 'Me gustan los desafíos' },
];

const days = [2, 3, 4, 5, 6];
const questionCount = 5;
const welcomeBackground = require('../../assets/onboarding/welcome-ropee.webp');

const stepCopy = [
  {
    eyebrow: 'EMPECEMOS POR VOS',
    title: '¿Cómo te llamás?',
    body: 'Así Ropi puede acompañarte en cada entrenamiento.',
    mood: 'wave' as MascotMood,
  },
  {
    eyebrow: 'TU META',
    title: '¿Qué querés lograr?',
    body: 'Vamos a adaptar las rutinas a lo que más te importa.',
    mood: 'ready' as MascotMood,
  },
  {
    eyebrow: 'TU PUNTO DE PARTIDA',
    title: '¿Cuál es tu nivel?',
    body: 'No hay respuestas incorrectas. Empezamos desde donde estés.',
    mood: 'focus' as MascotMood,
  },
  {
    eyebrow: 'TU RITMO REAL',
    title: '¿Cuánto tiempo tenés?',
    body: 'Elegí una duración y los días que podrías sostener normalmente.',
    mood: 'train' as MascotMood,
  },
  {
    eyebrow: 'ÚLTIMO PASO',
    title: '¿Cómo te acompañamos?',
    body: 'Podés cambiar cualquiera de estas opciones desde tu perfil.',
    mood: 'celebrate' as MascotMood,
  },
];

export const OnboardingScreen = () => {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const compactHeight = height < 720;

  const canContinue = useMemo(() => {
    if (step === 0) return profile.name.trim().length > 0;
    return true;
  }, [profile.name, step]);

  const finish = async () => {
    const completedProfile = { ...profile, name: profile.name.trim() || 'Atleta' };
    completeOnboarding(completedProfile);
    await scheduleDailyReminder(completedProfile.reminderTime, completedProfile.remindersEnabled);
  };

  const next = () => {
    if (step === questionCount - 1) {
      void finish();
      return;
    }
    setStep((current) => current + 1);
  };

  if (!started) {
    return (
      <Screen scroll={false} contentStyle={styles.screen}>
        <View style={styles.welcome}>
          <Image
            source={welcomeBackground}
            resizeMode="cover"
            style={styles.welcomeImage}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(27,18,82,0.62)', 'rgba(35,24,96,0.26)', 'rgba(35,24,96,0)']}
            locations={[0, 0.56, 1]}
            style={styles.welcomeTopScrim}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(30,17,75,0)', 'rgba(30,17,75,0.1)', 'rgba(24,13,63,0.62)']}
            locations={[0, 0.52, 1]}
            style={styles.welcomeBottomScrim}
          />
          <MotionReveal distance={10} duration={480} style={styles.welcomeCopy}>
            <View style={styles.welcomeEyebrowPill}>
              <Sparkles size={13} color="#FFE47D" strokeWidth={2.6} />
              <AppText style={styles.welcomeEyebrow}>TU COMPAÑERO DE AVENTURAS</AppText>
            </View>
            <View style={styles.welcomeTitleGroup}>
              <AppText style={styles.welcomeHello}>¡Hola!</AppText>
              <View style={styles.welcomeNameRow}>
                <AppText style={styles.welcomeTitle}>Soy </AppText>
                <AppText style={styles.welcomeTitleName}>Ropi</AppText>
              </View>
            </View>
            <AppText style={styles.welcomeBody}>
              Estoy acá para acompañarte: un salto, una misión y un día a la vez.
            </AppText>
            <View style={styles.welcomePromiseRow}>
              <View style={[styles.welcomePromiseChip, styles.welcomePromiseChipMint]}>
                <Timer size={14} color="#176A50" strokeWidth={2.4} />
                <AppText style={[styles.welcomePromiseText, styles.welcomePromiseTextMint]}>
                  A tu ritmo
                </AppText>
              </View>
              <View style={[styles.welcomePromiseChip, styles.welcomePromiseChipPeach]}>
                <HeartPulse size={14} color="#8A4822" strokeWidth={2.4} />
                <AppText style={[styles.welcomePromiseText, styles.welcomePromiseTextPeach]}>
                  Sin presión
                </AppText>
              </View>
            </View>
          </MotionReveal>

          <View pointerEvents="none" style={styles.welcomeSceneSpacer} />

          <View style={styles.welcomeFooter}>
            <AppButton
              label="Comenzar"
              onPress={() => setStarted(true)}
              variant="secondary"
              style={styles.welcomeButton}
            />
            <AppText style={styles.welcomeHint}>Solo te llevará un minuto</AppText>
          </View>
        </View>
      </Screen>
    );
  }

  const copy = stepCopy[step] ?? stepCopy[0]!;

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.wizard, { backgroundColor: colors.background }]}
      >
        <View style={styles.wizardHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={step === 0 ? 'Volver a la bienvenida' : 'Pregunta anterior'}
            hitSlop={10}
            onPress={() => (step === 0 ? setStarted(false) : setStep((current) => current - 1))}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.surface },
              pressed && styles.pressed,
            ]}
          >
            <ChevronLeft size={22} color={colors.primaryDark} strokeWidth={2.6} />
          </Pressable>

          <View style={styles.progressTrack}>
            {Array.from({ length: questionCount }).map((_, index) => (
              <View key={index} style={[styles.progressSegment, { backgroundColor: colors.surfaceStrong }]}>
                {index <= step ? (
                  <View style={[styles.progressSegmentFill, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
            ))}
          </View>

          <AppText weight="800" style={[styles.stepCount, { color: colors.primaryDark }]}>
            {step + 1} / {questionCount}
          </AppText>
        </View>

        <ScrollView
          style={styles.wizardScrollView}
          contentContainerStyle={[styles.wizardScroll, compactHeight && styles.wizardScrollCompact]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MotionReveal
            triggerKey={`mascot-${step}`}
            distance={7}
            duration={360}
            fromScale={0.97}
            style={[styles.questionHero, compactHeight && styles.questionHeroCompact]}
          >
            <View style={[styles.mascotHalo, { backgroundColor: colors.surfaceStrong }]} />
            <Mascot size={compactHeight ? 116 : 140} mood={copy.mood} animated={false} />
          </MotionReveal>

          <MotionReveal triggerKey={`copy-${step}`} distance={5} duration={340} style={styles.questionCopy}>
            <AppText variant="label" style={{ color: colors.primaryDark }}>
              {copy.eyebrow}
            </AppText>
            <AppText style={styles.questionTitle}>{copy.title}</AppText>
            <AppText variant="muted" style={styles.questionBody}>
              {copy.body}
            </AppText>
          </MotionReveal>

          <MotionReveal
            triggerKey={`content-${step}`}
            delay={55}
            distance={6}
            duration={360}
            style={styles.stepContent}
          >
            {step === 0 ? (
              <NameStep profile={profile} setProfile={setProfile} />
            ) : null}

            {step === 1 ? (
              <View style={styles.optionList}>
                {goals.map((goal) => (
                  <SelectionCard
                    key={goal.value}
                    {...goal}
                    selected={profile.goal === goal.value}
                    onPress={() => setProfile((current) => ({ ...current, goal: goal.value }))}
                  />
                ))}
              </View>
            ) : null}

            {step === 2 ? (
              <View style={styles.optionList}>
                {levels.map((level) => (
                  <SelectionCard
                    key={level.value}
                    {...level}
                    selected={profile.level === level.value}
                    onPress={() => setProfile((current) => ({ ...current, level: level.value }))}
                  />
                ))}
              </View>
            ) : null}

            {step === 3 ? (
              <ScheduleStep profile={profile} setProfile={setProfile} />
            ) : null}

            {step === 4 ? (
              <CompanionStep profile={profile} setProfile={setProfile} />
            ) : null}
          </MotionReveal>
        </ScrollView>

        <View style={[styles.wizardFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <AppButton
            label={step === questionCount - 1 ? 'Listo, vamos' : 'Continuar'}
            disabled={!canContinue}
            onPress={next}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const NameStep = ({
  profile,
  setProfile,
}: {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}) => {
  const { colors } = useTheme();
  return (
    <View style={styles.formStack}>
      <View>
        <View style={styles.optionalLabelRow}>
          <AppText weight="700" style={styles.inputLabel}>
            Tu nombre
          </AppText>
          <AppText weight="700" style={[styles.requiredLabel, { color: colors.primaryDark }]}>
            * Requerido
          </AppText>
        </View>
        <View style={[styles.inputShell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <UserRound size={19} color={colors.primary} />
          <TextInput
            accessibilityLabel="Tu nombre"
            autoCapitalize="words"
            autoFocus={Platform.OS !== 'web'}
            value={profile.name}
            onChangeText={(name) => setProfile((current) => ({ ...current, name }))}
            placeholder="Nombre"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            style={[styles.input, { color: colors.text }]}
          />
          <AnimatedCheckBadge visible={Boolean(profile.name.trim())} />
        </View>
      </View>

      <View>
        <View style={styles.optionalLabelRow}>
          <AppText weight="700" style={styles.inputLabel}>
            Tu peso
          </AppText>
          <AppText variant="muted">Opcional</AppText>
        </View>
        <View style={[styles.inputShell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Weight size={19} color={colors.primary} />
          <TextInput
            accessibilityLabel="Peso opcional en kilogramos"
            keyboardType="numeric"
            value={profile.weightKg ? String(profile.weightKg) : ''}
            onChangeText={(value) => {
              const parsed = Number(value.replace(',', '.'));
              setProfile((current) => ({
                ...current,
                weightKg: value && Number.isFinite(parsed) ? parsed : undefined,
              }));
            }}
            placeholder="Para estimar mejor tus calorías"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
          />
          <AppText weight="700" style={{ color: colors.textMuted }}>
            kg
          </AppText>
        </View>
        <AppText variant="muted" style={styles.fieldHint}>
          Esta información queda guardada solo en tu perfil.
        </AppText>
      </View>
    </View>
  );
};

const AnimatedCheckBadge = ({ visible }: { visible: boolean }) => {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));

  useEffect(() => {
    progress.stopAnimation();
    if (reducedMotion) {
      progress.setValue(visible ? 1 : 0);
      return undefined;
    }

    const animation = visible
      ? Animated.spring(progress, {
          toValue: 1,
          damping: 12,
          stiffness: 260,
          mass: 0.55,
          useNativeDriver: true,
        })
      : Animated.timing(progress, {
          toValue: 0,
          duration: 130,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion, visible]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.inputCheck,
        {
          backgroundColor: '#E8FBF3',
          opacity: progress,
          transform: [{ scale }],
        },
      ]}
    >
      <Check size={14} color="#28B879" strokeWidth={3} />
    </Animated.View>
  );
};

const ScheduleStep = ({
  profile,
  setProfile,
}: {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}) => (
  <View style={styles.scheduleStack}>
    <View>
      <AppText weight="800" style={styles.sectionLabel}>
        Tiempo por entrenamiento
      </AppText>
      <View style={styles.optionList}>
        {times.map((time) => (
          <SelectionCard
            key={time.value}
            label={time.label}
            body={time.body}
            icon={Timer}
            color="#5B74F6"
            tint="#EEF1FF"
            selected={profile.availableTime === time.value}
            onPress={() => setProfile((current) => ({ ...current, availableTime: time.value }))}
          />
        ))}
      </View>
    </View>

    <View>
      <AppText weight="800" style={styles.sectionLabel}>
        Días por semana
      </AppText>
      <View style={styles.dayGrid}>
        {days.map((day) => (
          <ChoiceChip
            key={day}
            label={String(day)}
            caption={day === 1 ? 'día' : 'días'}
            selected={profile.weeklyGoal === day}
            onPress={() => setProfile((current) => ({ ...current, weeklyGoal: day }))}
          />
        ))}
      </View>
    </View>
  </View>
);

const CompanionStep = ({
  profile,
  setProfile,
}: {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}) => (
  <View style={styles.optionList}>
    <ToggleCard
      icon={BellRing}
      label="Recordarme entrenar"
      body="Un aviso suave a las 19:00"
      color="#7657FF"
      tint="#F2EEFF"
      value={profile.remindersEnabled}
      onChange={(remindersEnabled) => setProfile((current) => ({ ...current, remindersEnabled }))}
    />
    <ToggleCard
      icon={Volume2}
      label="Indicaciones por voz"
      body="Ropi avisa cada cambio de fase"
      color="#3B9DEB"
      tint="#EAF6FF"
      value={profile.voiceEnabled}
      onChange={(voiceEnabled) => setProfile((current) => ({ ...current, voiceEnabled }))}
    />
    <ToggleCard
      icon={Zap}
      label="Sonidos de entrenamiento"
      body="Señales para salto, descanso y cierre"
      color="#F0A333"
      tint="#FFF7E5"
      value={profile.soundEnabled}
      onChange={(soundEnabled) => setProfile((current) => ({ ...current, soundEnabled }))}
    />
    <ToggleCard
      icon={Vibrate}
      label="Vibración"
      body="Útil si entrenás sin mirar la pantalla"
      color="#2DBE83"
      tint="#EAFBF4"
      value={profile.hapticsEnabled}
      onChange={(hapticsEnabled) => setProfile((current) => ({ ...current, hapticsEnabled }))}
    />
    <View style={styles.privacyNote}>
      <ShieldCheck size={17} color="#2BAE79" />
      <AppText variant="muted" style={styles.privacyCopy}>
        Sin spam. Solo usamos estos avisos para tu rutina.
      </AppText>
    </View>
  </View>
);

interface SelectionCardProps {
  label: string;
  body: string;
  icon: LucideIcon;
  color: string;
  tint: string;
  selected: boolean;
  onPress: () => void;
}

const useSelectionMotion = (selected: boolean) => {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(selected ? 1 : 0));
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    progress.stopAnimation();
    scale.stopAnimation();
    if (reducedMotion) {
      progress.setValue(selected ? 1 : 0);
      scale.setValue(1);
      return undefined;
    }

    const stateChange = Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: selected ? 190 : 130,
      easing: selected ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    const selectionBounce = selected
      ? Animated.sequence([
          Animated.spring(scale, {
            toValue: 1.025,
            damping: 14,
            stiffness: 260,
            mass: 0.5,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            damping: 13,
            stiffness: 250,
            mass: 0.5,
            useNativeDriver: true,
          }),
        ])
      : Animated.timing(scale, {
          toValue: 1,
          duration: 130,
          useNativeDriver: true,
        });
    const animation = Animated.parallel([stateChange, selectionBounce]);
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion, scale, selected]);

  return {
    progress,
    scale,
    indicatorScale: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 1],
    }),
    iconScale: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.96, 1.04],
    }),
  };
};

const SelectionCard = ({
  label,
  body,
  icon: Icon,
  color,
  tint,
  selected,
  onPress,
}: SelectionCardProps) => {
  const { colors } = useTheme();
  const motion = useSelectionMotion(selected);
  return (
    <Animated.View style={[styles.animatedOptionContainer, { transform: [{ scale: motion.scale }] }]}>
      <MotionPressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        onPress={onPress}
        pressedScale={0.985}
        style={[
          styles.selectionCard,
          {
            backgroundColor: selected ? tint : colors.surface,
            borderColor: selected ? color : colors.border,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.optionIcon,
            { backgroundColor: tint, transform: [{ scale: motion.iconScale }] },
          ]}
        >
          <Icon size={21} color={color} strokeWidth={2.5} />
        </Animated.View>
        <View style={styles.optionCopy}>
          <AppText weight="800" style={styles.optionTitle}>
            {label}
          </AppText>
          <AppText variant="muted" numberOfLines={1}>
            {body}
          </AppText>
        </View>
        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? color : colors.border,
              backgroundColor: selected ? color : colors.surface,
            },
          ]}
        >
          <Animated.View
            style={{
              opacity: motion.progress,
              transform: [{ scale: motion.indicatorScale }],
            }}
          >
            <Check size={13} color="#FFFFFF" strokeWidth={3.2} />
          </Animated.View>
        </View>
      </MotionPressable>
    </Animated.View>
  );
};

const ChoiceChip = ({
  label,
  caption,
  selected,
  onPress,
}: {
  label: string;
  caption: string;
  selected: boolean;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  const motion = useSelectionMotion(selected);
  return (
    <Animated.View
      style={[styles.dayChipContainer, { transform: [{ scale: motion.scale }] }]}
    >
      <MotionPressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        onPress={onPress}
        pressedScale={0.95}
        containerStyle={styles.dayChipFill}
        style={[
          styles.dayChip,
          {
            backgroundColor: selected ? colors.primary : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
      >
        <AppText weight="800" style={[styles.dayNumber, selected && styles.selectedText]}>
          {label}
        </AppText>
        <AppText variant="muted" style={selected ? styles.selectedCaption : undefined}>
          {caption}
        </AppText>
      </MotionPressable>
    </Animated.View>
  );
};

const ToggleCard = ({
  icon: Icon,
  label,
  body,
  color,
  tint,
  value,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  body: string;
  color: string;
  tint: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  const { colors } = useTheme();
  const motion = useSelectionMotion(value);
  const thumbTranslate = motion.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });
  return (
    <Animated.View style={[styles.animatedOptionContainer, { transform: [{ scale: motion.scale }] }]}
    >
      <MotionPressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        onPress={() => onChange(!value)}
        pressedScale={0.985}
        style={[styles.toggleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Animated.View
          style={[
            styles.optionIcon,
            { backgroundColor: tint, transform: [{ scale: motion.iconScale }] },
          ]}
        >
          <Icon size={21} color={color} strokeWidth={2.4} />
        </Animated.View>
        <View style={styles.optionCopy}>
          <AppText weight="800" style={styles.optionTitle}>
            {label}
          </AppText>
          <AppText variant="muted" numberOfLines={1}>
            {body}
          </AppText>
        </View>
        <View
          style={[
            styles.toggleTrack,
            { backgroundColor: value ? colors.primary : colors.surfaceStrong },
          ]}
        >
          <Animated.View
            style={[styles.toggleThumb, { transform: [{ translateX: thumbTranslate }] }]}
          />
        </View>
      </MotionPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 0,
    paddingBottom: 0,
    gap: 0,
  },
  wizard: {
    flex: 1,
  },
  welcome: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  welcomeImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#6553D8',
  },
  welcomeTopScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
  },
  welcomeBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
  },
  welcomeCopy: {
    zIndex: 2,
    marginTop: spacing.xxl,
    maxWidth: 315,
  },
  welcomeEyebrowPill: {
    alignSelf: 'flex-start',
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45,30,116,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  welcomeEyebrow: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
  },
  welcomeTitleGroup: {
    marginTop: 10,
  },
  welcomeHello: {
    color: '#FFE47D',
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '800',
  },
  welcomeNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 41,
    fontWeight: '800',
  },
  welcomeTitleName: {
    color: '#BDF7E2',
    fontSize: 38,
    lineHeight: 41,
    fontWeight: '800',
  },
  welcomeBody: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.94)',
    fontSize: 14,
    lineHeight: 19,
    maxWidth: 285,
  },
  welcomePromiseRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  welcomePromiseChip: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  welcomePromiseChipMint: {
    backgroundColor: 'rgba(189,247,226,0.9)',
    borderColor: 'rgba(255,255,255,0.55)',
  },
  welcomePromiseChipPeach: {
    backgroundColor: 'rgba(255,220,182,0.92)',
    borderColor: 'rgba(255,255,255,0.55)',
  },
  welcomePromiseText: {
    fontSize: 11,
    fontWeight: '800',
  },
  welcomePromiseTextMint: {
    color: '#176A50',
  },
  welcomePromiseTextPeach: {
    color: '#8A4822',
  },
  welcomeSceneSpacer: {
    flex: 1,
    minHeight: 200,
  },
  welcomeFooter: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
    zIndex: 2,
  },
  welcomeButton: {
    width: '100%',
  },
  welcomeHint: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
  },
  wizardHeader: {
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  progressTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressSegmentFill: {
    width: '100%',
    height: '100%',
    borderRadius: radius.pill,
  },
  stepCount: {
    width: 38,
    fontSize: 11,
    textAlign: 'right',
  },
  wizardScroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  wizardScrollView: {
    flex: 1,
    minHeight: 0,
  },
  wizardScrollCompact: {
    paddingHorizontal: spacing.lg,
  },
  questionHero: {
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  questionHeroCompact: {
    height: 118,
  },
  mascotHalo: {
    position: 'absolute',
    width: 132,
    height: 92,
    borderRadius: 66,
    bottom: 22,
    opacity: 0.85,
  },
  questionCopy: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  questionTitle: {
    marginTop: 4,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    textAlign: 'center',
  },
  questionBody: {
    marginTop: 5,
    textAlign: 'center',
    maxWidth: 330,
  },
  stepContent: {
    marginTop: spacing.xl,
  },
  formStack: {
    gap: spacing.xl,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 7,
  },
  optionalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requiredLabel: {
    fontSize: 12,
    marginBottom: 7,
  },
  inputShell: {
    minHeight: 54,
    borderWidth: 1.25,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 52,
    fontSize: 15,
    fontWeight: '600',
    outlineStyle: 'none',
  } as any,
  inputCheck: {
    width: 25,
    height: 25,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldHint: {
    marginTop: 7,
    paddingHorizontal: 2,
  },
  optionList: {
    gap: spacing.sm,
  },
  animatedOptionContainer: {
    width: '100%',
  },
  selectionCard: {
    minHeight: 64,
    borderWidth: 1.25,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  radio: {
    width: 23,
    height: 23,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleStack: {
    gap: spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  dayGrid: {
    flexDirection: 'row',
    gap: 7,
  },
  dayChipContainer: {
    flex: 1,
  },
  dayChipFill: {
    width: '100%',
  },
  dayChip: {
    height: 62,
    borderWidth: 1.25,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 18,
    lineHeight: 21,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  selectedCaption: {
    color: 'rgba(255,255,255,0.8)',
  },
  toggleCard: {
    minHeight: 66,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: radius.pill,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    shadowColor: '#32265E',
    shadowOpacity: 0.16,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  privacyNote: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  privacyCopy: {
    flexShrink: 1,
  },
  wizardFooter: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
});
