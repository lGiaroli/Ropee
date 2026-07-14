import { CalendarDays } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/useTheme';
import { NavigationProps } from '@/navigation/navigation';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/tokens';
import { formatMinutes } from '@/utils/format';

export const HistoryScreen = (_props: NavigationProps) => {
  const sessions = useAppStore((state) => state.sessions);
  const { colors } = useTheme();

  return (
    <Screen>
      <MotionReveal distance={5} duration={360}>
      <View>
        <AppText variant="headline">Historial</AppText>
        <AppText variant="muted">Tus sesiones guardadas offline.</AppText>
      </View>
      </MotionReveal>
      {sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={34} color={colors.primaryDark} />}
          title="Sin entrenamientos todavía"
          body="Cuando completes o abandones una sesión, aparece acá con XP, tiempo y estimaciones."
        />
      ) : null}
      {sessions.map((session, index) => (
        <Card key={session.id} motionDelay={80 + Math.min(index, 8) * 45}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <AppText variant="title">{session.routineName}</AppText>
              <AppText variant="muted">{new Date(session.completedAt).toLocaleString()}</AppText>
            </View>
            <AppText weight="800" style={{ color: session.status === 'completed' ? colors.primaryDark : colors.warning }}>
              {session.status === 'completed' ? 'Completo' : 'Abandonado'}
            </AppText>
          </View>
          <View style={styles.metaRow}>
            <AppText variant="muted">{formatMinutes(session.totalDuration)}</AppText>
            <AppText variant="muted">{formatMinutes(session.jumpDuration)} saltando</AppText>
            <AppText variant="muted">{session.xpEarned} XP</AppText>
          </View>
        </Card>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
