import { ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { MotionPressable } from '@/components/MotionPressable';
import { useTheme } from '@/components/useTheme';
import { spacing } from '@/theme/tokens';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: ReactNode;
}

export const ToggleRow = ({ label, description, value, onValueChange, icon }: ToggleRowProps) => {
  const { colors } = useTheme();
  return (
    <MotionPressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      pressedScale={0.985}
      style={styles.row}
    >
      {icon}
      <View style={styles.copy}>
        <AppText weight="700">{label}</AppText>
        {description ? <AppText variant="muted">{description}</AppText> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceStrong, true: colors.primary }}
        thumbColor={value ? colors.primaryDark : colors.textMuted}
      />
    </MotionPressable>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
});
