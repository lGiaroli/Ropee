import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Heart,
  RotateCcw,
  Share2,
} from 'lucide-react-native';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { CelebrationBurst } from '@/components/CelebrationBurst';
import { MotionNumber } from '@/components/MotionNumber';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/useTheme';
import { progressToNextLevel } from '@/features/gamification/levels';
import { buildWorkoutPlan } from '@/features/workouts/routineBuilder';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { NavigationProps } from '@/navigation/navigation';
import { useAppStore } from '@/store/useAppStore';
import { PerceivedDifficulty } from '@/types/domain';
import { formatSeconds } from '@/utils/format';

const completeHero = require('../../assets/summary/summary-complete-hero.webp');
const xpGem = require('../../assets/icons/metrics/metric-xp.png');
const feedbackIcons = {
  veryEasy: require('../../assets/summary/feedback/feedback-very-easy.png'),
  easy: require('../../assets/summary/feedback/feedback-easy.png'),
  balanced: require('../../assets/summary/feedback/feedback-balanced.png'),
  hard: require('../../assets/summary/feedback/feedback-hard.png'),
  veryHard: require('../../assets/summary/feedback/feedback-very-hard.png'),
};
const metricIcons = {
  time: require('../../assets/icons/progress/progress-summary-time.png'),
  calories: require('../../assets/icons/progress/progress-summary-streak.png'),
  jumps: require('../../assets/icons/progress/progress-summary-jumps.png'),
  streak: require('../../assets/icons/progress/progress-summary-workouts.png'),
};

const INK = '#171C4C';
const MUTED = '#656A8C';
const PURPLE = '#7545F5';
const PURPLE_DARK = '#5D2DE6';
const BORDER = '#ECE8F7';
const GREEN = '#2DB34A';
const ORANGE = '#F36E20';
const BLUE = '#218AF0';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const feedbackOptions: {
  value: PerceivedDifficulty;
  icon: ImageSourcePropType;
  label: string;
  tint: string;
  border: string;
}[] = [
  { value: 1, icon: feedbackIcons.veryEasy, label: 'Muy fácil', tint: '#E2F8E7', border: '#31B957' },
  { value: 2, icon: feedbackIcons.easy, label: 'Fácil', tint: '#F1F8D8', border: '#93C629' },
  {
    value: 3,
    icon: feedbackIcons.balanced,
    label: 'Justo lo adecuado',
    tint: '#FFF4D5',
    border: '#ECAF25',
  },
  { value: 4, icon: feedbackIcons.hard, label: 'Difícil', tint: '#FFE8D3', border: '#EF7C25' },
  { value: 5, icon: feedbackIcons.veryHard, label: 'Muy difícil', tint: '#FFE0DF', border: '#E94C47' },
];

