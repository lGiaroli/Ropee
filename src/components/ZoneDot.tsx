import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ZoneDotProps {
  color: string;
  lockedColor: string;
  borderColor: string;
  unlocked: boolean;
  active: boolean;
}

export const ZoneDot = ({ color, lockedColor, borderColor, unlocked, active }: ZoneDotProps) => {
  const reducedMotion = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion || !active) {
      pulse.setValue(0);
      return undefined;
    }

    pulse.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [active, pulse, reducedMotion]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.35],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0],
  });
  const dotScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, active ? 1.08 : 1],
  });

  return (
    <View style={styles.wrap}>
      {active ? (
        <Animated.View
          style={[
            styles.ring,
            {
              backgroundColor: color,
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: unlocked ? color : lockedColor,
            borderColor,
            opacity: unlocked ? 1 : 0.55,
            transform: [{ scale: dotScale }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
  },
});
