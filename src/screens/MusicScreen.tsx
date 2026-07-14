import { Music2, Radio } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { MotionPressable } from '@/components/MotionPressable';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/useTheme';
import { bpmBands } from '@/data/gamification';
import { NavigationProps } from '@/navigation/navigation';
import { radius, spacing } from '@/theme/tokens';

export const MusicScreen = (_props: NavigationProps) => {
  const [selected, setSelected] = useState('medium');
  const { colors } = useTheme();

  return (
    <Screen>
      <MotionReveal distance={5} duration={360} style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="headline">Música sugerida</AppText>
          <AppText variant="muted">Preparado para conectar Spotify o playlists por BPM más adelante.</AppText>
        </View>
        <Music2 size={30} color={colors.primaryDark} />
      </MotionReveal>

      {bpmBands.map((band, index) => {
        const active = band.id === selected;
        return (
          <MotionPressable key={band.id} accessibilityRole="button" onPress={() => setSelected(band.id)} pressedScale={0.985}>
            <Card motionDelay={70 + index * 55} style={{ borderColor: active ? colors.primary : colors.border }}>
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: active ? colors.primary : colors.surfaceStrong }]}>
                  <Radio size={22} color={active ? '#FFFFFF' : colors.textMuted} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="title">{band.label}</AppText>
                  <AppText weight="800">{band.bpm}</AppText>
                  <AppText variant="muted">{band.description}</AppText>
                </View>
              </View>
            </Card>
          </MotionPressable>
        );
      })}

      <Card motionDelay={260}>
        <AppText variant="title">Arquitectura futura</AppText>
        <AppText variant="muted">
          La app separa la selección de ritmo de la reproducción. Una integración futura puede conectar proveedor, playlist,
          BPM y rutina sin tocar la lógica del timer.
        </AppText>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
});
