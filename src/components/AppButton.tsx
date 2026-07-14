import { ReactNode, useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/components/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radius, spacing } from '@/theme/tokens';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const AppButton = ({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  style,
  accessibilityLabel,
}: AppButtonProps) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressScale] = useState(() => new Animated.Value(1));
  const [enabledProgress] = useState(() => new Animated.Value(disabled ? 0 : 1));
  const [unlockScale] = useState(() => new Animated.Value(1));
  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.surface
        : 'transparent';
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? colors.primaryDark
        : colors.text;
  const shadowColor =
    variant === 'primary'
      ? colors.primaryDark
      : variant === 'danger'
        ? colors.danger
        : colors.primaryDark;

  const animatePress = (toValue: number) => {
    if (reducedMotion || disabled) {
      pressScale.setValue(1);
      return;
    }
    Animated.spring(pressScale, {
      toValue,
      damping: 14,
      stiffness: 220,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    enabledProgress.stopAnimation();
    unlockScale.stopAnimation();

    if (reducedMotion) {
      enabledProgress.setValue(disabled ? 0 : 1);
      unlockScale.setValue(1);
      return undefined;
    }

    const availability = Animated.timing(enabledProgress, {
      toValue: disabled ? 0 : 1,
      duration: disabled ? 150 : 240,
      useNativeDriver: true,
    });
    const scale = disabled
      ? Animated.timing(unlockScale, {
          toValue: 0.985,
          duration: 150,
          useNativeDriver: true,
        })
      : Animated.sequence([
          Animated.spring(unlockScale, {
            toValue: 1.035,
            damping: 15,
            stiffness: 240,
            mass: 0.55,
            useNativeDriver: true,
          }),
          Animated.spring(unlockScale, {
            toValue: 1,
            damping: 14,
            stiffness: 230,
            mass: 0.55,
            useNativeDriver: true,
          }),
        ]);
    const animation = Animated.parallel([availability, scale]);
    animation.start();
    return () => animation.stop();
  }, [disabled, enabledProgress, reducedMotion, unlockScale]);

  const enabledOpacity = enabledProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.46, 1],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: enabledOpacity,
          transform: [{ scale: unlockScale }, { scale: pressScale }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => animatePress(0.97)}
        onPressOut={() => animatePress(1)}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: background,
            borderColor: variant === 'primary' || variant === 'danger' ? 'transparent' : colors.border,
            shadowColor,
            opacity: pressed ? 0.84 : 1,
          },
        ]}
      >
        {variant === 'primary' || variant === 'danger' ? (
          <>
            <View pointerEvents="none" style={styles.buttonGlossGlow} />
            <View pointerEvents="none" style={styles.buttonGloss} />
          </>
        ) : null}
        {icon}
        <AppText weight="800" style={{ color: textColor }} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </AppText>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    outlineStyle: 'none',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5,
  } as any,
  buttonGlossGlow: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 6,
    height: 21,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    opacity: 0.12,
    ...({
      filter: 'blur(7px)',
      transform: 'translateY(-2px)',
    } as any),
  },
  buttonGloss: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: 8,
    height: 13,
    borderRadius: radius.pill,
    opacity: 0.2,
    ...({
      backgroundImage:
        'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.48) 18%, rgba(255,255,255,0.62) 50%, rgba(255,255,255,0.48) 82%, rgba(255,255,255,0) 100%)',
      filter: 'blur(2.5px)',
    } as any),
  },
});
