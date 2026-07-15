import { LinearGradient } from 'expo-linear-gradient';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { ChevronLeft, ChevronRight, Clock3, Flame, Music2, Pause, Play, VolumeX, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { MotionPressable } from '@/components/MotionPressable';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { WorkoutPhaseIcon } from '@/components/WorkoutPhaseIcon';
import { useTheme } from '@/components/useTheme';
import { estimateCalories, estimateJumps } from '@/features/progress/stats';
import { WorkoutTimerMetrics } from '@/features/timer/timerEngine';
import { useWorkoutTimer } from '@/features/timer/useWorkoutTimer';
import { buildWorkoutPlan } from '@/features/workouts/routineBuilder';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { NavigationProps } from '@/navigation/navigation';
import { cueForPhase, playCue, speakCountdown, speakPhase, stopSpeech } from '@/services/feedbackService';
import { useAppStore } from '@/store/useAppStore';
import { RoutinePhaseType, WorkoutPhase } from '@/types/domain';
import { formatSeconds } from '@/utils/format';

const timerTrainingArea = require('../../assets/routines/routine-hero-training-area.webp');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const JUMP_COLOR = '#16B968';
const REST_COLOR = '#7657FF';
const STRENGTH_COLOR = '#FF9A45';

export const TimerScreen = ({ route, navigate }: NavigationProps) => {
  const routine = useAppStore((state) => state.routines.find((candidate) => candidate.id === route.routineId));
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const recordWorkout = useAppStore((state) => state.recordWorkout);
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const compact = height < 780 || width < 375;
  const reducedMotion = useReducedMotion();
  const recordedRef = useRef(false);
  const autoStartedRef = useRef(false);
  const resumeAfterExitRef = useRef(false);
  const skippedRef = useRef(0);
  const startedAtRef = useRef(new Date().toISOString());
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const plan = useMemo(() => (routine ? buildWorkoutPlan(routine, routine.hasStrengthFinisher) : undefined), [routine]);

  const finishWorkout = (completed: boolean, metrics: WorkoutTimerMetrics) => {
    if (!routine || !plan || recordedRef.current) return;
    recordedRef.current = true;
    stopSpeech();
    deactivateKeepAwake().catch(() => undefined);
    recordWorkout({
      routineId: routine.id,
      plan,
      startedAt: startedAtRef.current,
      elapsedSeconds: metrics.totalSeconds,
      jumpElapsedSeconds: metrics.jumpSeconds,
      restElapsedSeconds: metrics.restSeconds,
      strengthElapsedSeconds: metrics.strengthSeconds,
      skippedPhases: skippedRef.current,
      completed,
      completedStrengthFinisher: completed && plan.strengthDuration > 0,
    });
    navigate({ name: 'summary', routineId: routine.id });
  };

  const timer = useWorkoutTimer(
    plan ?? { routineId: 'missing', phases: [], totalDuration: 0, jumpDuration: 0, restDuration: 0, strengthDuration: 0 },
    {
      onPhaseChange: (phase) => {
        playCue(cueForPhase(phase), profile).catch(() => undefined);
        speakPhase(phase, profile).catch(() => undefined);
      },
      onCountdown: (seconds) => {
        speakCountdown(seconds, profile).catch(() => undefined);
      },
      onComplete: (metrics) => {
        playCue('finish', profile).catch(() => undefined);
        finishWorkout(true, metrics);
      },
    },
  );

  useEffect(() => {
    skippedRef.current = timer.skippedPhases;
  }, [timer.skippedPhases]);

  useEffect(() => {
    if (!plan?.phases.length || autoStartedRef.current) return;
    autoStartedRef.current = true;
    startedAtRef.current = new Date().toISOString();
    activateKeepAwakeAsync().catch(() => undefined);
    timer.start();
  }, [plan?.phases.length, timer]);

  useEffect(
    () => () => {
      stopSpeech();
      deactivateKeepAwake().catch(() => undefined);
    },
    [],
  );

  const pauseTimer = timer.pause;
  const timerStatus = timer.status;
  const requestExit = useCallback(() => {
    resumeAfterExitRef.current = timerStatus === 'running';
    pauseTimer();
    setShowExitConfirm(true);
  }, [pauseTimer, timerStatus]);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestExit();
      return true;
    });
    return () => subscription.remove();
  }, [requestExit]);

  useEffect(() => {
    if (typeof window === 'undefined' || timer.status === 'completed') return undefined;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [timer.status]);

  if (!routine || !plan) {
    return (
      <Screen>
        <AppText variant="headline">Rutina no encontrada</AppText>
        <Pressable onPress={() => navigate({ name: 'routines' })} style={styles.fallbackButton}>
          <AppText weight="800" style={styles.whiteText}>Volver</AppText>
        </Pressable>
      </Screen>
    );
  }

  const currentPhase = timer.currentPhase;
  const phaseColor = colorForPhase(currentPhase?.type);
  const circleSize = Math.min(compact ? 186 : 236, width - (compact ? 144 : 120));
  const intensity = routine.difficulty === 'advanced' ? 11 : routine.difficulty === 'medium' ? 10 : 8;
  const calories = estimateCalories(timer.metrics.jumpSeconds, profile.weightKg, intensity, profile.jumpCadenceSpm);
  const jumps = estimateJumps(timer.metrics.jumpSeconds, profile.jumpCadenceSpm);
  const exerciseIndexes = plan.phases
    .map((phase, index) => (phase.type === 'jump' || phase.type === 'strength' ? index : -1))
    .filter((index) => index >= 0);
  const trackedModuleIndexes = exerciseIndexes.length ? exerciseIndexes : plan.phases.map((_, index) => index);
  const moduleCount = trackedModuleIndexes.length;
  const currentModule = trackedModuleIndexes.filter((index) => index <= timer.currentIndex).length;
  const nextExercise = timer.nextPhase;

  const togglePause = () => {
    if (timer.status === 'running') timer.pause();
    else if (timer.status === 'paused') timer.resume();
    else timer.start();
  };

  const dismissExitConfirm = () => {
    setShowExitConfirm(false);
    if (resumeAfterExitRef.current) timer.resume();
  };

  return (
    <Screen
      scroll={false}
      contentStyle={[styles.screenContent, compact && styles.screenContentCompact]}
    >
      <View pointerEvents="none" style={[styles.scenery, { height: compact ? 440 : 560 }]}>
        <Image source={timerTrainingArea} resizeMode="cover" style={styles.sceneryImage} />
        <LinearGradient
          colors={['rgba(225, 255, 246, 0.28)', 'rgba(241, 252, 247, 0.46)', colors.background]}
          locations={[0, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.topBar}>
        <RoundButton
          label="Cerrar entrenamiento"
          onPress={requestExit}
          backgroundColor="rgba(255,255,255,0.88)"
          icon={<X size={20} color="#34443D" strokeWidth={2.7} />}
        />
        <RoundButton
          label={profile.soundEnabled ? 'Silenciar indicaciones' : 'Activar indicaciones'}
          onPress={() => updateProfile({ soundEnabled: !profile.soundEnabled })}
          backgroundColor="rgba(255,255,255,0.88)"
          icon={profile.soundEnabled ? <Music2 size={19} color="#34443D" /> : <VolumeX size={19} color="#34443D" />}
        />
      </View>

      <MotionReveal triggerKey={currentPhase?.id ?? 'ready'} distance={5} duration={280}>
        <View style={[styles.phaseHeading, compact && styles.phaseHeadingCompact]}>
          <AppText style={[styles.phaseTitle, { color: phaseColor }]}>{headingForPhase(currentPhase?.type)}</AppText>
          <AppText style={styles.phaseMessage} numberOfLines={1}>{currentPhase?.message ?? 'Prepará la soga.'}</AppText>
        </View>
      </MotionReveal>

      <MotionReveal distance={5} duration={420} fromScale={0.985} style={styles.timerStage}>
          <CircularTimer
            size={circleSize}
            progress={timer.progress.phase}
            color={phaseColor}
            reducedMotion={reducedMotion}
            seconds={timer.remainingSeconds}
            compact={compact}
            paused={timer.status === 'paused'}
          />
      </MotionReveal>

      <NextExerciseCard phase={nextExercise} color={colorForPhase(nextExercise?.type)} reducedMotion={reducedMotion} compact={compact} />

      <View style={[styles.progressSection, compact && styles.progressSectionCompact]}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionLabel}>PROGRESO DE LA RUTINA</AppText>
          <AppText style={styles.sectionCount}>{Math.min(currentModule, moduleCount)} / {moduleCount}</AppText>
        </View>
        <RoutineProgress
          progress={timer.progress.total}
          nodes={compact ? 5 : 6}
          color={phaseColor}
          reducedMotion={reducedMotion}
        />
      </View>

      <View style={[styles.controls, compact && styles.controlsCompact]}>
        <ControlButton
          label="Anterior"
          disabled={!timer.canGoBack}
          onPress={timer.previousPhase}
          icon={<ChevronLeft size={22} color="#3C5E51" strokeWidth={2.8} />}
        />
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={timer.status === 'running' ? 'Pausar rutina' : 'Continuar rutina'}
          onPress={togglePause}
          pressedScale={0.93}
          style={({ pressed }) => [
            styles.mainControl,
            { backgroundColor: phaseColor, shadowColor: phaseColor, transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          {timer.status === 'running' ? <Pause size={27} color="#FFFFFF" fill="#FFFFFF" /> : <Play size={27} color="#FFFFFF" fill="#FFFFFF" />}
        </MotionPressable>
        <ControlButton
          label="Siguiente"
          onPress={timer.skipPhase}
          icon={<ChevronRight size={22} color="#3C5E51" strokeWidth={2.8} />}
        />
      </View>

      <View style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }] }>
        <MetricItem
          icon={<Clock3 size={19} color={JUMP_COLOR} strokeWidth={2.5} />}
          value={formatSeconds(timer.elapsedSeconds)}
          label="Tiempo total"
        />
        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
        <MetricItem
          icon={<Flame size={19} color="#FF7A45" strokeWidth={2.5} />}
          value={String(calories)}
          label="Calorías"
        />
        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
        <MetricItem
          icon={<WorkoutPhaseIcon phaseType="jump" size={20} color="#5C79FF" strokeWidth={2.4} />}
          value={jumps.toLocaleString('es-AR')}
          label="Saltos totales"
        />
      </View>

      <Modal transparent visible={showExitConfirm} animationType="fade" onRequestClose={dismissExitConfirm}>
        <Pressable style={styles.modalBackdrop} onPress={dismissExitConfirm}>
          {showExitConfirm ? (
          <MotionReveal distance={8} duration={260} fromScale={0.97}>
            <Pressable style={[styles.exitCard, { backgroundColor: colors.surface }]} onPress={() => undefined}>
            <View style={[styles.exitIcon, { backgroundColor: 'rgba(255,91,110,0.12)' }]}>
              <X size={24} color={colors.danger} strokeWidth={2.8} />
            </View>
            <AppText variant="title" style={styles.centerText}>¿Terminar entrenamiento?</AppText>
            <AppText variant="muted" style={styles.centerText}>
              Se guardarán únicamente los segundos que hiciste de verdad.
            </AppText>
            <Pressable
              onPress={() => {
                dismissExitConfirm();
              }}
              style={[styles.modalPrimary, { backgroundColor: phaseColor }]}
            >
              <AppText weight="800" style={styles.whiteText}>Seguir entrenando</AppText>
            </Pressable>
            <Pressable onPress={() => finishWorkout(false, timer.metrics)} style={styles.modalExit}>
              <AppText weight="800" style={{ color: colors.danger }}>Terminar ahora</AppText>
            </Pressable>
            </Pressable>
          </MotionReveal>
          ) : null}
        </Pressable>
      </Modal>
    </Screen>
  );
};

