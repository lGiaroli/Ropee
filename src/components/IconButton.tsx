import { ReactNode, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/components/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radius } from '@/theme/tokens';

interface IconButtonProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}

export const IconButton = ({ icon, label, onPress, variant = 'default', disabled }: IconButtonProps) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressScale] = useState(() => new Animated.Value(1));
  const background =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.surface;

  const animatePress = (toValue: number) => {
    if (reducedMotion || disabled) {
      pressScale.setValue(1);
      return;
    }
    Animated.spring(pressScale, {
      toValue,
      damping: 14,
      stiffness: 230,
      mass: 0.55,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => animatePress(0.92)}
        onPressOut={() => animatePress(1)}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: background,
            borderColor: variant === 'primary' || variant === 'danger' ? 'transparent' : colors.border,
            shadowColor: variant === 'default' ? colors.primaryDark : background,
            opacity: disabled ? 0.4 : pressed ? 0.82 : 1,
          },
        ]}
      >
        {icon}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
});
