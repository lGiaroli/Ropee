import { Award, ChevronRight, Flame, Gauge, ListChecks, Settings, Zap } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AchievementBadge } from '@/components/AchievementBadge';
import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { MotionPressable } from '@/components/MotionPressable';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/useTheme';
import { visualForAchievement } from '@/data/achievementVisuals';
import { badgeCatalog } from '@/data/gamification';
import { NavigationProps } from '@/navigation/navigation';
import { useBadgeData, useMissionData } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing } from '@/theme/tokens';
import { localDateKey } from '@/utils/date';

const profileAvatar = require('../../assets/icons/nav/tab-profile.png');

const leagueForLevel = (level: number) => {
  if (level >= 18) return { label: 'Atleta', color: '#171827' };
  if (level >= 12) return { label: 'Diamante', color: '#6FBCFF' };
  if (level >= 8) return { label: 'Rubí', color: '#FF6B7A' };
  if (level >= 5) return { label: 'Esmeralda', color: '#31D083' };
  if (level >= 3) return { label: 'Plata', color: '#9CA3AF' };
  return { label: 'Bronce', color: '#D89045' };
};

export const ProfileScreen = ({ navigate }: NavigationProps) => {
  const profile = useAppStore((state) => state.profile);
  const gamification = useAppStore((state) => state.gamification);
  const sessions = useAppStore((state) => state.sessions);
  const badges = useBadgeData();
  const missions = useMissionData();
  const { colors } = useTheme();
  const league = leagueForLevel(gamification.level);
  const today = new Date();
  const caloriesToday = Math.round(
    sessions
      .filter((session) => session.status === 'completed' && localDateKey(session.completedAt) === localDateKey(today))
      .reduce((total, session) => total + session.caloriesEstimated, 0),
  );
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;
  const featuredBadges = [
    ...badges.filter((badge) => badge.unlocked),
    ...badges.filter((badge) => !badge.unlocked),
  ].slice(0, 3);
  const unlockedIds = new Set(badges.filter((badge) => badge.unlocked).map((badge) => badge.id));
  const completedMissionCount = missions.filter((mission) => mission.status !== 'active').length;
  const availableMissionXp = missions
    .filter((mission) => mission.status === 'active')
    .reduce((total, mission) => total + mission.rewardXp, 0);

  return (
    <Screen contentStyle={styles.screenContent}>
      <MotionReveal distance={6} duration={430} fromScale={0.985} style={styles.profileHero}>
        <View style={styles.settingsButton}>
          <IconButton
            label="Configurar perfil"
            onPress={() => navigate({ name: 'settings' })}
            icon={<Settings size={21} color={colors.textMuted} />}
          />
        </View>

        <View style={[styles.avatarRing, { backgroundColor: colors.surfaceStrong }]}>
          <View style={styles.avatar}>
            <Image source={profileAvatar} resizeMode="contain" style={styles.avatarImage} />
          </View>
        </View>
        <AppText variant="title" style={styles.profileName} numberOfLines={1} adjustsFontSizeToFit>
          {profile.name}
        </AppText>
        <AppText variant="muted" style={styles.profileSubline}>
          Nivel {gamification.level} · Liga {league.label}
        </AppText>
      </MotionReveal>

      <MotionReveal delay={90} distance={6}>
      <View>
        <AppText variant="label" style={styles.sectionLabel}>
          Resumen
        </AppText>
        <View style={styles.overviewGrid}>
          <OverviewTile delay={130} icon={<Flame size={19} color={colors.accent} />} value={`${caloriesToday}`} label="quemadas hoy" />
          <OverviewTile delay={175} icon={<Zap size={19} color={colors.primary} />} value={`${gamification.xp}`} label="XP total" />
          <OverviewTile delay={220} icon={<Gauge size={19} color={league.color} />} value={league.label} label="liga" />
          <OverviewTile delay={265} icon={<Award size={19} color={colors.jump} />} value={`${unlockedCount}/${badgeCatalog.length}`} label="logros" />
        </View>
      </View>
      </MotionReveal>

      <MotionReveal delay={285} distance={6}>
        <View>
          <AppText variant="label" style={styles.sectionLabel}>
            Actividad
          </AppText>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Ver misiones"
            onPress={() => navigate({ name: 'missions' })}
            pressedScale={0.985}
            style={({ pressed }) => [styles.missionsCard, pressed && styles.missionsCardPressed]}
          >
            <View style={styles.missionsIcon}>
              <ListChecks size={24} color="#7657FF" strokeWidth={2.6} />
            </View>
            <View style={styles.missionsCopy}>
              <AppText weight="800" style={styles.missionsTitle}>Misiones</AppText>
              <AppText style={styles.missionsSubtitle}>
                {completedMissionCount}/{missions.length} completas · hasta +{availableMissionXp} XP
              </AppText>
            </View>
            <ChevronRight size={20} color="#8F87A8" strokeWidth={2.6} />
          </MotionPressable>
        </View>
      </MotionReveal>

      <MotionReveal delay={300} distance={6}>
      <View>
        <View style={styles.sectionHeader}>
          <AppText variant="label" style={styles.sectionLabel}>
            Logros
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver todos los logros"
            onPress={() => navigate({ name: 'achievements' })}
            hitSlop={10}
          >
            <AppText variant="label" style={{ color: colors.primary }}>
              Ver todos
            </AppText>
          </Pressable>
        </View>
        <View style={[styles.achievementsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {featuredBadges.map((badge, index) => {
            const visual = visualForAchievement(badge.id);
            const blockedByRequirement =
              !badge.unlocked && (badge.requires ?? []).some((requiredBadgeId) => !unlockedIds.has(requiredBadgeId));
            const visualState = badge.unlocked ? 'unlocked' : blockedByRequirement ? 'locked' : 'pending';
            return (
              <MotionReveal key={badge.id} delay={350 + index * 60} distance={4} fromScale={0.92} style={styles.achievementSlot}>
                <AchievementBadge
                  family={visual.family}
                  tier={visual.tier}
                  unlocked={badge.unlocked}
                  visualState={visualState}
                  size={64}
                />
                <AppText weight="800" style={styles.achievementTitle} numberOfLines={1} adjustsFontSizeToFit>
                  {badge.title}
                </AppText>
              </MotionReveal>
            );
          })}
        </View>
      </View>
      </MotionReveal>
    </Screen>
  );
};

const OverviewTile = ({ icon, value, label, delay }: { icon: React.ReactNode; value: string; label: string; delay: number }) => (
  <MotionReveal delay={delay} distance={4} fromScale={0.98} style={styles.overviewTile}>
    <View style={styles.overviewIcon}>{icon}</View>
    <View style={styles.overviewCopy}>
      <AppText weight="800" style={styles.overviewValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText style={styles.overviewLabel} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </AppText>
    </View>
  </MotionReveal>
);

const styles = StyleSheet.create({
  screenContent: {
    gap: spacing.xl,
  },
  profileHero: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  avatar: {
    width: 98,
    height: 98,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 82,
    height: 82,
  },
  profileName: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  profileSubline: {
    textAlign: 'center',
  },
  sectionLabel: {
    color: '#9A94AD',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  overviewTile: {
    width: '48.8%',
    minHeight: 70,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#ECE6FA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  overviewIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewCopy: {
    flex: 1,
  },
  overviewValue: {
    color: '#4D4862',
    fontSize: 18,
    lineHeight: 22,
  },
  overviewLabel: {
    color: '#9A94AD',
    fontSize: 10,
    lineHeight: 13,
  },
  achievementsCard: {
    minHeight: 118,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  missionsCard: {
    minHeight: 72,
    marginTop: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E9E2FA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  missionsCardPressed: {
    opacity: 0.78,
  },
  missionsIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: '#F1EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionsCopy: {
    flex: 1,
  },
  missionsTitle: {
    color: '#312B47',
    fontSize: 15,
    lineHeight: 19,
  },
  missionsSubtitle: {
    color: '#8F87A8',
    fontSize: 11,
    lineHeight: 15,
  },
  achievementSlot: {
    width: '32%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  achievementTitle: {
    color: '#4D4862',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
});
