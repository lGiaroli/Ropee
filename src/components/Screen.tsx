import { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/components/useTheme';
import { spacing } from '@/theme/tokens';

interface ScreenProps {
  contentStyle?: StyleProp<ViewStyle>;
  onScrollBeginDrag?: () => void;
  onTouchStart?: () => void;
  scroll?: boolean;
}

export const Screen = ({
  children,
  contentStyle,
  onScrollBeginDrag,
  onTouchStart,
  scroll = true,
}: PropsWithChildren<ScreenProps>) => {
  const { colors } = useTheme();
  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View onTouchStart={onTouchStart} style={[styles.content, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        onScrollBeginDrag={onScrollBeginDrag}
        onTouchStart={onTouchStart}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 92,
  },
});
