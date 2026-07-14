import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LiquidGlass } from 'simple-liquid-glass';

interface LiquidGlassBadgeProps extends PropsWithChildren {
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const LiquidGlassBadge = ({ children, contentStyle, style }: LiquidGlassBadgeProps) => (
  <View style={[styles.shell, style]}>
    <LiquidGlass
      mode="custom"
      radius={999}
      border={0.045}
      scale={180}
      lightness={64}
      displace={2.1}
      alpha={0.38}
      blur={2.4}
      dispersion={22}
      saturation={158}
      aberrationIntensity={0.12}
      frost={0.06}
      quality="high"
      angle={26}
      lens="shift"
      lensStrength={1.1}
      glassColor="rgba(255, 255, 255, 0.28)"
      borderColor="rgba(255, 255, 255, 0.58)"
      effectMode="svg"
      mobileFallback="svg"
      style={styles.glass}
    >
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </LiquidGlass>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  glass: {
    borderRadius: 999,
    boxShadow:
      '0 8px 16px rgba(86, 68, 180, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.46), inset 0 -1px 0 rgba(255, 255, 255, 0.16)' as any,
    display: 'block' as any,
    height: '100%' as any,
    overflow: 'hidden',
    width: '100%' as any,
  },
  content: {
    height: '100%' as any,
  },
});
