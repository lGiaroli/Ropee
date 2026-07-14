import { ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MotionHeightProps {
  children?: ReactNode;
  delay?: number;
  duration?: number;
  height: number;
  style?: StyleProp<ViewStyle>;
  triggerKey?: string | number;
}

export const MotionHeight = ({
  children,
  delay = 0,
  duration = 560,
  height,
  style,
  triggerKey = 'mount',
}: MotionHeightProps) => {
  const reducedMotion = useReducedMotion();
  const safeHeight = Math.max(0, height);
  const [progress] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return undefined;
    }

    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      delay,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress, reducedMotion, safeHeight, triggerKey]);

  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, safeHeight],
  });

  return (
    <Animated.View style={[style, { height: animatedHeight }]}>
      {children}
    </Animated.View>
  );
};
