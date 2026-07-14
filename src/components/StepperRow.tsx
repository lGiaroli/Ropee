import { Minus, Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { MotionNumber } from '@/components/MotionNumber';
import { useTheme } from '@/components/useTheme';
import { spacing } from '@/theme/tokens';

interface StepperRowProps {
  label: string;
  value: number;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export const StepperRow = ({ label, value, suffix, step = 1, min = 0, max = 999, onChange }: StepperRowProps) => {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <AppText weight="700">{label}</AppText>
        <MotionNumber
          value={value}
          suffix={suffix ? ` ${suffix}` : ''}
          duration={240}
          variant="muted"
        />
      </View>
      <View style={styles.controls}>
        <IconButton
          label={`Bajar ${label}`}
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - step))}
          icon={<Minus size={20} color={colors.text} />}
        />
        <IconButton
          label={`Subir ${label}`}
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + step))}
          icon={<Plus size={20} color={colors.text} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
