import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/components/useTheme';
import { typography } from '@/theme/tokens';

interface AppTextProps extends TextProps {
  variant?: 'label' | 'body' | 'title' | 'headline' | 'hero' | 'muted';
  weight?: '400' | '600' | '700' | '800';
}

export const AppText = ({ variant = 'body', weight, style, ...props }: AppTextProps) => {
  const { colors } = useTheme();
  return (
    <Text
      {...props}
      style={[
        styles.base,
        { color: variant === 'muted' ? colors.textMuted : colors.text },
        styles[variant],
        weight ? { fontWeight: weight } : undefined,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.family,
    letterSpacing: 0,
  },
  label: {
    fontSize: typography.sizes.xs,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  body: {
    fontSize: typography.sizes.md,
    lineHeight: 21,
  },
  title: {
    fontSize: typography.sizes.lg,
    lineHeight: 23,
    fontWeight: '800',
  },
  headline: {
    fontSize: typography.sizes.xl,
    lineHeight: 34,
    fontWeight: '800',
  },
  hero: {
    fontSize: typography.sizes.hero,
    lineHeight: 58,
    fontWeight: '800',
  },
  muted: {
    fontSize: typography.sizes.sm,
    lineHeight: 19,
  },
});
