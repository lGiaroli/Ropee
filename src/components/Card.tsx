import { PropsWithChildren, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@/components/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radius, spacing } from '@/theme/tokens';

interface CardProps extends ViewProps {
  animated?: boolean;
  motionDelay?: number;
}

export const Card = ({
  children,
  style,
  animated = true,
  motionDelay = 0,
  ...props
}: PropsWithChildren<CardProps>) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [entrance] = useState(() => new Animated.Value(animated && !reducedMotion ? 0 : 1));

  useEffect(() => {
    if (!animated || reducedMotion) {
      entrance.setValue(1);
      return undefined;
    }
    const animation = Animated.timing(entrance, {
      toValue: 1,
      delay: motionDelay,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [animated, entrance, motionDelay, reducedMotion]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const scale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.99, 1],
  });

  return (
    <Animated.View
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.primaryDark,
        },
        animated ? { opacity: entrance, transform: [{ translateY }, { scale }] } : undefined,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});
