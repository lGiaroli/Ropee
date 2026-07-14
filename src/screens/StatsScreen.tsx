import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Info } from 'lucide-react-native';
import { Animated, Easing, Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { MotionHeight } from '@/components/MotionHeight';
import { MotionReveal } from '@/components/MotionReveal';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/useTheme';
import { progressToNextLevel } from '@/features/gamification/levels';
import { currentWeekJumpReport, weeklySummary } from '@/features/progress/stats';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { NavigationProps } from '@/navigation/navigation';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/tokens';
import type { WorkoutSession } from '@/types/domain';

const ropiProgress = require('../../assets/mascot/progress/ropi-progress-card.png');
const levelBadge = require('../../assets/icons/progress/level-badge.png');
const summaryIcons = {
  streak: require('../../assets/icons/progress/progress-summary-streak.png'),
  time: require('../../assets/icons/progress/progress-summary-time.png'),
  jumps: require('../../assets/icons/progress/progress-summary-jumps.png'),
  workouts: require('../../assets/icons/progress/progress-summary-workouts.png'),
};

const streakDayLetters = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const AnimatedPath = Animated.createAnimatedComponent(Path);

type WeekJumpDay = ReturnType<typeof currentWeekJumpReport>[number];
type DailyStreakState = 'completed' | 'today' | 'rest' | 'incomplete';
type ReportRange = 'week' | 'month' | 'lastMonth' | 'year';

const reportRangeOptions: { id: ReportRange; label: string }[] = [
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: 'lastMonth', label: 'Mes pasado' },
  { id: 'year', label: 'Todo el año' },
];

interface DailyStreakDay {
  date: string;
  letter: string;
  number: number;
  state: DailyStreakState;
}

interface WeeklyReportDay {
  date: string;
  calories: number;
  jumps: number;
  minutes: number;
}

interface ReportSummary {
  averageJumps: number;
  calories: number;
  days: WeeklyReportDay[];
  label: string;
  targetMinutes: number;
  title: string;
  totalMinutes: number;
}

interface WeekComparisonMetric {
  color: string;
  icon: ImageSourcePropType;
  label: string;
  value: string;
}

interface PersonalBestMetric {
  caption: string;
  icon: ImageSourcePropType;
  label: string;
  value: string;
}

const chunkIntoPairs = <T,>(items: T[]) =>
  Array.from({ length: Math.ceil(items.length / 2) }, (_, index) => items.slice(index * 2, index * 2 + 2));

const localDayKey = (date: Date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const buildDailyStreakDays = (
  weekDays: WeekJumpDay[],
  sessions: WorkoutSession[],
  weeklyGoal: number,
  now: Date,
): DailyStreakDay[] => {
  const completedDates = new Set(
    sessions
      .filter((session) => session.status === 'completed')
      .map((session) => localDayKey(new Date(session.completedAt))),
  );
  const todayKey = localDayKey(now);
  const hasAnyCompletedWorkout = completedDates.size > 0;
  const normalizedWeeklyGoal = Math.min(7, Math.max(1, Math.round(weeklyGoal)));
  const restAllowance = 7 - normalizedWeeklyGoal;
  let missedPastDays = 0;

  return weekDays.map((day, index) => {
    const completed = completedDates.has(day.date);
    const isPast = day.date < todayKey;
    let state: DailyStreakState;

    if (completed) {
      state = 'completed';
    } else if (day.isToday) {
      state = 'today';
    } else if (isPast) {
      missedPastDays += 1;
      state = !hasAnyCompletedWorkout || missedPastDays <= restAllowance ? 'rest' : 'incomplete';
    } else {
      state = 'incomplete';
    }

    return {
      date: day.date,
      letter: streakDayLetters[index] ?? (day.label ?? '').slice(0, 1),
      number: Number(day.date.slice(8)),
      state,
    };
  });
};

const startOfLocalDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfLocalDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const startOfLocalWeek = (date: Date) => {
  const start = startOfLocalDay(date);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return start;
};

const getReportRangeConfig = (range: ReportRange, now: Date) => {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (range === 'month') {
    const start = new Date(currentYear, currentMonth, 1);
    return {
      start,
      end: endOfLocalDay(new Date(currentYear, currentMonth + 1, 0)),
      label: 'Este mes',
      title: 'Resumen mensual',
    };
  }

  if (range === 'lastMonth') {
    const start = new Date(currentYear, currentMonth - 1, 1);
    return {
      start,
      end: endOfLocalDay(new Date(currentYear, currentMonth, 0)),
      label: 'Mes pasado',
      title: 'Mes pasado',
    };
  }

  if (range === 'year') {
    return {
      start: new Date(currentYear, 0, 1),
      end: endOfLocalDay(new Date(currentYear, 11, 31)),
      label: 'Todo el año',
      title: 'Resumen anual',
    };
  }

  const start = startOfLocalWeek(now);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start,
    end: endOfLocalDay(end),
    label: 'Esta semana',
    title: 'Resumen semanal',
  };
};