const CircularTimer = ({
  size,
  progress,
  color,
  seconds,
  compact,
  paused,
  reducedMotion,
}: {
  size: number;
  progress: number;
  color: string;
  seconds: number;
  compact: boolean;
  paused: boolean;
  reducedMotion: boolean;
}) => {
  const strokeWidth = compact ? 8 : 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedProgress] = useState(() => new Animated.Value(progress));

  useEffect(() => {
    if (reducedMotion) {
      animatedProgress.setValue(progress);
      return;
    }
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: progress === 0 ? 180 : 920,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, progress, reducedMotion]);

  const dashOffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={withAlpha(color, 0.2)}
          strokeWidth={strokeWidth}
          fill="rgba(255,255,255,0.52)"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset as unknown as number}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.timerCenter}>
        <AppText
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.secondsValue, compact && styles.secondsValueCompact, { color }]}
        >
          {seconds}
        </AppText>
        <AppText style={[styles.secondsLabel, { color }]}>{paused ? 'EN PAUSA' : 'SEGUNDOS'}</AppText>
      </View>
    </View>
  );
};

const NextExerciseCard = ({
  phase,
  color,
  reducedMotion,
  compact,
}: {
  phase?: WorkoutPhase;
  color: string;
  reducedMotion: boolean;
  compact: boolean;
}) => {
  const [entrance] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reducedMotion) {
      entrance.setValue(1);
      return;
    }
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance, phase?.id, reducedMotion]);

  return (
    <Animated.View
      style={[
        styles.nextCard,
        compact && styles.nextCardCompact,
        {
          opacity: entrance,
          transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [7, 0] }) }],
        },
      ]}
    >
      <View style={[styles.nextIcon, { backgroundColor: withAlpha(color, 0.12) }]}>
        <WorkoutPhaseIcon phaseType={phase?.type} size={compact ? 25 : 29} color={color} strokeWidth={2.2} />
      </View>
      <View style={styles.nextCopy}>
        <AppText style={styles.nextEyebrow}>PRÓXIMO EJERCICIO</AppText>
        <AppText weight="800" style={styles.nextTitle} numberOfLines={1}>{displayPhaseName(phase)}</AppText>
        <AppText variant="muted" style={styles.nextDuration}>{phase ? `${phase.durationSeconds} segundos` : 'Cierre de rutina'}</AppText>
      </View>
      <ChevronRight size={20} color="#AAA5BA" strokeWidth={2.4} />
    </Animated.View>
  );
};

