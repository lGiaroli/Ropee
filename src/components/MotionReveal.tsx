import { ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MotionRevealProps {
  children: ReactNode;
  delay?: number;
  disabled?: boolean;
  distance?: number;
  duration?: number;
  fromScale?: number;
  style?: StyleProp<ViewStyle>;
  triggerKey?: string | number;
}

export const MotionReveal = ({
  children,
  delay = 0,
  disabled = false,
  distance = 8,
  duration = 420,
  fromScale = 1,
  style,
  triggerKey = 'mount',
}: MotionRevealProps) => {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(disabled || reducedMotion ? 1 : 0));

  useEffect(() => {
    if (disabled || reducedMotion) {
      progress.setValue(1);
      return undefined;
    }

    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      delay,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, disabled, duration, progress, reducedMotion, triggerKey]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [distance, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [fromScale, 1],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
