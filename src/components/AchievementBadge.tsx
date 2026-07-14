import { Lock } from 'lucide-react-native';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { useTheme } from '@/components/useTheme';
import {
  AchievementFamily,
  AchievementTier,
  achievementFamilyColors,
  achievementTierStyles,
} from '@/data/achievementVisuals';

type AchievementVisualState = 'unlocked' | 'pending' | 'locked';

interface AchievementBadgeProps {
  family: AchievementFamily;
  tier: AchievementTier;
  unlocked: boolean;
  visualState?: AchievementVisualState;
  size?: number;
}

const iconSources: Record<AchievementFamily, ImageSourcePropType> = {
  streak: require('../../assets/icons/achievements/achievement-streak.png'),
  workouts: require('../../assets/icons/achievements/achievement-jump-rope.png'),
  minutes: require('../../assets/icons/achievements/achievement-minutes.png'),
  clean: require('../../assets/icons/achievements/achievement-clean.png'),
  strength: require('../../assets/icons/achievements/achievement-strength.png'),
  jumps: require('../../assets/icons/achievements/achievement-jumps.png'),
  calories: require('../../assets/icons/achievements/achievement-calories.png'),
  session: require('../../assets/icons/achievements/achievement-session.png'),
  week: require('../../assets/icons/achievements/achievement-week.png'),
  level: require('../../assets/icons/achievements/achievement-level.png'),
};

const lockedPalette = {
  outer: '#C9CDD6',
  inner: '#F2F3F6',
  core: '#8B929F',
  shine: '#FFFFFF',
};

export const AchievementBadge = ({
  family,
  tier,
  unlocked,
  visualState,
  size = 64,
}: AchievementBadgeProps) => {
  const { colors } = useTheme();
  const state = visualState ?? (unlocked ? 'unlocked' : 'locked');
  const familyColor = achievementFamilyColors[family];
  const tierStyle = achievementTierStyles[tier];
  const isLocked = state === 'locked';
  const isPending = state === 'pending';
  const outerColor = isLocked ? lockedPalette.outer : tierStyle.rim;
  const innerColor = isLocked ? lockedPalette.inner : tierStyle.rimLight;
  const coreColor = isLocked ? lockedPalette.core : familyColor.primary;
  const iconOpacity = state === 'unlocked' ? 1 : isPending ? 0.54 : 0.2;
  const badgeOpacity = state === 'unlocked' ? 1 : isPending ? 0.72 : 0.62;
  const iconSize = size * 0.38;
  const lockSize = size * 0.25;
  const points = '32 3 58 17 58 47 32 61 6 47 6 17';
  const innerPoints = '32 10 51 21 51 43 32 54 13 43 13 21';
  const corePoints = '32 17 44 24 44 40 32 47 20 40 20 24';

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          opacity: badgeOpacity,
          shadowColor: isLocked ? colors.textMuted : familyColor.primary,
          shadowOpacity: state === 'unlocked' ? 0.22 : 0.06,
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Polygon points={points} fill={outerColor} />
        <Polygon points={innerPoints} fill={innerColor} />
        <Polygon points={corePoints} fill={coreColor} opacity={isPending ? 0.72 : 1} />
        {state === 'unlocked' ? (
          <>
            <Circle cx="22" cy="18" r="3.4" fill={tierStyle.shine} opacity={0.72} />
            <Circle cx="27" cy="14" r="1.4" fill={tierStyle.shine} opacity={0.62} />
          </>
        ) : null}
        {tier === 'legendary' && state === 'unlocked' ? (
          <Polygon points="46 9 48 14 53 16 48 18 46 23 44 18 39 16 44 14" fill={tierStyle.shine} opacity={0.86} />
        ) : null}
      </Svg>
      <Image
        source={iconSources[family]}
        resizeMode="contain"
        style={[
          styles.iconImage,
          {
            width: iconSize,
            height: iconSize,
            opacity: iconOpacity,
          },
        ]}
      />
      {isLocked ? (
        <View
          style={[
            styles.lockOverlay,
            {
              width: lockSize,
              height: lockSize,
              borderRadius: lockSize / 2,
              right: size * 0.09,
              bottom: size * 0.09,
            },
          ]}
        >
          <Lock size={lockSize * 0.58} color={colors.textMuted} strokeWidth={3} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  iconImage: {
    position: 'absolute',
  },
  lockOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(139, 146, 159, 0.22)',
  },
});