const RoutineProgress = ({
  progress,
  nodes,
  color,
  reducedMotion,
}: {
  progress: number;
  nodes: number;
  color: string;
  reducedMotion: boolean;
}) => {
  const safeProgress = Math.min(1, Math.max(0, progress));
  const [animatedProgress] = useState(() => new Animated.Value(safeProgress));

  useEffect(() => {
    if (reducedMotion) {
      animatedProgress.setValue(safeProgress);
      return;
    }
    Animated.timing(animatedProgress, {
      toValue: safeProgress,
      duration: safeProgress === 0 ? 180 : 920,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, reducedMotion, safeProgress]);

  const fillWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressTrack}>
      <View style={styles.progressRail}>
        <View style={styles.progressRailBase} />
        <Animated.View style={[styles.progressRailFill, { backgroundColor: color, width: fillWidth }]} />
      </View>
      <View style={styles.progressNodes}>
        {Array.from({ length: nodes }).map((_, index) => {
          const threshold = nodes <= 1 ? 0 : index / (nodes - 1);
          const reached = safeProgress >= threshold;
          return <View key={index} style={[styles.progressNode, { backgroundColor: reached ? color : '#DDE1E5' }]} />;
        })}
      </View>
    </View>
  );
};

const RoundButton = ({
  icon,
  label,
  onPress,
  backgroundColor,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  backgroundColor: string;
}) => (
  <MotionPressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    pressedScale={0.92}
    style={({ pressed }) => [styles.roundButton, { backgroundColor, opacity: pressed ? 0.72 : 1 }]}
  >
    {icon}
  </MotionPressable>
);