export const SummaryScreen = ({ navigate }: NavigationProps) => {
  const completion = useAppStore((state) => state.lastCompletion);
  const gamification = useAppStore((state) => state.gamification);
  const routine = useAppStore((state) =>
    state.routines.find((candidate) => candidate.id === state.lastCompletion?.session.routineId),
  );
  const rateWorkout = useAppStore((state) => state.rateWorkout);
  const profile = useAppStore((state) => state.profile);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [entrance] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));
  const completionId = completion?.session.id;
  const layoutWidth = Math.min(width, 430);
  const compact = layoutWidth < 375;
  const heroMaskInset = Math.round(layoutWidth * 0.625 + 41);
  const heroMaskBottom = compact ? 310 : 350;
  const heroMaskHeight = 608;
  const heroMaskTop = heroMaskBottom - heroMaskHeight;
  const heroImageScreenTop = compact ? -26 : -30;
  const heroImageTop = heroImageScreenTop - heroMaskTop;
  const heroImageWidth = Math.round((layoutWidth + 36) * (compact ? 1.16 : 1.12));
  const heroImageHeight = compact ? 284 : 322;
  const plan = useMemo(
    () => (routine ? buildWorkoutPlan(routine, routine.hasStrengthFinisher) : undefined),
    [routine],
  );

  useEffect(() => {
    entrance.stopAnimation();
    if (!completionId || reducedMotion) {
      entrance.setValue(1);
      return undefined;
    }

    entrance.setValue(0);
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 1050,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [completionId, entrance, reducedMotion]);

  if (!completion) {
    return (
      <Screen contentStyle={styles.emptyScreen}>
        <AppText variant="headline">Sin resumen pendiente</AppText>
        <AppText variant="muted" style={styles.emptyText}>
          Terminá un entrenamiento para ver tus métricas y tu progreso.
        </AppText>
        <AppButton label="Volver al inicio" onPress={() => navigate({ name: 'home' })} />
      </Screen>
    );
  }

  const { session } = completion;
  const completed = session.status === 'completed';
  const plannedTotal = Math.max(plan?.totalDuration ?? session.totalDuration, 1);
  const plannedJump = Math.max(plan?.jumpDuration ?? session.jumpDuration, 1);
  const plannedRest = Math.max(plan?.restDuration ?? session.restDuration, 1);
  const completionRatio = clamp(session.totalDuration / plannedTotal);
  const rhythmPrecision = clampPercent(
    Math.round(97 - session.skippedPhases * 5 - (1 - completionRatio) * 24),
  );
  const jumpPhases = plan?.phases.filter((phase) => phase.type === 'jump').length ?? 1;
  const restPhases =
    plan?.phases.filter((phase) =>
      ['short_rest', 'long_rest', 'recovery', 'cooldown'].includes(phase.type),
    ).length ?? 0;
  const strengthPhases = plan?.phases.filter((phase) => phase.type === 'strength').length ?? 0;
  const completedJumpPhases = Math.min(jumpPhases, Math.round(jumpPhases * clamp(session.jumpDuration / plannedJump)));
  const completedRestPhases = restPhases
    ? Math.min(restPhases, Math.round(restPhases * clamp(session.restDuration / plannedRest)))
    : 0;
  const completedStrengthPhases = session.completedStrengthFinisher ? strengthPhases : 0;
  const intensity = getIntensity(routine?.difficulty);
  const levelProgress = progressToNextLevel(gamification.xp);
  const title = completed ? '¡ENTRENAMIENTO' : 'ENTRENAMIENTO';
  const titleAccent = completed ? 'COMPLETADO!' : 'FINALIZADO';

  const heroImageOpacity = entrance.interpolate({
    inputRange: [0, 0.46, 1],
    outputRange: [0.62, 1, 1],
  });
  const heroImageScale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [1.035, 1],
  });
  const heroCopyOpacity = entrance.interpolate({
    inputRange: [0, 0.18, 0.62, 1],
    outputRange: [0, 0, 1, 1],
  });
  const heroCopyTranslate = entrance.interpolate({
    inputRange: [0, 0.18, 0.62, 1],
    outputRange: [8, 8, 0, 0],
  });
  const controlsOpacity = entrance.interpolate({
    inputRange: [0, 0.12, 0.42, 1],
    outputRange: [0, 0, 1, 1],
  });
  const metricsOpacity = reducedMotion
    ? 1
    : entrance.interpolate({
        inputRange: [0, 0.34, 0.54, 1],
        outputRange: [0, 0, 1, 1],
      });
  const metricsTranslate = reducedMotion
    ? 0
    : entrance.interpolate({
        inputRange: [0, 0.34, 0.54, 1],
        outputRange: [8, 8, 0, 0],
      });

  const triggerSelectionFeedback = () => {
    if (profile.hapticsEnabled || profile.vibrationOnly) {
      Haptics.selectionAsync().catch(() => undefined);
    }
  };

  const shareWorkout = async () => {
    const message = [
      `${title} ${titleAccent}`,
      session.routineName,
      `${formatSeconds(session.totalDuration)} · ${session.jumpsEstimated.toLocaleString('es-AR')} saltos · ${session.caloriesEstimated} kcal`,
      `${gamification.currentStreak} días de racha en Ropee`,
    ].join('\n');

    try {
      await Share.share({ message });
    } catch {
      return;
    }
  };

  return (
    <Screen contentStyle={[styles.screenContent, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.background }, compact && styles.heroCompact]}>
        <View
          pointerEvents="none"
          style={[
            styles.heroMediaMask,
            {
              left: -heroMaskInset,
              right: -heroMaskInset,
              top: heroMaskTop,
              height: heroMaskHeight,
            },
          ]}
        >
          <View
            style={[
              styles.heroImageFrame,
              {
                left: heroMaskInset - 18,
                top: heroImageTop,
                width: heroImageWidth,
                height: heroImageHeight,
              },
            ]}
          >
            <Animated.Image
              source={completeHero}
              resizeMode="cover"
              style={[
                styles.heroImage,
                { opacity: heroImageOpacity, transform: [{ scale: heroImageScale }] },
              ]}
              accessibilityIgnoresInvertColors
            />
          </View>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.76)',
              'rgba(255,255,255,0.5)',
              'rgba(255,255,255,0.16)',
              'rgba(255,255,255,0)',
            ]}
            locations={[0, 0.3, 0.68, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.heroReadability,
              {
                left: heroMaskInset - 42,
                top: heroImageTop - 8,
                width: Math.round((layoutWidth + 36) * 0.78),
              },
              styles.nonInteractive,
            ]}
          />
        </View>

        <CelebrationBurst active={completed} />

        <Animated.View pointerEvents="box-none" style={[styles.heroControls, { opacity: controlsOpacity }]}>
          <CircleButton
            accessibilityLabel="Volver al inicio"
            icon={<ArrowLeft size={21} color="#7F8BB3" strokeWidth={3} />}
            onPress={() => navigate({ name: 'home' })}
            style={styles.backButton}
          />
          <CircleButton
            accessibilityLabel="Compartir entrenamiento"
            icon={<Share2 size={20} color="#7F8BB3" strokeWidth={2.7} />}
            onPress={shareWorkout}
            style={styles.shareButton}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.heroCopy,
            compact && styles.heroCopyCompact,
            { opacity: heroCopyOpacity, transform: [{ translateY: heroCopyTranslate }] },
          ]}
        >
          <AppText
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.9}
            style={[styles.heroTitle, compact && styles.heroTitleCompact]}
          >
            {title}
          </AppText>
          <AppText
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.9}
            style={[styles.heroTitle, styles.heroTitleAccent, compact && styles.heroTitleAccentCompact]}
          >
            {titleAccent}
          </AppText>
          <AppText style={[styles.heroSubtitle, compact && styles.heroSubtitleCompact]}>
            {completed ? '¡Lo hiciste increíble!' : 'Guardamos todo lo que hiciste.'}
          </AppText>
        </Animated.View>
      </View>

      <View style={styles.pageBody}>
        <Animated.View
          style={[
            styles.metricsPanel,
            { opacity: metricsOpacity, transform: [{ translateY: metricsTranslate }] },
          ]}
        >
          <MetricStat
            icon={metricIcons.time}
            label="TIEMPO TOTAL"
            value={session.totalDuration}
            formatter={formatSeconds}
            unit="min"
            color={PURPLE}
            delay={360}
          />
          <MetricDivider />
          <MetricStat
            icon={metricIcons.calories}
            label="CALORÍAS"
            value={session.caloriesEstimated}
            formatter={formatInteger}
            unit="kcal"
            color={ORANGE}
            delay={420}
          />
          <MetricDivider />
          <MetricStat
            icon={metricIcons.jumps}
            label="SALTOS TOTALES"
            value={session.jumpsEstimated}
            formatter={formatInteger}
            unit="saltos"
            color={BLUE}
            delay={480}
          />
          <MetricDivider />
          <MetricStat
            icon={metricIcons.streak}
            label="RACHA"
            value={gamification.currentStreak}
            valueSuffix={gamification.currentStreak === 1 ? ' día' : ' días'}
            unit="¡Seguí así!"
            color={GREEN}
            delay={540}
          />
        </Animated.View>

        <MotionReveal progress={entrance} start={0.46} reducedMotion={reducedMotion}>
          <SectionCard>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Rendimiento</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigate({ name: 'stats' })}
              style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
            >
              <AppText style={styles.detailsLabel}>Ver detalles</AppText>
              <ChevronRight size={16} color={PURPLE_DARK} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={styles.performanceGrid}>
            <View style={styles.performanceBlock}>
              <AppText numberOfLines={1} adjustsFontSizeToFit style={styles.performanceLabel}>
                Precisión de ritmo
              </AppText>
              <View style={styles.performanceBody}>
                <View style={styles.performanceScore}>
                <MotionNumber
                  value={rhythmPrecision}
                  suffix="%"
                  duration={720}
                  delay={520}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={styles.performanceValue}
                />
                <AppText style={styles.performanceResult}>
                  {rhythmPrecision >= 90 ? '¡Excelente!' : rhythmPrecision >= 75 ? '¡Muy bien!' : 'Buen trabajo'}
                </AppText>
                <AppText style={styles.estimateLabel}>estimado</AppText>
                </View>
                <PerformanceRing value={rhythmPrecision} compact={compact} reducedMotion={reducedMotion} />
              </View>
            </View>

            <View style={styles.performanceBlockVertical}>
              <AppText style={styles.performanceLabel}>Intensidad promedio</AppText>
              <AppText style={styles.intensityLabel}>{intensity.label}</AppText>
              <IntensityBars activeBars={intensity.activeBars} reducedMotion={reducedMotion} />
            </View>
          </View>
          </SectionCard>
        </MotionReveal>

        <MotionReveal progress={entrance} start={0.56} reducedMotion={reducedMotion}>
          <SectionCard>
          <AppText style={styles.sectionTitle}>Resumen del entrenamiento</AppText>
          <View style={styles.breakdownList}>
            <WorkoutBreakdownRow
              color={PURPLE}
              label="Saltos"
              interval={routine ? `${routine.jumpSeconds}s` : formatSeconds(session.jumpDuration)}
              progress={session.jumpDuration / plannedJump}
              result={`${completedJumpPhases}/${jumpPhases} series`}
              delay={640}
              reducedMotion={reducedMotion}
            />
            <WorkoutBreakdownRow
              color="#C9AEF8"
              label="Descansos"
              interval={routine ? `${routine.shortRestSeconds}s` : formatSeconds(session.restDuration)}
              progress={session.restDuration / plannedRest}
              result={restPhases ? `${completedRestPhases}/${restPhases} series` : 'Sin pausas'}
              delay={700}
              reducedMotion={reducedMotion}
            />
            <WorkoutBreakdownRow
              color={GREEN}
              label="Ejercicios"
              interval={String(strengthPhases)}
              progress={strengthPhases ? completedStrengthPhases / strengthPhases : 0}
              result={
                strengthPhases
                  ? session.completedStrengthFinisher
                    ? 'Completados'
                    : `${completedStrengthPhases}/${strengthPhases}`
                  : 'Sin bloque'
              }
              delay={760}
              reducedMotion={reducedMotion}
            />
          </View>
          </SectionCard>
        </MotionReveal>

        <MotionReveal progress={entrance} start={0.66} reducedMotion={reducedMotion}>
          <LinearGradient
          colors={['#F8F1FF', '#F2ECFF', '#FBF8FF']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.xpPanel}
        >
          <RewardShine reducedMotion={reducedMotion} />
          <View style={styles.xpReward}>
            <Image source={xpGem} resizeMode="contain" style={styles.xpGem} />
            <View style={styles.xpCopy}>
              <MotionNumber
                value={completion.xpBreakdown.total}
                prefix="+ "
                suffix=" XP"
                duration={760}
                delay={700}
                style={styles.xpValue}
              />
              <AppText style={styles.xpSubtitle}>¡Buen trabajo!</AppText>
            </View>
          </View>
          <View style={styles.levelProgressBlock}>
            <AppText style={styles.levelProgressTitle}>Nivel {levelProgress.level}</AppText>
            <View
              accessibilityRole="progressbar"
              accessibilityLabel={`Progreso al nivel ${levelProgress.level + 1}`}
              accessibilityValue={{ min: 0, max: 100, now: Math.round(levelProgress.progress * 100) }}
              style={styles.levelProgressTrack}
            >
              <AnimatedBarFill
                progress={levelProgress.progress}
                colors={['#9B6CFF', PURPLE_DARK]}
                delay={820}
                reducedMotion={reducedMotion}
                pill
              />
            </View>
            <AppText numberOfLines={1} adjustsFontSizeToFit style={styles.levelProgressText}>
              {gamification.xp.toLocaleString('es-AR')} / {levelProgress.next.toLocaleString('es-AR')} XP
            </AppText>
          </View>
          </LinearGradient>
        </MotionReveal>

        <MotionReveal progress={entrance} start={0.76} reducedMotion={reducedMotion}>
          <SectionCard>
          <AppText style={styles.sectionTitle}>¿Cómo te sentiste?</AppText>
          <AppText style={styles.feedbackSubtitle}>Tu opinión nos ayuda a ajustar las próximas rutinas.</AppText>
          <View style={styles.feedbackRow}>
            {feedbackOptions.map((option) => (
              <FeedbackOption
                key={option.value}
                {...option}
                selected={session.perceivedDifficulty === option.value}
                reducedMotion={reducedMotion}
                onPress={() => {
                  rateWorkout(session.id, option.value);
                  triggerSelectionFeedback();
                }}
              />
            ))}
          </View>
          </SectionCard>
        </MotionReveal>

        <MotionReveal progress={entrance} start={0.84} reducedMotion={reducedMotion}>
          <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Repetir entrenamiento"
            onPress={() => {
              triggerSelectionFeedback();
              navigate({ name: 'timer', routineId: session.routineId });
            }}
            style={({ pressed }) => [styles.actionPressable, pressed && styles.actionPressed]}
          >
            <LinearGradient
              colors={['#8748FA', '#612BE8']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryAction}
            >
              <RotateCcw size={16} color="#FFFFFF" strokeWidth={2.4} />
              <AppText numberOfLines={1} adjustsFontSizeToFit style={styles.primaryActionLabel}>
                Repetir entrenamiento
              </AppText>
            </LinearGradient>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver mis entrenamientos"
            onPress={() => {
              triggerSelectionFeedback();
              navigate({ name: 'history' });
            }}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
          >
            <CalendarDays size={15} color="#35407B" strokeWidth={2.2} />
            <AppText numberOfLines={1} adjustsFontSizeToFit style={styles.secondaryActionLabel}>
              Ver mis entrenamientos
            </AppText>
          </Pressable>
          </View>
        </MotionReveal>
      </View>
    </Screen>
  );
};