const buildReportSummary = (
  sessions: WorkoutSession[],
  profile: { availableTime: number; weeklyGoal: number },
  range: ReportRange,
  now: Date,
): ReportSummary => {
  const config = getReportRangeConfig(range, now);
  const dayCount = Math.max(1, Math.floor((startOfLocalDay(config.end).getTime() - startOfLocalDay(config.start).getTime()) / MS_PER_DAY) + 1);
  const buckets = Array.from({ length: 7 }).map((_, index) => ({
    date: `${config.label}-${index}`,
    calories: 0,
    jumps: 0,
    jumpDuration: 0,
  }));

  sessions.forEach((session) => {
    const completedAt = new Date(session.completedAt);
    if (completedAt < config.start || completedAt > config.end) return;

    const daysFromStart = Math.max(0, Math.floor((startOfLocalDay(completedAt).getTime() - startOfLocalDay(config.start).getTime()) / MS_PER_DAY));
    const bucketIndex = Math.min(6, Math.floor((daysFromStart / dayCount) * 7));
    const bucket = buckets[bucketIndex];
    if (!bucket) return;

    bucket.calories += session.caloriesEstimated;
    bucket.jumps += session.jumpsEstimated;
    bucket.jumpDuration += session.jumpDuration;
  });

  const totalJumpDuration = buckets.reduce((sum, bucket) => sum + bucket.jumpDuration, 0);
  const totalJumps = buckets.reduce((sum, bucket) => sum + bucket.jumps, 0);
  const totalCalories = buckets.reduce((sum, bucket) => sum + bucket.calories, 0);
  const targetWeeks = range === 'week' ? 1 : Math.max(1, Math.ceil(dayCount / 7));

  return {
    averageJumps: Math.round(totalJumps / dayCount),
    calories: totalCalories,
    days: buckets.map((bucket) => ({
      date: bucket.date,
      calories: bucket.calories,
      jumps: bucket.jumps,
      minutes: Math.round(bucket.jumpDuration / 60),
    })),
    label: config.label,
    targetMinutes: Math.max(profile.weeklyGoal * profile.availableTime * targetWeeks, 1),
    title: config.title,
    totalMinutes: Math.round(totalJumpDuration / 60),
  };
};

const sessionsBetween = (sessions: WorkoutSession[], start: Date, end: Date) =>
  sessions.filter((session) => {
    const completedAt = new Date(session.completedAt);
    return completedAt >= start && completedAt <= end;
  });

const summarizeRange = (sessions: WorkoutSession[]) => {
  const completedDates = new Set<string>();
  return sessions.reduce(
    (summary, session) => {
      if (session.status === 'completed') completedDates.add(localDayKey(new Date(session.completedAt)));
      return {
        calories: summary.calories + session.caloriesEstimated,
        jumpDuration: summary.jumpDuration + session.jumpDuration,
        jumps: summary.jumps + session.jumpsEstimated,
        workoutDays: completedDates.size,
      };
    },
    { calories: 0, jumpDuration: 0, jumps: 0, workoutDays: 0 },
  );
};

const formatDelta = (value: number, suffix = '') => {
  const rounded = Math.round(value);
  if (rounded === 0) return `0${suffix}`;
  const sign = rounded > 0 ? '+' : '-';
  return `${sign}${Math.abs(rounded).toLocaleString('es-AR')}${suffix}`;
};

const buildWeekComparison = (sessions: WorkoutSession[], now: Date): WeekComparisonMetric[] => {
  const currentStart = startOfLocalWeek(now);
  const currentEnd = endOfLocalDay(new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() + 6));
  const previousStart = new Date(currentStart);
  previousStart.setDate(currentStart.getDate() - 7);
  const previousEnd = endOfLocalDay(new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() - 1));
  const current = summarizeRange(sessionsBetween(sessions, currentStart, currentEnd));
  const previous = summarizeRange(sessionsBetween(sessions, previousStart, previousEnd));

  return [
    {
      color: '#31C27C',
      icon: summaryIcons.time,
      label: 'saltando',
      value: formatDelta(current.jumpDuration / 60 - previous.jumpDuration / 60, ' min'),
    },
    {
      color: '#6F5BFF',
      icon: summaryIcons.jumps,
      label: 'saltos totales',
      value: formatDelta(current.jumps - previous.jumps),
    },
    {
      color: '#FF8A3D',
      icon: summaryIcons.streak,
      label: 'kcal quemadas',
      value: formatDelta(current.calories - previous.calories, ' kcal'),
    },
    {
      color: '#8D5CF4',
      icon: summaryIcons.workouts,
      label: 'dias de constancia',
      value: formatDelta(current.workoutDays - previous.workoutDays),
    },
  ];
};

const bestDailyJumps = (sessions: WorkoutSession[]) => {
  const byDate = new Map<string, number>();
  sessions.forEach((session) => {
    const date = localDayKey(new Date(session.completedAt));
    byDate.set(date, (byDate.get(date) ?? 0) + session.jumpsEstimated);
  });
  return Math.max(0, ...Array.from(byDate.values()));
};

const bestWeeklyMinutes = (sessions: WorkoutSession[]) => {
  const byWeek = new Map<string, number>();
  sessions.forEach((session) => {
    const weekKey = localDayKey(startOfLocalWeek(new Date(session.completedAt)));
    byWeek.set(weekKey, (byWeek.get(weekKey) ?? 0) + session.jumpDuration);
  });
  return Math.round(Math.max(0, ...Array.from(byWeek.values())) / 60);
};

const buildPersonalBests = (sessions: WorkoutSession[], bestStreak: number): PersonalBestMetric[] => {
  const longestSessionMinutes = Math.round(Math.max(0, ...sessions.map((session) => session.jumpDuration)) / 60);
  return [
    {
      caption: 'Sesion mas larga',
      icon: summaryIcons.time,
      label: 'Resistencia',
      value: `${longestSessionMinutes} min`,
    },
    {
      caption: 'Mas saltos en un dia',
      icon: summaryIcons.jumps,
      label: 'Potencia',
      value: bestDailyJumps(sessions).toLocaleString('es-AR'),
    },
    {
      caption: 'Mejor racha',
      icon: summaryIcons.streak,
      label: 'Constancia',
      value: `${bestStreak} dias`,
    },
    {
      caption: 'Semana mas activa',
      icon: summaryIcons.workouts,
      label: 'Volumen',
      value: `${bestWeeklyMinutes(sessions)} min`,
    },
  ];
};

const formatReportNumber = (value: number) => Math.round(value).toLocaleString('es-AR');

const formatDurationShort = (seconds: number) => {
  const minutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours <= 0) return `${minutes} min`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
};