const ControlButton = ({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <View style={[styles.controlWrap, disabled && styles.disabled]}>
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      pressedScale={0.92}
      style={({ pressed }) => [styles.secondaryControl, pressed && styles.pressedControl]}
    >
      {icon}
    </MotionPressable>
    <AppText style={styles.controlLabel}>{label}</AppText>
  </View>
);

const MetricItem = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <View style={styles.metricItem}>
    {icon}
    <AppText weight="800" style={styles.metricValue} numberOfLines={1}>{value}</AppText>
    <AppText style={styles.metricLabel} numberOfLines={1}>{label}</AppText>
  </View>
);

const colorForPhase = (type?: RoutinePhaseType) => {
  if (type === 'jump') return JUMP_COLOR;
  if (type === 'strength') return STRENGTH_COLOR;
  return REST_COLOR;
};

const headingForPhase = (type?: RoutinePhaseType) => {
  if (type === 'jump') return '¡A SALTAR!';
  if (type === 'strength') return 'FUERZA Y CONTROL';
  if (type === 'warmup') return 'PREPARÁ EL CUERPO';
  return 'DESCANSO CON ROPI';
};

const displayPhaseName = (phase?: WorkoutPhase) => {
  if (!phase) return 'Resumen final';
  if (phase.type === 'jump' && phase.label === 'Saltando') return 'Salto básico';
  if (phase.type === 'short_rest') return 'Descanso corto';
  if (phase.type === 'long_rest') return 'Descanso largo con Ropi';
  return phase.label;
};

