import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/components/useTheme';

interface CelebrationBurstProps {
  active?: boolean;
}

export const CelebrationBurst = ({ active = true }: CelebrationBurstProps) => {
  const reducedMotion = useReducedMotion();
  const { colors } = useTheme();
  const [progress] = useState(() => new Animated.Value(0));
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        index,
        angle: (index / 14) * Math.PI * 2,
        color: [colors.primary, colors.accent, colors.rest, colors.strength][index % 4],
        size: 5 + (index % 3),
      })),
    [colors.accent, colors.primary, colors.rest, colors.strength],
  );

  useEffect(() => {
    if (!active || reducedMotion) return undefined;
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [active, progress, reducedMotion]);

  if (reducedMotion || !active) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {dots.map((dot) => {
        const distance = 64 + (dot.index % 4) * 9;
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(dot.angle) * distance],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(dot.angle) * distance],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 1, 0],
        });

        return (
          <Animated.View
            key={dot.index}
            style={[
              styles.dot,
              {
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size / 2,
                backgroundColor: dot.color,
                opacity,
                transform: [{ translateX }, { translateY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: '50%',
    top: 62,
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
});
