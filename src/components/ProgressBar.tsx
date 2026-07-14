import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '@/components/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radius } from '@/theme/tokens';

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  label?: string;
  delay?: number;
  duration?: number;
  trackColor?: string;
}

export const ProgressBar = ({
  value,
  color,
  height = 10,
  label,
  delay = 0,
  duration = 560,
  trackColor,
}: ProgressBarProps) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const safe = Math.min(1, Math.max(0, value));
  const [animatedValue] = useState(() => new Animated.Value(reducedMotion ? safe : 0));
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      animatedValue.setValue(safe);
      return undefined;
    }
    if (!hasAnimated.current) animatedValue.setValue(0);
    const animation = Animated.timing(animatedValue, {
      toValue: safe,
      delay: hasAnimated.current ? 0 : delay,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    hasAnimated.current = true;
    return () => animation.stop();
  }, [animatedValue, delay, duration, reducedMotion, safe]);

  const width = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safe * 100) }}
      style={[styles.track, { height, backgroundColor: trackColor ?? colors.surfaceStrong }]}
    >
      <Animated.View style={[styles.fill, { width, backgroundColor: color ?? colors.primary }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