const withAlpha = (hex: string, opacity: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 255).toString(16).padStart(2, '0');
  return `#${normalized}${alpha}`;
};

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    position: 'relative',
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
    overflow: 'hidden',
  },
  screenContentCompact: {
    paddingTop: 5,
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 5,
  },
  scenery: {
    position: 'absolute',
    top: -8,
    left: -14,
    right: -14,
    overflow: 'hidden',
  },
  sceneryImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.44,
  },
  topBar: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B5946',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  phaseHeading: {
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseHeadingCompact: {
    height: 39,
  },
  phaseTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
  },
  phaseMessage: {
    color: '#527266',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  timerStage: {
    flex: 1,
    minHeight: 186,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCenter: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondsValue: {
    width: '76%',
    textAlign: 'center',
    fontSize: 72,
    lineHeight: 75,
    fontWeight: '800',
  },
  secondsValueCompact: {
    fontSize: 58,
    lineHeight: 61,
  },
  secondsLabel: {
    marginTop: -3,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  nextCard: {
    minHeight: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(57,77,69,0.08)',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#39554A',
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  nextCardCompact: {
    minHeight: 61,
    paddingVertical: 6,
  },
  nextIcon: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCopy: {
    flex: 1,
    minWidth: 0,
  },
  nextEyebrow: {
    color: '#8A8599',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  nextTitle: {
    fontSize: 14,
    lineHeight: 17,
  },
  nextDuration: {
    fontSize: 10,
    lineHeight: 13,
  },
  progressSection: {
    minHeight: 52,
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 1,
  },
  progressSectionCompact: {
    minHeight: 44,
    gap: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#3E8062',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  sectionCount: {
    color: '#3E8062',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 14,
    justifyContent: 'center',
  },
  progressRail: {
    position: 'absolute',
    left: 5,
    right: 5,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressRailBase: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#DDE1E5',
  },
  progressRailFill: {
    height: 3,
    borderRadius: 2,
  },
  progressNodes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 14,
  },
  progressNode: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  controls: {
    minHeight: 72,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlsCompact: {
    minHeight: 64,
  },
  controlWrap: {
    width: 66,
    alignItems: 'center',
    gap: 3,
  },
  secondaryControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(52,88,73,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D5142',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  mainControl: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  pressedControl: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },
  controlLabel: {
    color: '#687970',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.36,
  },
  metricsCard: {
    minHeight: 74,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#4B3B86',
    shadowOpacity: 0.07,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    minWidth: 0,
  },
  metricDivider: {
    width: 1,
    height: 42,
  },
  metricValue: {
    maxWidth: '92%',
    fontSize: 14,
    lineHeight: 17,
    textAlign: 'center',
  },
  metricLabel: {
    color: '#777287',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,20,26,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  exitCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  exitIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimary: {
    width: '100%',
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalExit: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: REST_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  centerText: {
    textAlign: 'center',
  },
});
