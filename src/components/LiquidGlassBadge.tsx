import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface LiquidGlassBadgeProps extends PropsWithChildren {
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const LiquidGlassBadge = ({ children, contentStyle, style }: LiquidGlassBadgeProps) => (
  <View style={[styles.badge, style]}>
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