const CircleButton = ({
  accessibilityLabel,
  icon,
  onPress,
  style,
}: {
  accessibilityLabel: string;
  icon: ReactNode;
  onPress: () => void;
  style?: object;
}) => (
  <Pressable
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    hitSlop={6}
    onPress={onPress}
    style={({ pressed }) => [styles.circleButton, style, pressed && styles.circleButtonPressed]}
  >
    {icon}
  </Pressable>
);

const MetricStat = ({
  icon,
  label,
  value,
  valueSuffix = '',
  formatter,
  unit,
  color,
  delay = 0,
}: {
  icon: ImageSourcePropType;
  label: string;
  value: number;
  valueSuffix?: string;
  formatter?: (value: number) => string;
  unit: string;
  color: string;
  delay?: number;
}) => (
  <View style={styles.metricStat}>
    <Image source={icon} resizeMode="contain" style={styles.metricIcon} accessibilityIgnoresInvertColors />
    <AppText numberOfLines={1} adjustsFontSizeToFit style={[styles.metricLabel, { color }]}>
      {label}
    </AppText>
    <MotionNumber
      value={value}
      suffix={valueSuffix}
      formatter={formatter}
      duration={760}
      delay={delay}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.72}
      style={styles.metricValue}
    />
    <AppText numberOfLines={1} adjustsFontSizeToFit style={styles.metricUnit}>
      {unit}
    </AppText>
  </View>
);

