import { PropsWithChildren } from 'react';
import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import { LiquidGlass } from 'simple-liquid-glass';

interface LiquidGlassPanelProps extends PropsWithChildren {
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const LiquidGlassPanel = ({ children, contentStyle, style }: LiquidGlassPanelProps) => (
  <View style={[style, styles.shell]}>
    <LiquidGlass
      mode="custom"
      radius={30}
      border={0.035}
      scale={250}
      lightness={58}
      displace={3.4}
      alpha={0.48}
      blur={3}
      dispersion={30}
      saturation={176}
      aberrationIntensity={0.18}
      frost={0.08}
      quality="extreme"
      angle={24}
      lens="shift"
      lensStrength={1.35}
      glassColor="rgba(126, 76, 255, 0.2)"
      borderColor="rgba(255, 255, 255, 0.42)"
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
    borderColor: 'transparent',
    borderWidth: 0,
    overflow: 'visible',
  },
  glass: {
    borderRadius: 30,
    boxShadow:
      '0 14px 28px rgba(85, 62, 180, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.32), inset 0 -1px 0 rgba(255, 255, 255, 0.12)' as any,
    display: 'block' as any,
    height: 184,
    overflow: 'hidden',
    width: '100%' as any,
  },
  content: {
    minHeight: 184,
  },
});
