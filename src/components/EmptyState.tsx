import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { spacing } from '@/theme/tokens';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body: string;
}

export const EmptyState = ({ icon, title, body }: EmptyStateProps) => (
  <Card>
    <View style={styles.wrap}>
      {icon}
      <AppText variant="title">{title}</AppText>
      <AppText variant="muted" style={styles.center}>
        {body}
      </AppText>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  center: {
    textAlign: 'center',
  },
});