const MetricDivider = () => <View style={styles.metricDivider} />;

const SectionCard = ({ children }: { children: ReactNode }) => (
  <View style={styles.sectionCard}>{children}</View>
);

const MotionReveal = ({
  children,
  progress,
  start,
  reducedMotion,
}: {
  children: ReactNode;
  progress: Animated.Value;
  start: number;
  reducedMotion: boolean;
}) => {
  if (reducedMotion) return <View>{children}</View>;

  const end = Math.min(1, start + 0.2);
  return (
    <Animated.View
      style={{
        opacity: progress.interpolate({
          inputRange: [0, start, end],
          outputRange: [0, 0, 1],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, start, end],
              outputRange: [8, 8, 0],
              extrapolate: 'clamp',
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

const RewardShine = ({ reducedMotion }: { reducedMotion: boolean }) => {
  const [shineProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) return undefined;

    shineProgress.setValue(0);
    const animation = Animated.timing(shineProgress, {
      toValue: 1,
      duration: 780,
      delay: 900,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, shineProgress]);

  if (reducedMotion) return null;

  const translateX = shineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, 430],
  });
  const opacity = shineProgress.interpolate({
    inputRange: [0, 0.12, 0.88, 1],
    outputRange: [0, 0.7, 0.7, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.rewardShine, { opacity, transform: [{ translateX }, { skewX: '-16deg' }] }]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.58)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.rewardShineSurface}
      />
    </Animated.View>
  );
};

const PerformanceRing = ({
  value,
  compact,
  reducedMotion,
}: {
  value: number;
  compact: boolean;
  reducedMotion: boolean;
}) => {
  const size = compact ? 50 : 52;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - value / 100);
  const [drawProgress] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      drawProgress.setValue(1);
      return undefined;
    }

    drawProgress.setValue(0);
    const animation = Animated.timing(drawProgress, {
      toValue: 1,
      duration: 760,
      delay: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [drawProgress, reducedMotion, targetOffset]);

  const offset = drawProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, targetOffset],
  });

  return (
    <View style={[styles.ringWrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E9E0FA"
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={PURPLE_DARK}
          strokeWidth={strokeWidth}
          strokeDasharray={[circumference, circumference]}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Heart size={25} color={PURPLE} fill="#A17BFA" strokeWidth={1.8} />
      </View>
    </View>
  );
};

const IntensityBars = ({
  activeBars,
  reducedMotion,
}: {
  activeBars: number;
  reducedMotion: boolean;
}) => {
  const heights = [14, 20, 24, 18, 28, 22, 26, 32];
  const [riseProgress] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      riseProgress.setValue(1);
      return undefined;
    }

    riseProgress.setValue(0);
    const animation = Animated.timing(riseProgress, {
      toValue: 1,
      duration: 760,
      delay: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, riseProgress]);

  return (
    <View style={styles.intensityBars}>
      {heights.map((height, index) => {
        const start = index * 0.055;
        const end = Math.min(1, start + 0.5);
        const scaleY = riseProgress.interpolate({
          inputRange: [0, start, end],
          outputRange: [0.08, 0.08, 1],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={`${height}-${index}`}
            style={[
              styles.intensityBar,
              {
                height,
                backgroundColor: index < activeBars ? PURPLE : '#E8E1F4',
                transform: [{ scaleY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const AnimatedBarFill = ({
  progress,
  color,
  colors,
  delay,
  reducedMotion,
  pill = false,
}: {
  progress: number;
  color?: string;
  colors?: [string, string];
  delay: number;
  reducedMotion: boolean;
  pill?: boolean;
}) => {
  const target = clamp(progress);
  const [fillProgress] = useState(() => new Animated.Value(reducedMotion ? target : 0));

  useEffect(() => {
    if (reducedMotion) {
      fillProgress.setValue(target);
      return undefined;
    }

    fillProgress.setValue(0);
    const animation = Animated.timing(fillProgress, {
      toValue: target,
      duration: 720,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, fillProgress, reducedMotion, target]);

  const width = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[styles.animatedBarFill, pill && styles.animatedBarFillPill, { width }]}
    >
      {colors ? (
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.animatedBarSurface}
        />
      ) : (
        <View style={[styles.animatedBarSurface, { backgroundColor: color }]} />
      )}
    </Animated.View>
  );
};

const WorkoutBreakdownRow = ({
  color,
  label,
  interval,
  progress,
  result,
  delay,
  reducedMotion,
}: {
  color: string;
  label: string;
  interval: string;
  progress: number;
  result: string;
  delay: number;
  reducedMotion: boolean;
}) => (
  <View style={styles.breakdownRow}>
    <View style={[styles.breakdownDot, { backgroundColor: color }]} />
    <AppText style={styles.breakdownLabel}>{label}</AppText>
    <AppText style={styles.breakdownInterval}>{interval}</AppText>
    <View style={styles.breakdownTrack}>
      <AnimatedBarFill
        progress={progress}
        color={color}
        delay={delay}
        reducedMotion={reducedMotion}
      />
    </View>
    <AppText numberOfLines={1} adjustsFontSizeToFit style={[styles.breakdownResult, result === 'Completados' && styles.completedResult]}>
      {result}
    </AppText>
  </View>
);

const FeedbackOption = ({
  icon,
  label,
  tint,
  border,
  selected,
  reducedMotion,
  onPress,
}: {
  icon: ImageSourcePropType;
  label: string;
  tint: string;
  border: string;
  selected: boolean;
  reducedMotion: boolean;
  onPress: () => void;
}) => {
  const [selectionProgress] = useState(
    () => new Animated.Value(selected && !reducedMotion ? 0 : selected ? 1 : 0),
  );

  useEffect(() => {
    const target = selected ? 1 : 0;
    if (reducedMotion) {
      selectionProgress.setValue(target);
      return undefined;
    }

    const animation = selected
      ? Animated.spring(selectionProgress, {
          toValue: 1,
          speed: 22,
          bounciness: 5,
          useNativeDriver: true,
        })
      : Animated.timing(selectionProgress, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        });
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, selected, selectionProgress]);

  const glowScale = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.76, 1],
  });
  const glowOpacity = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.94],
  });
  const iconScale = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.045],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.feedbackOption, pressed && styles.feedbackPressed]}
    >
      <View style={styles.feedbackFace}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.feedbackSelectionGlow,
            {
              backgroundColor: `${border}24`,
              opacity: glowOpacity,
              shadowColor: border,
              transform: [{ scale: glowScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[`${border}00`, `${border}32`, tint, `${border}32`, `${border}00`]}
            locations={[0, 0.24, 0.5, 0.76, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.feedbackSelectionSurface}
          />
        </Animated.View>
        <Animated.Image
          source={icon}
          resizeMode="contain"
          style={[styles.feedbackIcon, { transform: [{ scale: iconScale }] }]}
          accessibilityIgnoresInvertColors
        />
      </View>
      <AppText style={[styles.feedbackLabel, selected && { color: border, fontWeight: '800' }]}>
        {label}
      </AppText>
    </Pressable>
  );
};

const getIntensity = (difficulty?: 'beginner' | 'medium' | 'advanced') => {
  if (difficulty === 'advanced') return { label: 'Avanzada', activeBars: 8 };
  if (difficulty === 'beginner') return { label: 'Principiante', activeBars: 3 };
  return { label: 'Intermedia', activeBars: 5 };
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const formatInteger = (value: number) => value.toLocaleString('es-AR');

const styles = StyleSheet.create({
  screenContent: {
    padding: 0,
    gap: 0,
    paddingBottom: 0,
  },
  emptyScreen: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    marginBottom: 10,
  },
  hero: {
    height: 292,
    overflow: 'visible',
  },
  heroCompact: {
    height: 258,
  },
  heroMediaMask: {
    position: 'absolute',
    overflow: 'hidden',
    borderBottomLeftRadius: 608,
    borderBottomRightRadius: 608,
    backgroundColor: '#9A75DC',
  },
  heroImageFrame: {
    position: 'absolute',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroReadability: {
    position: 'absolute',
    bottom: -8,
    ...({ filter: 'blur(8px)' } as any),
  },
  heroControls: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 3,
  },
  nonInteractive: {
    pointerEvents: 'none',
  },
  circleButton: {
    position: 'absolute',
    zIndex: 3,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.93)',
    shadowColor: '#37518A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  circleButtonPressed: {
    opacity: 0.72,
  },
  backButton: {
    left: 12,
  },
  shareButton: {
    right: 12,
  },
  heroCopy: {
    position: 'absolute',
    zIndex: 2,
    left: 18,
    top: 94,
    width: '48%',
  },
  heroCopyCompact: {
    left: 14,
    top: 86,
    width: '50%',
  },
  heroTitle: {
    color: INK,
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '800',
  },
  heroTitleCompact: {
    fontSize: 17,
    lineHeight: 20,
  },
  heroTitleAccent: {
    color: PURPLE_DARK,
    fontSize: 24,
    lineHeight: 27,
  },
  heroTitleAccentCompact: {
    fontSize: 22,
    lineHeight: 25,
  },
  heroSubtitle: {
    marginTop: 4,
    color: INK,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  heroSubtitleCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  pageBody: {
    position: 'relative',
    zIndex: 2,
    paddingHorizontal: 12,
    gap: 5,
  },
  metricsPanel: {
    minHeight: 86,
    marginTop: -28,
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    shadowColor: '#38256E',
    shadowOpacity: 0.1,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  metricStat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  metricIcon: {
    width: 25,
    height: 25,
    marginBottom: 1,
  },
  metricLabel: {
    width: '100%',
    textAlign: 'center',
    fontSize: 6.5,
    lineHeight: 8,
    fontWeight: '800',
  },
  metricValue: {
    width: '100%',
    marginTop: 2,
    textAlign: 'center',
    color: INK,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },
  metricUnit: {
    width: '100%',
    textAlign: 'center',
    color: MUTED,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    marginVertical: 5,
    backgroundColor: '#EEEAF5',
  },
  sectionCard: {
    gap: 4,
    padding: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    shadowColor: '#473576',
    shadowOpacity: 0.055,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    color: INK,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },
  detailsButton: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 6,
  },
  detailsLabel: {
    color: PURPLE_DARK,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.64,
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: 7,
  },
  performanceBlock: {
    minHeight: 60,
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: 3,
    padding: 7,
    borderRadius: 10,
    backgroundColor: '#FBFAFF',
  },
  performanceBlockVertical: {
    minHeight: 60,
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    padding: 7,
    borderRadius: 10,
    backgroundColor: '#FBFAFF',
  },
  performanceBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 3,
  },
  performanceScore: {
    flex: 1,
    minWidth: 0,
  },
  performanceLabel: {
    color: INK,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
  },
  performanceValue: {
    marginTop: 1,
    color: INK,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '800',
  },
  performanceResult: {
    color: INK,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
  },
  estimateLabel: {
    marginTop: 1,
    color: '#8D89A4',
    fontSize: 6,
    lineHeight: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  intensityLabel: {
    color: INK,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityBars: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 3,
  },
  intensityBar: {
    flex: 1,
    maxWidth: 8,
    minWidth: 4,
    borderRadius: 4,
  },
  breakdownList: {
    gap: 4,
    paddingTop: 0,
  },
  breakdownRow: {
    minHeight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  breakdownLabel: {
    width: 55,
    color: INK,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
  },
  breakdownInterval: {
    width: 29,
    color: INK,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
  },
  breakdownTrack: {
    height: 5,
    flex: 1,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#EEEAF5',
  },
  animatedBarFill: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: 4,
  },
  animatedBarFillPill: {
    borderRadius: 999,
  },
  animatedBarSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownResult: {
    width: 58,
    textAlign: 'right',
    color: INK,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
  },
  completedResult: {
    color: GREEN,
  },
  xpPanel: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9DFFF',
  },
  rewardShine: {
    position: 'absolute',
    top: -18,
    bottom: -18,
    left: 0,
    width: 54,
    zIndex: 0,
  },
  rewardShineSurface: {
    flex: 1,
  },
  xpReward: {
    zIndex: 1,
    width: '42%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  xpGem: {
    width: 34,
    height: 34,
  },
  xpCopy: {
    flex: 1,
    minWidth: 0,
  },
  xpValue: {
    color: PURPLE_DARK,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '800',
  },
  xpSubtitle: {
    marginTop: 0,
    color: '#514A82',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '600',
  },
  levelProgressBlock: {
    zIndex: 1,
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
    marginLeft: 9,
    paddingRight: 2,
  },
  levelProgressTitle: {
    textAlign: 'center',
    color: '#62519E',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  levelProgressTrack: {
    width: '100%',
    height: 6,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: '#DED5F5',
  },
  levelProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  levelProgressText: {
    width: '100%',
    textAlign: 'center',
    color: '#625A82',
    fontSize: 8.5,
    lineHeight: 10,
    fontWeight: '700',
  },
  feedbackSubtitle: {
    marginTop: -3,
    color: MUTED,
    fontSize: 10,
    lineHeight: 12,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 2,
    paddingTop: 1,
  },
  feedbackOption: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 3,
  },
  feedbackPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  feedbackFace: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackSelectionGlow: {
    position: 'absolute',
    left: -8,
    top: 3,
    width: 60,
    height: 38,
    borderRadius: 999,
    zIndex: 0,
    shadowOpacity: 0.54,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
    ...({ filter: 'blur(7px)' } as any),
  },
  feedbackSelectionSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
  },
  feedbackIcon: {
    width: 44,
    height: 44,
    zIndex: 2,
  },
  feedbackIconSelected: {
    transform: [{ scale: 1.04 }],
  },
  feedbackLabel: {
    minHeight: 18,
    textAlign: 'center',
    color: '#555B83',
    fontSize: 7.5,
    lineHeight: 9,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 4,
    paddingTop: 0,
    paddingBottom: 2,
  },
  actionPressable: {
    flex: 1,
    minWidth: 0,
    borderRadius: 999,
    shadowColor: PURPLE_DARK,
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  actionPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  primaryAction: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 7,
    borderRadius: 999,
  },
  primaryActionLabel: {
    minWidth: 0,
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  secondaryAction: {
    minHeight: 34,
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#CFC9E7',
    backgroundColor: '#FFFFFF',
  },
  secondaryActionPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  secondaryActionLabel: {
    minWidth: 0,
    flexShrink: 1,
    color: '#35407B',
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '700',
  },
});