export const StatsScreen = ({ navigate }: NavigationProps) => {
  const sessions = useAppStore((state) => state.sessions);
  const gamification = useAppStore((state) => state.gamification);
  const profile = useAppStore((state) => state.profile);
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [heroMotion] = useState(() => new Animated.Value(0));
  const [dailyStreakInfoVisible, setDailyStreakInfoVisible] = useState(false);
  const [reportRange, setReportRange] = useState<ReportRange>('week');
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const ignoreNextGlobalTouch = useRef(false);
  const now = new Date();
  const week = weeklySummary(sessions, now);
  const weekDays = currentWeekJumpReport(sessions, now);
  const level = progressToNextLevel(gamification.xp);
  const minutesToNextLevel = level.remaining > 0 ? Math.ceil(level.remaining / 5) : 0;
  const dailyStreakDays = buildDailyStreakDays(weekDays, sessions, profile.weeklyGoal, now);
  const weeklyRestDays = Math.max(0, 7 - Math.min(7, Math.max(1, Math.round(profile.weeklyGoal))));
  const reportSummary = buildReportSummary(sessions, profile, reportRange, now);
  const weekComparison = buildWeekComparison(sessions, now);
  const personalBests = buildPersonalBests(sessions, gamification.bestStreak);

  useEffect(() => {
    if (reducedMotion) {
      heroMotion.setValue(1);
      return undefined;
    }

    heroMotion.setValue(0);
    const animation = Animated.timing(heroMotion, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [heroMotion, reducedMotion]);

  const gradientOpacity = heroMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.58],
  });

  const closeDailyStreakInfo = useCallback(() => {
    setDailyStreakInfoVisible(false);
  }, []);

  const closeReportDropdown = useCallback(() => {
    setReportDropdownOpen(false);
  }, []);

  const handleInfoButtonTouch = useCallback(() => {
    ignoreNextGlobalTouch.current = true;
  }, []);

  const toggleDailyStreakInfo = useCallback(() => {
    setDailyStreakInfoVisible((current) => !current);
  }, []);

  const toggleReportDropdown = useCallback(() => {
    setReportDropdownOpen((current) => !current);
  }, []);

  const selectReportRange = useCallback((range: ReportRange) => {
    setReportRange(range);
    setReportDropdownOpen(false);
  }, []);

  const handleScreenTouch = useCallback(() => {
    if (!dailyStreakInfoVisible && !reportDropdownOpen) return;
    if (ignoreNextGlobalTouch.current) {
      ignoreNextGlobalTouch.current = false;
      return;
    }
    closeDailyStreakInfo();
    closeReportDropdown();
  }, [closeDailyStreakInfo, closeReportDropdown, dailyStreakInfoVisible, reportDropdownOpen]);

  return (
    <Screen
      contentStyle={styles.screen}
      onScrollBeginDrag={() => {
        closeDailyStreakInfo();
        closeReportDropdown();
      }}
      onTouchStart={handleScreenTouch}
    >
      <MotionReveal distance={6} duration={460} fromScale={0.995} style={[styles.heroCard, { shadowColor: colors.primaryDark }]}>
        <View pointerEvents="none" style={styles.heroGradientBase} />
        <Animated.View pointerEvents="none" style={[styles.heroGradientShift, { opacity: gradientOpacity }]} />

          <View style={styles.heroLayout}>
          <View style={styles.ropiColumn}>
            <View pointerEvents="none" style={styles.ropiFloorShadow} />
            <View pointerEvents="none" style={styles.ropiContactShadow} />
            <Image source={ropiProgress} resizeMode="contain" style={styles.ropiImage} />
          </View>
          <View style={styles.levelColumn}>
            <AppText style={styles.levelLabel}>Nivel</AppText>
            <View style={styles.levelBadgeWrap}>
              <Image source={levelBadge} resizeMode="contain" style={styles.levelBadgeImage} />
              <AppText
                weight="800"
                style={styles.levelBadgeNumber}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {level.level}
              </AppText>
            </View>
            <View style={styles.centerProgress}>
              <ProgressBar
                value={level.progress}
                label="Progreso de nivel"
                color="#FFFFFF"
                trackColor="rgba(255, 255, 255, 0.55)"
                height={7}
                delay={220}
                duration={720}
              />
            </View>
            <AppText weight="800" style={styles.centerProgressText} numberOfLines={1} adjustsFontSizeToFit>
              {gamification.xp} / {level.next} XP
            </AppText>
          </View>
          <View style={styles.nextLevelCopy}>
            <AppText variant="label" style={styles.nextLevelKicker}>
              Proximo nivel
            </AppText>
            <AppText weight="800" style={styles.nextLevelText}>
              {minutesToNextLevel > 0
                ? `Salta ${minutesToNextLevel} min mas para desbloquear nivel ${level.level + 1}`
                : 'Ya podes desbloquear el siguiente nivel'}
            </AppText>
          </View>
        </View>
      </MotionReveal>

      <MotionReveal delay={90} distance={6} style={styles.summaryMetricsPanel}>
        <SummaryMetric
          icon={summaryIcons.streak}
          color="#FF812F"
          label="RACHA"
          value={`${gamification.currentStreak} dias`}
          caption={`Mejor: ${gamification.bestStreak} dias`}
        />
        <SummaryMetric
          icon={summaryIcons.time}
          color="#31C27C"
          label="TIEMPO TOTAL"
          value={formatDurationShort(week.totalDuration)}
          caption="esta semana"
        />
        <SummaryMetric
          icon={summaryIcons.jumps}
          color="#3FA7FF"
          label="SALTOS TOTALES"
          value={week.jumps.toLocaleString('es-AR')}
          caption="esta semana"
        />
        <SummaryMetric
          icon={summaryIcons.workouts}
          color="#8D5CF4"
          label="ENTRENOS"
          value={String(week.workouts)}
          caption="esta semana"
          isLast
        />
      </MotionReveal>

      <MotionReveal delay={150} distance={6}>
        <DailyStreakPanel
          days={dailyStreakDays}
          infoVisible={dailyStreakInfoVisible}
          onInfoClose={closeDailyStreakInfo}
          onInfoPress={toggleDailyStreakInfo}
          onInfoTouchStart={handleInfoButtonTouch}
          restDays={weeklyRestDays}
        />
      </MotionReveal>

      <MotionReveal delay={210} distance={6}>
        <WeeklyReportPanel
          averageJumps={reportSummary.averageJumps}
          calories={reportSummary.calories}
          days={reportSummary.days}
          dropdownOpen={reportDropdownOpen}
          onRangePress={toggleReportDropdown}
          onRangeSelect={selectReportRange}
          onRangeTouchStart={handleInfoButtonTouch}
          rangeLabel={reportSummary.label}
          selectedRange={reportRange}
          targetMinutes={reportSummary.targetMinutes}
          title={reportSummary.title}
          totalMinutes={reportSummary.totalMinutes}
        />
      </MotionReveal>

      <MotionReveal delay={270} distance={6}>
        <WeekComparisonPanel metrics={weekComparison} />
      </MotionReveal>

      <MotionReveal delay={330} distance={6}>
        <PersonalBestsPanel metrics={personalBests} />
      </MotionReveal>
    </Screen>
  );
};

