import { ReactNode, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MotionPressableProps extends Omit<PressableProps, 'children'> {
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  pressedScale?: number;
}

export const MotionPressable = ({
  children,
  containerStyle,
  disabled,
  onPressIn,
  onPressOut,
  pressedScale = 0.97,
  ...props
}: MotionPressableProps) => {
  const reducedMotion = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));

  const animate = (toValue: number) => {
    if (disabled || reducedMotion) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue,
      damping: 15,
      stiffness: 260,
      mass: 0.55,
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    animate(pressedScale);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    animate(1);
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};
