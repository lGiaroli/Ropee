import { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

interface LiquidGlassPanelProps extends PropsWithChildren {
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const LiquidGlassPanel = ({ children, contentStyle, style }: LiquidGlassPanelProps) => (
  <View style={[style, contentStyle]}>
    {children}
  </View>
);
