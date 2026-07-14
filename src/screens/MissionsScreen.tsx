import { CheckCircle2, Circle, ListChecks } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { MotionReveal } from '@/components/MotionReveal';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/useTheme';
import { NavigationProps } from '@/navigation/navigation';
import { useMissionData } from '@/store/selectors';
import { spacing } from '@/theme/tokens';

export const MissionsScreen = (_props: NavigationProps) => {
  const missions = useMissionData();
  const { colors } = useTheme();

  return (
    <Screen>
      <MotionReveal distance={5} duration={360} style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="headline">Misiones</AppText>
          <AppText variant="muted">Pequeñas metas para sostener el hábito sin presión rara.</AppText>
        </View>
        <ListChecks size={30} color={colors.primaryDark} />
      </MotionReveal>
      {missions.map((mission, index) => {
        const done = mission.status !== 'active';
        return (
          <Card key={mission.id} motionDelay={80 + index * 55}>
            <View style={styles.row}>
              {done ? <CheckCircle2 size={24} color={colors.primaryDark} /> : <Circle size={24} color={colors.textMuted} />}
              <View style={styles.flex}>
                <AppText variant="title">{mission.title}</AppText>
                <AppText variant="muted">{mission.description}</AppText>
              </View>
              <AppText weight="800">+{mission.rewardXp} XP</AppText>
            </View>
            <ProgressBar value={mission.progress / mission.target} color={done ? colors.primary : colors.rest} delay={150 + index * 55} />
            <AppText variant="muted">
              {mission.progress}/{mission.target} · {mission.cadence === 'daily' ? 'diaria' : 'semanal'}
            </AppText>
          </Card>
        );
      })}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
});
