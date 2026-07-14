import { useEffect, useState } from 'react';
import { Animated, StyleProp, TextStyle } from 'react-native';
import { AppText } from '@/components/AppText';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MotionNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
  variant?: 'label' | 'body' | 'title' | 'headline' | 'hero' | 'muted';
  weight?: '400' | '600' | '700' | '800';
  style?: StyleProp<TextStyle>;
}

export const MotionNumber = ({
  value,
  prefix = '',
  suffix = '',
  duration = 720,
  delay = 0,
  formatter,
  numberOfLines,
  adjustsFontSizeToFit,
  minimumFontScale,
  variant = 'body',
  weight,
  style,
}: MotionNumberProps) => {
  const reducedMotion = useReducedMotion();
  const [counter] = useState(() => new Animated.Value(reducedMotion ? value : 0));
  const [shown, setShown] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion) {
      counter.setValue(value);
      return undefined;
    }

    const listenerId = counter.addListener(({ value: next }) => {
      setShown(Math.max(0, Math.round(next)));
    });
    const animation = Animated.timing(counter, {
      toValue: value,
      duration,
      delay,
      useNativeDriver: false,
    });
    animation.start();

    return () => {
      animation.stop();
      counter.removeListener(listenerId);
    };
  }, [counter, delay, duration, reducedMotion, value]);

  const displayedValue = Math.round(reducedMotion ? value : shown);

  return (
    <AppText
      variant={variant}
      weight={weight}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      style={style}
    >
      {prefix}
      {formatter ? formatter(displayedValue) : displayedValue}
      {suffix}
    </AppText>
  );
};