const SummaryMetric = ({
  caption,
  color,
  icon,
  isLast = false,
  label,
  value,
}: {
  caption: string;
  color: string;
  icon: ImageSourcePropType;
  isLast?: boolean;
  label: string;
  value: string;
}) => (
  <View style={styles.summaryMetric}>
    <Image source={icon} resizeMode="contain" style={styles.summaryMetricIcon} />
    <AppText variant="label" style={[styles.summaryMetricLabel, { color }]} numberOfLines={1} adjustsFontSizeToFit>
      {label}
    </AppText>
    <AppText weight="800" style={styles.summaryMetricValue} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </AppText>
    <AppText style={styles.summaryMetricCaption} numberOfLines={1} adjustsFontSizeToFit>
      {caption}
    </AppText>
    {!isLast ? <View style={styles.summaryMetricDivider} /> : null}
  </View>
);

const DailyStreakPanel = ({
  days,
  infoVisible,
  onInfoClose,
  onInfoPress,
  onInfoTouchStart,
  restDays,
}: {
  days: DailyStreakDay[];
  infoVisible: boolean;
  onInfoClose: () => void;
  onInfoPress: () => void;
  onInfoTouchStart: () => void;
  restDays: number;
}) => {
  const reducedMotion = useReducedMotion();
  const [infoMotion] = useState(() => new Animated.Value(0));
  const restDaysText = restDays === 1 ? '1 dia' : `${restDays} dias`;

  useEffect(() => {
    let autoCloseTimer: ReturnType<typeof setTimeout> | undefined;

    if (infoVisible) {
      infoMotion.stopAnimation();
      infoMotion.setValue(reducedMotion ? 1 : 0);

      if (!reducedMotion) {
        Animated.timing(infoMotion, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }

      autoCloseTimer = setTimeout(onInfoClose, 8200);
    } else {
      infoMotion.stopAnimation();
      if (reducedMotion) {
        infoMotion.setValue(0);
      } else {
        Animated.timing(infoMotion, {
          toValue: 0,
          duration: 620,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    }

    return () => {
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [infoMotion, infoVisible, onInfoClose, reducedMotion]);

  const bubbleOpacity = infoMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const bubbleTranslateY = infoMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });
  const bubbleScale = infoMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <View style={styles.dailyStreakPanel}>
      <View style={styles.dailyStreakHeader}>
        <View style={styles.dailyStreakTitleBlock}>
          <View style={styles.dailyStreakTitleRow}>
            <AppText weight="800" style={styles.dailyStreakTitle}>
              Racha diaria
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver como funciona la racha diaria"
              onPress={onInfoPress}
              onTouchStart={onInfoTouchStart}
              style={({ pressed }) => [styles.dailyStreakInfoButton, pressed ? styles.dailyStreakInfoButtonPressed : undefined]}
            >
              <Info size={11} color="#8E63FF" strokeWidth={2.4} />
            </Pressable>
          </View>
          <AppText style={styles.dailyStreakSubtitle}>No pierdas tu racha!</AppText>
        </View>
      </View>

      <Animated.View
        accessibilityElementsHidden={!infoVisible}
        pointerEvents="none"
        style={[
          styles.dailyStreakInfoBubbleWrap,
          {
            opacity: bubbleOpacity,
            transform: [{ translateY: bubbleTranslateY }, { scale: bubbleScale }],
          },
        ]}
      >
        <View style={styles.dailyStreakInfoArrow} />
        <View style={styles.dailyStreakInfoBubble}>
          <AppText style={styles.dailyStreakInfoText}>
            Tu racha respeta tu plan semanal: podes descansar {restDaysText} sin perderla. Si descansas mas de eso, se usa un
            salvavidas si tenes disponible.
          </AppText>
        </View>
      </Animated.View>

      <View style={styles.dailyStreakDaysRow}>
        {days.map((day, index) => (
          <DailyStreakMarker key={day.date} day={day} index={index} />
        ))}
      </View>

      <View style={styles.dailyStreakLegend}>
        <LegendItem color="#43D34E" label="Completado" />
        <LegendItem color="#7557F7" label="Hoy" />
        <LegendItem color="#B9B2CC" label="Sin completar" />
      </View>
    </View>
  );
};

const DailyStreakMarker = ({ day, index }: { day: DailyStreakDay; index: number }) => {
  const completed = day.state === 'completed';
  const today = day.state === 'today';
  const rest = day.state === 'rest';
  const incomplete = day.state === 'incomplete';

  return (
    <MotionReveal delay={220 + index * 45} distance={4} fromScale={0.9} style={styles.dailyStreakDay}>
      <AppText weight="800" style={[styles.dailyStreakDayLetter, today ? styles.dailyStreakDayLetterToday : undefined]}>
        {day.letter}
      </AppText>
      <View
        style={[
          styles.dailyStreakCircle,
          completed ? styles.dailyStreakCircleCompleted : undefined,
          today ? styles.dailyStreakCircleToday : undefined,
          rest ? styles.dailyStreakCircleRest : undefined,
          incomplete ? styles.dailyStreakCircleIncomplete : undefined,
        ]}
      >
        {completed ? <View pointerEvents="none" style={styles.dailyStreakCircleGloss} /> : null}
        <AppText
          weight="800"
          style={[
            styles.dailyStreakDayNumber,
            completed || today ? styles.dailyStreakDayNumberActive : undefined,
            rest ? styles.dailyStreakDayNumberRest : undefined,
            incomplete ? styles.dailyStreakDayNumberIncomplete : undefined,
          ]}
        >
          {day.number}
        </AppText>
        {completed ? (
          <View style={styles.dailyStreakCheck}>
            <Check size={7} color="#42CF4D" strokeWidth={4} />
          </View>
        ) : null}
      </View>
    </MotionReveal>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.dailyStreakLegendItem}>
    <View style={[styles.dailyStreakLegendDot, { backgroundColor: color }]} />
    <AppText weight="800" style={styles.dailyStreakLegendText}>
      {label}
    </AppText>
  </View>
);

const WeeklyReportPanel = ({
  averageJumps,
  calories,
  days,
  dropdownOpen,
  onRangePress,
  onRangeSelect,
  onRangeTouchStart,
  rangeLabel,
  selectedRange,
  targetMinutes,
  title,
  totalMinutes,
}: {
  averageJumps: number;
  calories: number;
  days: WeeklyReportDay[];
  dropdownOpen: boolean;
  onRangePress: () => void;
  onRangeSelect: (range: ReportRange) => void;
  onRangeTouchStart: () => void;
  rangeLabel: string;
  selectedRange: ReportRange;
  targetMinutes: number;
  title: string;
  totalMinutes: number;
}) => {
  const reducedMotion = useReducedMotion();
  const [dropdownMotion] = useState(() => new Animated.Value(0));
  const minutesProgress = Math.min(1, totalMinutes / targetMinutes);

  useEffect(() => {
    dropdownMotion.stopAnimation();
    Animated.timing(dropdownMotion, {
      toValue: dropdownOpen ? 1 : 0,
      duration: dropdownOpen ? 220 : 260,
      easing: dropdownOpen ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dropdownMotion, dropdownOpen]);

  const dropdownOpacity = reducedMotion ? (dropdownOpen ? 1 : 0) : dropdownMotion;
  const dropdownTranslateY = dropdownMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });
  const dropdownScale = dropdownMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const chevronRotate = dropdownMotion.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.weeklyReportPanel}>
      <View style={styles.weeklyReportHeader}>
        <AppText weight="800" style={styles.weeklyReportTitle}>
          {title}
        </AppText>
        <View style={styles.reportRangeMenuWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Seleccionar periodo del resumen"
            accessibilityState={{ expanded: dropdownOpen }}
            onPress={onRangePress}
            onTouchStart={onRangeTouchStart}
            style={({ pressed }) => [styles.reportRangeButton, pressed ? styles.reportRangeButtonPressed : undefined]}
          >
            <AppText weight="800" style={styles.reportRangeButtonText} numberOfLines={1}>
              {rangeLabel}
            </AppText>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <ChevronDown size={11} color="#7D57F4" strokeWidth={3} />
            </Animated.View>
          </Pressable>

          <Animated.View
            pointerEvents={dropdownOpen ? 'auto' : 'none'}
            style={[
              styles.reportRangeDropdown,
              {
                opacity: dropdownOpacity,
                transform: [{ translateY: dropdownTranslateY }, { scale: dropdownScale }],
              },
            ]}
          >
            {reportRangeOptions.map((option) => {
              const selected = option.id === selectedRange;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  onPress={() => onRangeSelect(option.id)}
                  onTouchStart={onRangeTouchStart}
                  style={({ pressed }) => [
                    styles.reportRangeOption,
                    selected ? styles.reportRangeOptionSelected : undefined,
                    pressed ? styles.reportRangeOptionPressed : undefined,
                  ]}
                >
                  <AppText
                    weight="800"
                    style={[styles.reportRangeOptionText, selected ? styles.reportRangeOptionTextSelected : undefined]}
                  >
                    {option.label}
                  </AppText>
                  {selected ? <View style={styles.reportRangeSelectedDot} /> : null}
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      </View>

      <View style={styles.weeklyReportCards}>
        <View style={styles.weeklyReportCard}>
          <AppText weight="800" style={styles.weeklyReportCardTitle}>
            Minutos saltando
          </AppText>
          <AppText weight="800" style={styles.weeklyReportValue}>
            {formatReportNumber(totalMinutes)} m
          </AppText>
          <View style={styles.weeklyReportCaptionRow}>
            <AppText style={styles.weeklyReportCaption}>Objetivo: {formatReportNumber(targetMinutes)} m</AppText>
            <AppText weight="800" style={styles.weeklyReportPercent}>
              {Math.round(minutesProgress * 100)}%
            </AppText>
          </View>
          <View style={styles.weeklyReportProgressTrack}>
            <ProgressBar
              value={minutesProgress}
              label="Progreso de minutos del periodo"
              color="#7657FF"
              trackColor="#EEE9FF"
              height={5}
              delay={300}
              duration={680}
            />
          </View>
        </View>

        <View style={styles.weeklyReportCard}>
          <AppText weight="800" style={styles.weeklyReportCardTitle}>
            Saltos por dia
          </AppText>
          <AppText weight="800" style={styles.weeklyReportValue}>
            {formatReportNumber(averageJumps)}
          </AppText>
          <AppText style={styles.weeklyReportCaption}>Promedio</AppText>
          <JumpBars values={days.map((day) => day.jumps)} />
        </View>

        <View style={[styles.weeklyReportCard, styles.weeklyReportCaloriesCard]}>
          <AppText weight="800" style={styles.weeklyReportCardTitle}>
            Calorias
          </AppText>
          <AppText weight="800" style={styles.weeklyReportValue}>
            {formatReportNumber(calories)} kcal
          </AppText>
          <AppText style={styles.weeklyReportCaption}>Quemadas</AppText>
          <CaloriesLineChart values={days.map((day) => day.calories)} />
        </View>
      </View>
    </View>
  );
};

const WeekComparisonPanel = ({ metrics }: { metrics: WeekComparisonMetric[] }) => (
  <View style={styles.comparisonPanel}>
    <View style={styles.comparisonHeader}>
      <AppText weight="800" style={styles.comparisonTitle}>
        Comparado con la semana pasada
      </AppText>
      <View style={styles.comparisonPulse} />
    </View>

    <View style={styles.comparisonMetrics}>
      {chunkIntoPairs(metrics).map((row, rowIndex) => (
        <View key={`comparison-row-${rowIndex}`} style={styles.comparisonMetricRow}>
          {row.map((metric, columnIndex) => {
            const index = rowIndex * 2 + columnIndex;
            return (
              <MotionReveal key={metric.label} delay={320 + index * 45} distance={4} fromScale={0.98} style={styles.comparisonMetric}>
                <View style={[styles.comparisonIconWrap, { backgroundColor: `${metric.color}18` }]}>
                  <Image source={metric.icon} resizeMode="contain" style={styles.comparisonIcon} />
                </View>
                <View style={styles.comparisonCopy}>
                  <AppText weight="800" style={[styles.comparisonValue, { color: metric.color }]} numberOfLines={1} adjustsFontSizeToFit>
                    {metric.value}
                  </AppText>
                  <AppText style={styles.comparisonLabel} numberOfLines={1} adjustsFontSizeToFit>
                    {metric.label}
                  </AppText>
                </View>
              </MotionReveal>
            );
          })}
          {row.length === 1 ? <View style={styles.twoColumnSpacer} /> : null}
        </View>
      ))}
    </View>
  </View>
);

const PersonalBestsPanel = ({ metrics }: { metrics: PersonalBestMetric[] }) => (
  <View style={styles.personalBestsPanel}>
    <View style={styles.personalBestsHeader}>
      <View>
        <AppText weight="800" style={styles.personalBestsTitle}>
          Tus mejores marcas
        </AppText>
        <AppText style={styles.personalBestsSubtitle}>Records propios para superar</AppText>
      </View>
    </View>

    <View style={styles.personalBestsGrid}>
      {chunkIntoPairs(metrics).map((row, rowIndex) => (
        <View key={`personal-best-row-${rowIndex}`} style={styles.personalBestsRow}>
          {row.map((metric, columnIndex) => {
            const index = rowIndex * 2 + columnIndex;
            return (
              <MotionReveal key={metric.caption} delay={380 + index * 45} distance={5} fromScale={0.98} style={styles.personalBestCard}>
                <Image source={metric.icon} resizeMode="contain" style={styles.personalBestIcon} />
                <View style={styles.personalBestCopy}>
                  <AppText weight="800" style={styles.personalBestValue} numberOfLines={1} adjustsFontSizeToFit>
                    {metric.value}
                  </AppText>
                  <AppText weight="800" style={styles.personalBestCaption} numberOfLines={2}>
                    {metric.caption}
                  </AppText>
                  <AppText style={styles.personalBestLabel} numberOfLines={1} adjustsFontSizeToFit>
                    {metric.label}
                  </AppText>
                </View>
              </MotionReveal>
            );
          })}
          {row.length === 1 ? <View style={styles.twoColumnSpacer} /> : null}
        </View>
      ))}
    </View>
  </View>
);

const JumpBars = ({ values }: { values: number[] }) => {
  const maxValue = Math.max(...values, 1);

  return (
    <View style={styles.jumpBars}>
      {values.map((value, index) => {
        const height = Math.max(5, Math.round((value / maxValue) * 30));
        return (
          <MotionHeight
            key={`${value}-${index}`}
            height={height}
            delay={340 + index * 45}
            duration={520}
            style={styles.jumpBar}
          />
        );
      })}
    </View>
  );
};

const makeLinePath = (values: number[], width: number, height: number, padding = 3) => {
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const points = values.map((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((value - minValue) / range) * (height - padding * 2);
    return { x, y };
  });

  if (points.length === 0) return '';
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1] ?? point;
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
};

const CaloriesLineChart = ({ values }: { values: number[] }) => {
  const width = 104;
  const height = 42;
  const linePath = makeLinePath(values, width, height);
  const fillPath = linePath ? `${linePath} L ${width - 3} ${height - 2} L 3 ${height - 2} Z` : '';
  const reducedMotion = useReducedMotion();
  const valuesKey = values.join('|');
  const [drawProgress] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      drawProgress.setValue(1);
      return undefined;
    }
    drawProgress.setValue(0);
    const animation = Animated.timing(drawProgress, {
      toValue: 1,
      duration: 720,
      delay: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [drawProgress, reducedMotion, valuesKey]);

  const dashOffset = drawProgress.interpolate({ inputRange: [0, 1], outputRange: [180, 0] });

  return (
    <View style={styles.caloriesChart}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="calorieFill" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#9B74FF" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#9B74FF" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        {fillPath ? <AnimatedPath d={fillPath} fill="url(#calorieFill)" opacity={drawProgress} /> : null}
        {linePath ? (
          <AnimatedPath
            d={linePath}
            fill="none"
            stroke="#875FFF"
            strokeLinecap="round"
            strokeWidth={2.4}
            strokeDasharray="180 180"
            strokeDashoffset={dashOffset}
          />
        ) : null}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  heroCard: {
    minHeight: 144,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 7,
    overflow: 'hidden',
    backgroundColor: '#8B59FF',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroGradientBase: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({
      backgroundImage: 'linear-gradient(120deg, #9B63FF 0%, #8958F9 42%, #B17AFF 100%)',
    } as any),
  },
  heroGradientShift: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({
      backgroundImage: 'linear-gradient(120deg, #7A5CFF 0%, #A35CFF 48%, #D19CFF 100%)',
    } as any),
  },
  heroLayout: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 118,
    position: 'relative',
  },
  ropiColumn: {
    position: 'absolute',
    left: 4,
    top: 0,
    bottom: 0,
    width: 106,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ropiFloorShadow: {
    position: 'absolute',
    bottom: 3,
    left: 23,
    width: 64,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(43, 21, 104, 0.34)',
    transform: [{ scaleX: 1.24 }],
    ...({
      filter: 'blur(8px)',
      boxShadow: '0 3px 10px rgba(58, 23, 129, 0.2)',
    } as any),
  },
  ropiContactShadow: {
    position: 'absolute',
    bottom: 10,
    left: 34,
    width: 44,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(35, 15, 86, 0.28)',
    ...({
      filter: 'blur(3px)',
    } as any),
  },
  ropiImage: {
    width: 116,
    height: 116,
    marginLeft: -1,
    ...({
      filter: 'drop-shadow(0 8px 8px rgba(48, 24, 104, 0.18))',
    } as any),
  },
  levelColumn: {
    width: 142,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 2,
  },
  levelLabel: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    width: 34,
    textAlign: 'center',
  },
  levelBadgeWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeImage: {
    position: 'absolute',
    width: 72,
    height: 72,
  },
  levelBadgeNumber: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 39,
    textAlign: 'center',
    width: 48,
    textShadowColor: 'rgba(80, 45, 160, 0.32)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  centerProgress: {
    width: 124,
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  centerProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  centerProgressText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    width: 128,
  },
  nextLevelCopy: {
    position: 'absolute',
    right: -1,
    top: 34,
    width: 94,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    zIndex: 1,
  },
  nextLevelKicker: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 8,
    lineHeight: 10,
    textAlign: 'center',
  },
  nextLevelText: {
    color: '#FFFFFF',
    fontSize: 8,
    lineHeight: 10,
    textAlign: 'center',
  },
  summaryMetricsPanel: {
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(231, 224, 248, 0.72)',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 9,
    shadowColor: '#6F5BFF',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  summaryMetric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  summaryMetricIcon: {
    width: 28,
    height: 28,
    marginBottom: 2,
  },
  summaryMetricLabel: {
    fontSize: 8,
    lineHeight: 10,
    textAlign: 'center',
    width: '100%',
  },
  summaryMetricValue: {
    color: '#1F1A33',
    fontSize: 16,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 2,
    width: '100%',
  },
  summaryMetricCaption: {
    color: '#A09AAD',
    fontSize: 7,
    lineHeight: 9,
    textAlign: 'center',
    marginTop: 2,
    width: '100%',
    fontWeight: '700',
  },
  summaryMetricDivider: {
    position: 'absolute',
    top: 11,
    right: -5,
    width: 1,
    height: 53,
    backgroundColor: '#ECE6F7',
  },
  dailyStreakPanel: {
    minHeight: 124,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(236, 231, 248, 0.9)',
    paddingHorizontal: 17,
    paddingTop: 14,
    paddingBottom: 10,
    shadowColor: '#7B56F8',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 2,
    overflow: 'visible',
    position: 'relative',
  },
  dailyStreakHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  dailyStreakTitleBlock: {
    flex: 1,
    gap: 1,
  },
  dailyStreakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dailyStreakInfoButton: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EEFF',
  },
  dailyStreakInfoButtonPressed: {
    backgroundColor: '#E8DFFF',
    transform: [{ scale: 0.96 }],
  },
  dailyStreakTitle: {
    color: '#272139',
    fontSize: 13,
    lineHeight: 16,
  },
  dailyStreakSubtitle: {
    color: '#8B84A0',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  dailyStreakInfoBubbleWrap: {
    position: 'absolute',
    top: 39,
    left: 17,
    right: 17,
    zIndex: 20,
    transformOrigin: '98px 0px',
  },
  dailyStreakInfoArrow: {
    position: 'absolute',
    top: -5,
    left: 91,
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#F4F0FF',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E4DAFF',
    transform: [{ rotate: '45deg' }],
    zIndex: 2,
  },
  dailyStreakInfoBubble: {
    borderRadius: 12,
    backgroundColor: '#F4F0FF',
    borderWidth: 1,
    borderColor: '#E4DAFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#7B56F8',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  dailyStreakInfoText: {
    color: '#6D6681',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  dailyStreakDaysRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 2,
  },
  dailyStreakDay: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  dailyStreakDayLetter: {
    color: '#9790AA',
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
  },
  dailyStreakDayLetterToday: {
    color: '#6F56F6',
  },
  dailyStreakCircle: {
    width: 29,
    height: 29,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dailyStreakCircleCompleted: {
    backgroundColor: '#43D34E',
    shadowColor: '#43D34E',
    shadowOpacity: 0.22,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dailyStreakCircleToday: {
    backgroundColor: '#7557F7',
    shadowColor: '#7557F7',
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dailyStreakCircleRest: {
    backgroundColor: '#F0EEF5',
  },
  dailyStreakCircleIncomplete: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderColor: '#C8C1D7',
  },
  dailyStreakCircleGloss: {
    position: 'absolute',
    top: 4,
    left: 6,
    right: 6,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dailyStreakDayNumber: {
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
  },
  dailyStreakDayNumberActive: {
    color: '#FFFFFF',
  },
  dailyStreakDayNumberRest: {
    color: '#A9A3B6',
  },
  dailyStreakDayNumberIncomplete: {
    color: '#8B84A0',
  },
  dailyStreakCheck: {
    position: 'absolute',
    right: -2,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFF8E2',
  },
  dailyStreakLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 17,
    marginTop: 10,
  },
  dailyStreakLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dailyStreakLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  dailyStreakLegendText: {
    color: '#8A839D',
    fontSize: 8,
    lineHeight: 10,
  },
  weeklyReportPanel: {
    minHeight: 130,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(239, 234, 248, 0.92)',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 12,
    shadowColor: '#7B56F8',
    shadowOpacity: 0.045,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  weeklyReportHeader: {
    minHeight: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  weeklyReportTitle: {
    color: '#29243F',
    fontSize: 12,
    lineHeight: 15,
  },
  reportRangeMenuWrap: {
    position: 'relative',
    zIndex: 30,
  },
  reportRangeButton: {
    height: 25,
    minWidth: 104,
    borderRadius: 999,
    backgroundColor: '#F5F0FF',
    borderWidth: 1,
    borderColor: 'rgba(222, 210, 255, 0.8)',
    paddingLeft: 11,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#7B56F8',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  reportRangeButtonPressed: {
    backgroundColor: '#EDE5FF',
    transform: [{ scale: 0.98 }],
  },
  reportRangeButtonText: {
    color: '#7D57F4',
    fontSize: 8,
    lineHeight: 10,
  },
  reportRangeDropdown: {
    position: 'absolute',
    top: 31,
    right: 0,
    width: 128,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7DFFF',
    padding: 5,
    shadowColor: '#5F43D8',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    zIndex: 40,
  },
  reportRangeOption: {
    minHeight: 28,
    borderRadius: 10,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  reportRangeOptionSelected: {
    backgroundColor: '#F1EAFF',
  },
  reportRangeOptionPressed: {
    backgroundColor: '#E8DFFF',
  },
  reportRangeOptionText: {
    color: '#726A86',
    fontSize: 8.5,
    lineHeight: 11,
  },
  reportRangeOptionTextSelected: {
    color: '#6F50F4',
  },
  reportRangeSelectedDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#7A5CFF',
  },
  weeklyReportCards: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
    zIndex: 1,
  },
  weeklyReportCard: {
    flex: 1,
    minWidth: 0,
    height: 88,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE8F7',
    paddingHorizontal: 9,
    paddingTop: 8,
    paddingBottom: 7,
    shadowColor: '#7863C8',
    shadowOpacity: 0.025,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    overflow: 'hidden',
  },
  weeklyReportCaloriesCard: {
    ...({
      backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 54%, #F6F0FF 100%)',
    } as any),
  },
  weeklyReportCardTitle: {
    color: '#2B2541',
    fontSize: 7.5,
    lineHeight: 9,
  },
  weeklyReportValue: {
    color: '#1F1A33',
    fontSize: 17,
    lineHeight: 20,
    marginTop: 4,
  },
  weeklyReportCaptionRow: {
    minHeight: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 0,
  },
  weeklyReportCaption: {
    color: '#8B849C',
    fontSize: 7.4,
    lineHeight: 9,
    fontWeight: '800',
    marginTop: 0,
  },
  weeklyReportPercent: {
    color: '#302B42',
    fontSize: 7.5,
    lineHeight: 9,
  },
  weeklyReportProgressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: '#F1ECFF',
    overflow: 'hidden',
    marginTop: 10,
  },
  weeklyReportProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#7657FF',
    ...({
      backgroundImage: 'linear-gradient(90deg, #7D5BFF 0%, #8F68FF 100%)',
    } as any),
  },
  jumpBars: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 1,
  },
  jumpBar: {
    flex: 1,
    minWidth: 4.5,
    maxWidth: 7,
    borderRadius: 999,
    backgroundColor: '#906CFF',
    shadowColor: '#8C6BFF',
    shadowOpacity: 0.09,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    ...({
      backgroundImage: 'linear-gradient(180deg, #A787FF 0%, #7B5CFF 100%)',
    } as any),
  },
  caloriesChart: {
    height: 35,
    marginTop: 3,
    marginHorizontal: -4,
    overflow: 'hidden',
  },
  comparisonPanel: {
    minHeight: 112,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(236, 231, 248, 0.92)',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 12,
    shadowColor: '#7B56F8',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 2,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  comparisonTitle: {
    color: '#29243F',
    fontSize: 12,
    lineHeight: 15,
  },
  comparisonPulse: {
    width: 24,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#DFF7EA',
    ...({
      backgroundImage: 'linear-gradient(90deg, #44D58B 0%, #7B5CFF 100%)',
    } as any),
  },
  comparisonMetrics: {
    gap: 7,
  },
  comparisonMetricRow: {
    flexDirection: 'row',
    gap: 7,
  },
  comparisonMetric: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: '#FBFAFF',
    borderWidth: 1,
    borderColor: '#EEE8F7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 7,
  },
  comparisonIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonIcon: {
    width: 23,
    height: 23,
  },
  comparisonCopy: {
    flex: 1,
    minWidth: 0,
  },
  comparisonValue: {
    fontSize: 13,
    lineHeight: 16,
  },
  comparisonLabel: {
    color: '#8A839D',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
  },
  personalBestsPanel: {
    minHeight: 174,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(236, 231, 248, 0.92)',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    shadowColor: '#7B56F8',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 2,
  },
  personalBestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  personalBestsTitle: {
    color: '#29243F',
    fontSize: 12,
    lineHeight: 15,
  },
  personalBestsSubtitle: {
    color: '#8B849C',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  personalBestsGrid: {
    gap: 8,
  },
  personalBestsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  personalBestCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 72,
    borderRadius: 13,
    backgroundColor: '#FBFAFF',
    borderWidth: 1,
    borderColor: '#EEE8F7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 7,
    overflow: 'hidden',
    ...({
      backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #F8F4FF 100%)',
    } as any),
  },
  personalBestIcon: {
    width: 30,
    height: 30,
  },
  personalBestCopy: {
    flex: 1,
    minWidth: 0,
  },
  personalBestValue: {
    color: '#211D33',
    fontSize: 16,
    lineHeight: 19,
  },
  personalBestCaption: {
    color: '#6F5BFF',
    fontSize: 7.5,
    lineHeight: 9,
    marginTop: 1,
  },
  personalBestLabel: {
    color: '#9A94AD',
    fontSize: 7,
    lineHeight: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  twoColumnSpacer: {
    flex: 1,
    minWidth: 0,
  },
});
