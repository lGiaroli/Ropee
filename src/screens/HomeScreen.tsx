import { BarChart3, Clock3, Layers3, Play, Star, Trophy } from 'lucide-react-native';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { LiquidGlassBadge } from '@/components/LiquidGlassBadge';
import { LiquidGlassPanel } from '@/components/LiquidGlassPanel';
import { MetricPill } from '@/components/MetricPill';
import { MotionHeight } from '@/components/MotionHeight';
import { MotionPressable } from '@/components/MotionPressable';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/useTheme';
import { getDailyChallengeRoutine } from '@/features/workouts/dailyChallenge';
import { NavigationProps } from '@/navigation/navigation';
import { useDashboardData } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/tokens';
import { formatMinutes } from '@/utils/format';

const heroBackground = require('../../assets/home/ropi-hero-no-fade.png');
const metricIcons = {
  streak: require('../../assets/icons/metrics/metric-streak.png'),
  xp: require('../../assets/icons/metrics/metric-xp.png'),
  week: require('../../assets/icons/metrics/metric-week.png'),
  jump: require('../../assets/icons/metrics/metric-jump.png'),
};

export const HomeScreen = ({ navigate }: NavigationProps) => {
  const data = useDashboardData();
  const routines = useAppStore((state) => state.routines);
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const maxWeeklyMinutes = Math.max(...data.weekDays.map((day) => day.minutes), 10);
  const avatarInitial = data.profile.name.slice(0, 1).toUpperCase();
  const dailyChallenge = getDailyChallengeRoutine(routines);
  const tinyHeight = height < 620;
  const tightHeight = height < 700;
  const compactHeight = height < 800;
  const compactChallenge = tightHeight;
  const contentGap = compactHeight ? 8 : 10;
  const bottomPadding = 92;
  const summaryOverlap = tinyHeight ? 132 : tightHeight ? 120 : compactHeight ? 126 : 112;
  const fadeHeight = tinyHeight ? 116 : tightHeight ? 124 : compactHeight ? 148 : 138;
  const challengeHeight = tinyHeight ? 64 : tightHeight ? 78 : 116;
  const fixedHomeChrome = 184 - summaryOverlap + 140 + challengeHeight + contentGap + bottomPadding;
  const minHeroHeight = tinyHeight ? 210 : 318;
  const heroHeight = Math.round(Math.min(456, Math.max(minHeroHeight, height - fixedHomeChrome)));
  const needsScrollFallback = height < 560;

  const startJumping = () => {
    if (dailyChallenge) {
      navigate({ name: 'timer', routineId: dailyChallenge.id });
      return;
    }

    if (data.routine) {
      navigate({ name: 'timer', routineId: data.routine.id });
      return;
    }
    navigate({ name: 'routines' });
  };

  return (
    <Screen
      scroll={needsScrollFallback}
      contentStyle={{ gap: contentGap, paddingBottom: bottomPadding }}
    >
      <MotionReveal distance={5} duration={480} fromScale={0.996} style={styles.heroShell}>
        <View style={[styles.heroScene, { height: heroHeight, shadowColor: colors.primaryDark }]}>
          <Image source={heroBackground} resizeMode="cover" style={styles.heroArt} />
          <View pointerEvents="none" style={[styles.heroFade, { height: fadeHeight }]} />
          <View style={styles.heroTopBar}>
            <View style={styles.greeting}>
              <AppText variant="label" style={styles.greetingKicker}>
                Hello
              </AppText>
              <AppText weight="800" style={styles.greetingName} numberOfLines={1} adjustsFontSizeToFit>
                {data.profile.name}!
              </AppText>
            </View>
            <View style={styles.heroActions}>
              <LiquidGlassBadge style={styles.levelChip} contentStyle={styles.levelChipContent}>
                <Star size={15} color="#FFD65F" fill="#FFD65F" />
                <AppText weight="800" style={styles.levelText}>
                  Nv {data.gamification.level}
                </AppText>
              </LiquidGlassBadge>
              <View style={styles.profileCircle}>
                <AppText variant="label" style={styles.profileInitial}>
                  {avatarInitial}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        <LiquidGlassPanel
          style={[styles.summaryPanel, { marginTop: -summaryOverlap, shadowColor: colors.primaryDark }]}
          contentStyle={styles.summaryPanelContent}
        >
          <View style={styles.summaryTop}>
            <View style={styles.summaryColumn}>
              <AppText weight="800" style={styles.summaryTitle}>
                Reporte semanal
              </AppText>
              <AppText style={styles.summarySubtitle}>
                minutos saltando
              </AppText>
            </View>
            <View style={styles.summaryColumn}>
              <AppText weight="800" style={styles.summaryTitle}>
                Objetivo
              </AppText>
              <AppText style={styles.summarySubtitle}>
                {data.week.workouts}/{data.profile.weeklyGoal} esta semana
              </AppText>
            </View>
          </View>

          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={styles.overviewTitleRow}>
                <View style={styles.overviewIcon}>
                  <BarChart3 size={12} color="#6F5BFF" />
                </View>
                <AppText weight="800" style={styles.overviewTitle}>
                  Semana actual
                </AppText>
              </View>
            </View>

            <View style={styles.compactChart}>
              {data.weekDays.map((day, index) => {
                const barHeight = Math.max(8, Math.round((day.minutes / maxWeeklyMinutes) * 49));
                return (
                  <View key={day.date} style={styles.compactDay}>
                    <View style={[styles.compactTrack, { backgroundColor: day.isToday ? '#EFEAFF' : '#F4F1FF' }]}>
                      <MotionHeight
                        delay={300 + index * 45}
                        height={barHeight}
                        style={[
                          styles.compactFill,
                          {
                            backgroundColor: day.isToday ? '#7A5CFF' : '#64E1CE',
                          },
                        ]}
                      />
                    </View>
                    <AppText style={styles.compactLabel}>
                      {(day.label ?? '').slice(0, 2)}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>
        </LiquidGlassPanel>
      </MotionReveal>

      <View style={styles.bottomStack}>
        <MotionReveal delay={160} distance={6}>
          <View style={styles.metricGrid}>
            <MetricPill label="Racha" value={`${data.gamification.currentStreak} dias`} tone="accent" iconSource={metricIcons.streak} />
            <MetricPill label="XP" value={`${data.week.xp} XP`} tone="primary" iconSource={metricIcons.xp} />
          </View>
        </MotionReveal>
        <MotionReveal delay={220} distance={6}>
          <View style={styles.metricGrid}>
            <MetricPill label="Objetivo" value={`${data.week.workouts}/${data.profile.weeklyGoal}`} tone="rest" iconSource={metricIcons.week} />
            <MetricPill label="Saltando hoy" value={formatMinutes(data.today.jumpDuration)} tone="primary" iconSource={metricIcons.jump} />
          </View>
        </MotionReveal>

        {dailyChallenge ? (
          <MotionReveal delay={280} distance={6}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={`Empezar challenge de hoy: ${dailyChallenge.name}`}
              onPress={startJumping}
              pressedScale={0.985}
              style={({ pressed }) => [
                styles.todayChallenge,
                compactChallenge ? styles.todayChallengeCompact : undefined,
                {
                  minHeight: challengeHeight,
                  borderColor: '#D8CEFF',
                  shadowColor: colors.primaryDark,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}
            >
              <View style={styles.todayChallengeCopy}>
                <View style={styles.todayChallengeHeader}>
                  <View style={styles.todayChallengeIcon}>
                    <Trophy size={12} color="#7657FF" fill="#CDBFFF" strokeWidth={2.4} />
                  </View>
                  <AppText variant="label" style={styles.todayChallengeKicker}>
                    {"Today's challenge"}
                  </AppText>
                </View>
                <AppText
                  weight="800"
                  style={compactChallenge ? styles.todayChallengeTitleCompact : styles.todayChallengeTitle}
                  numberOfLines={compactChallenge ? 1 : 2}
                  adjustsFontSizeToFit
                >
                  {dailyChallenge.name}
                </AppText>
                {!compactChallenge ? (
                  <>
                    <AppText style={styles.todayChallengeDescription} numberOfLines={2}>
                      {dailyChallenge.description}
                    </AppText>
                    <View style={styles.todayChallengeMeta}>
                      <View style={[styles.todayChallengeMetaChip, styles.todayChallengeDurationChip]}>
                        <Clock3 size={11} color="#6B4EFF" strokeWidth={2.7} />
                        <AppText weight="800" style={[styles.todayChallengeMetaText, styles.todayChallengeDurationText]}>
                          {formatMinutes(dailyChallenge.estimatedDuration)}
                        </AppText>
                      </View>
                      <View style={[styles.todayChallengeMetaChip, styles.todayChallengeBlocksChip]}>
                        <Layers3 size={11} color="#23A98D" strokeWidth={2.7} />
                        <AppText weight="800" style={[styles.todayChallengeMetaText, styles.todayChallengeBlocksText]}>
                          {dailyChallenge.blocks} {dailyChallenge.blocks === 1 ? 'bloque' : 'bloques'}
                        </AppText>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>
              <View
                style={[
                  styles.todayChallengePlay,
                  compactChallenge ? styles.todayChallengePlayCompact : undefined,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Play size={compactChallenge ? 16 : 19} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </MotionPressable>
          </MotionReveal>
        ) : null}

      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  heroShell: {
    marginTop: -spacing.lg,
    marginHorizontal: -spacing.lg,
  },
  heroScene: {
    height: 456,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F7F5FF',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  heroArt: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    ...({
      WebkitMaskImage:
        'linear-gradient(to bottom, #000 0%, #000 70%, rgba(0,0,0,0.96) 80%, rgba(0,0,0,0.76) 90%, rgba(0,0,0,0.34) 97%, transparent 100%)',
      WebkitMaskSize: '100% 100%',
      maskImage:
        'linear-gradient(to bottom, #000 0%, #000 70%, rgba(0,0,0,0.96) 80%, rgba(0,0,0,0.76) 90%, rgba(0,0,0,0.34) 97%, transparent 100%)',
      maskSize: '100% 100%',
    } as any),
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 138,
    ...({
      backgroundImage:
        'linear-gradient(to bottom, rgba(247,245,255,0) 0%, rgba(247,245,255,0.04) 34%, rgba(247,245,255,0.16) 58%, rgba(247,245,255,0.36) 78%, rgba(247,245,255,0.66) 100%)',
    } as any),
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  greeting: {
    maxWidth: 172,
  },
  greetingKicker: {
    color: '#FFFFFF',
    opacity: 0.86,
    textShadowColor: 'rgba(80, 60, 150, 0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  greetingName: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 21,
    textShadowColor: 'rgba(80, 60, 150, 0.26)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelChip: {
    width: 70,
    height: 34,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#6F5BFF',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  levelChipContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  levelText: {
    color: '#5C48E8',
    fontSize: 12,
    lineHeight: 16,
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#6F5BFF',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  profileInitial: {
    color: '#5C48E8',
  },
  summaryPanel: {
    marginTop: -112,
    marginHorizontal: spacing.lg,
    height: 184,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    backgroundColor: 'rgba(122, 88, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.36)',
    overflow: 'hidden',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  summaryPanelContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 15,
    paddingBottom: 12,
    gap: 11,
  },
  summaryTop: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
    paddingHorizontal: 11,
    zIndex: 1,
  },
  summaryColumn: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
  },
  summarySubtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 8,
    lineHeight: 10,
  },
  overviewCard: {
    minHeight: 110,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.58)',
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 9,
    gap: 9,
    zIndex: 1,
    shadowColor: '#5B3DD9',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  overviewHeader: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  overviewIcon: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECE7FF',
  },
  overviewTitle: {
    color: '#1F1A33',
    fontSize: 11,
    lineHeight: 15,
  },
  compactChart: {
    minHeight: 70,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  compactDay: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  compactTrack: {
    width: 19,
    height: 56,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  compactFill: {
    width: '100%',
    borderRadius: 7,
  },
  compactLabel: {
    color: '#9A94AD',
    fontSize: 7,
    lineHeight: 9,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bottomStack: {
    gap: 6,
  },
  todayChallenge: {
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  todayChallengeCompact: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  todayChallengeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  todayChallengeHeader: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  todayChallengeIcon: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEE8FF',
  },
  todayChallengeKicker: {
    color: '#694DF0',
    fontSize: 9,
    lineHeight: 11,
  },
  todayChallengeTitle: {
    color: '#211D33',
    fontSize: 17,
    lineHeight: 20,
  },
  todayChallengeTitleCompact: {
    color: '#211D33',
    fontSize: 15,
    lineHeight: 18,
  },
  todayChallengeDescription: {
    color: '#726D82',
    fontSize: 10,
    lineHeight: 13,
  },
  todayChallengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  todayChallengeMetaChip: {
    minHeight: 19,
    paddingHorizontal: 7,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  todayChallengeDurationChip: {
    backgroundColor: '#F0EBFF',
  },
  todayChallengeBlocksChip: {
    backgroundColor: '#E8F8F4',
  },
  todayChallengeMetaText: {
    fontSize: 8.5,
    lineHeight: 10,
  },
  todayChallengeDurationText: {
    color: '#6046E5',
  },
  todayChallengeBlocksText: {
    color: '#208F79',
  },
  todayChallengePlay: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F3DDA',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  todayChallengePlayCompact: {
    width: 38,
    height: 38,
  },
});
