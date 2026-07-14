import { StyleSheet, View } from 'react-native';
import { AchievementBadge } from '@/components/AchievementBadge';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { achievementFamilyColors, visualForAchievement } from '@/data/achievementVisuals';
import { NavigationProps } from '@/navigation/navigation';
import { useBadgeData } from '@/store/selectors';
import { spacing } from '@/theme/tokens';

export const AchievementsScreen = (_props: NavigationProps) => {
  const badges = useBadgeData();
  const titleById = Object.fromEntries(badges.map((badge) => [badge.id, badge.title]));
  const unlockedIds = new Set(badges.filter((badge) => badge.unlocked).map((badge) => badge.id));

  return (
    <Screen>
      <MotionReveal distance={5} duration={360}>
      <View>
        <AppText variant="headline">Logros</AppText>
        <AppText variant="muted">Recompensas visuales por consistencia, no por perfeccion.</AppText>
      </View>
      </MotionReveal>
      {badges.map((badge, index) => {
        const visual = visualForAchievement(badge.id);
        const familyColors = achievementFamilyColors[visual.family];
        const missingRequirements = (badge.requires ?? []).filter((requiredBadgeId) => !unlockedIds.has(requiredBadgeId));
        const blockedByRequirement = !badge.unlocked && missingRequirements.length > 0;
        const visualState = badge.unlocked ? 'unlocked' : blockedByRequirement ? 'locked' : 'pending';

        return (
          <Card
            key={badge.id}
            animated={index < 12}
            motionDelay={70 + Math.min(index, 9) * 35}
            style={[
              !badge.unlocked && !blockedByRequirement
                ? { backgroundColor: familyColors.soft, borderColor: familyColors.border }
                : undefined,
              blockedByRequirement ? styles.lockedCard : undefined,
            ]}
          >
            <View style={styles.row}>
              <AchievementBadge
                family={visual.family}
                tier={visual.tier}
                unlocked={badge.unlocked}
                visualState={visualState}
                size={56}
              />
              <View style={styles.flex}>
                <AppText variant="title">{badge.title}</AppText>
                <AppText variant="muted">{badge.description}</AppText>
                {missingRequirements.length ? (
                  <AppText variant="muted" style={styles.requirementsText}>
                    Necesita {missingRequirements.map((requiredBadgeId) => titleById[requiredBadgeId] ?? requiredBadgeId).join(', ')}
                  </AppText>
                ) : null}
                {badge.unlockedAt ? <AppText variant="label">Desbloqueado {badge.unlockedAt.slice(0, 10)}</AppText> : null}
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  lockedCard: {
    backgroundColor: 'rgba(242, 242, 246, 0.72)',
    borderColor: 'rgba(199, 201, 211, 0.58)',
  },
  requirementsText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
