import { ReactNode } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/components/useTheme';
import { radius, spacing } from '@/theme/tokens';

interface MetricPillProps {
  label: string;
  value: string;
  icon?: ReactNode;
  iconSource?: ImageSourcePropType;
  tone?: 'primary' | 'accent' | 'rest' | 'neutral';
}

export const MetricPill = ({ label, value, icon, iconSource, tone = 'neutral' }: MetricPillProps) => {
  const { colors } = useTheme();
  const toneColor =
    tone === 'primary' ? colors.primary : tone === 'accent' ? colors.accent : tone === 'rest' ? colors.rest : colors.textMuted;
  const background = tone === 'neutral' ? colors.surface : colors.surface;
  const hasIcon = Boolean(iconSource || icon);

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[
        styles.pill,
        {
          backgroundColor: background,
          borderColor: colors.border,
          shadowColor: toneColor,
        },
      ]}
    >
      {hasIcon ? <View style={styles.iconWrap}>{iconSource ? <Image source={iconSource} resizeMode="contain" style={styles.iconImage} /> : icon}</View> : null}
      <View style={styles.copy}>
        <AppText variant="label" style={{ color: toneColor }}>
          {label}
        </AppText>
        <AppText weight="800">{value}</AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  copy: {
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 44,
    height: 44,
  },
});
