import {
  Bell,
  Clock3,
  Database,
  Gauge,
  Mic2,
  Moon,
  RotateCcw,
  Shield,
  Volume2,
  VolumeX,
  Waves,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Alert, Animated, Platform, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { MotionPressable } from '@/components/MotionPressable';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/useTheme';
import { JUMP_CADENCE_OPTIONS, normalizeJumpCadenceSpm } from '@/features/progress/stats';
import { NavigationProps } from '@/navigation/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { scheduleDailyReminder } from '@/services/notificationService';
import { useAppStore } from '@/store/useAppStore';
import { normalizeReminderTime } from '@/utils/reminder';

interface SettingsSectionProps {
  children: ReactNode;
  delay: number;
  title: string;
}

interface SettingsToggleRowProps {
  description: string;
  icon: ReactNode;
  isLast?: boolean;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}

interface SettingsInfoRowProps {
  accessory?: ReactNode;
  description: string;
  icon: ReactNode;
  isLast?: boolean;
  label: string;
}

export const SettingsScreen = (_props: NavigationProps) => {
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const resetLocalData = useAppStore((state) => state.resetLocalData);
  const { colors } = useTheme();
  const jumpCadenceSpm = normalizeJumpCadenceSpm(profile.jumpCadenceSpm);
  const [reminderTimeDraft, setReminderTimeDraft] = useState(profile.reminderTime);

  const updateReminder = async (time: string, enabled = profile.remindersEnabled) => {
    const reminderTime = normalizeReminderTime(time);
    setReminderTimeDraft(reminderTime);
    updateProfile({ reminderTime, remindersEnabled: enabled });
    await scheduleDailyReminder(reminderTime, enabled);
  };

  const confirmReset = () => {
    const message = 'Se borrarán tu progreso, rutinas y configuración de este dispositivo.';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`¿Reiniciar todos los datos?\n\n${message}`)) resetLocalData();
      return;
    }

    Alert.alert('¿Reiniciar todos los datos?', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reiniciar', style: 'destructive', onPress: resetLocalData },
    ]);
  };

  return (
    <Screen contentStyle={styles.screen}>
      <MotionReveal distance={5} duration={360} style={styles.header}>
        <AppText weight="800" style={styles.title}>
          Configuración
        </AppText>
        <AppText weight="700" style={styles.subtitle}>
          Personalizá tu experiencia
        </AppText>
      </MotionReveal>

      <SettingsSection title="Entrenamiento" delay={70}>
        <SettingsCadenceRow
          icon={<Gauge size={21} color="#7657FF" strokeWidth={2.7} />}
          label="Saltos por minuto"
          description="Ajusta saltos y kcal estimadas"
          value={jumpCadenceSpm}
          onValueChange={(nextCadence) => updateProfile({ jumpCadenceSpm: nextCadence })}
        />
        <SettingsToggleRow
          icon={<Volume2 size={21} color="#7657FF" strokeWidth={2.7} />}
          label="Sonido"
          description="Cues durante el timer"
          value={profile.soundEnabled}
          onValueChange={(soundEnabled) => updateProfile({ soundEnabled })}
        />
        <SettingsToggleRow
          icon={<Mic2 size={21} color="#7657FF" strokeWidth={2.7} />}
          label="Voz"
          description="Indicaciones habladas"
          value={profile.voiceEnabled}
          onValueChange={(voiceEnabled) => updateProfile({ voiceEnabled })}
        />
        <SettingsToggleRow
          icon={<Waves size={21} color="#7657FF" strokeWidth={2.7} />}
          label="Vibración"
          description="Avisos hápticos al cambiar de fase"
          value={profile.hapticsEnabled}
          onValueChange={(hapticsEnabled) => updateProfile({ hapticsEnabled })}
        />
        <SettingsToggleRow
          icon={<VolumeX size={21} color="#7657FF" strokeWidth={2.7} />}
          label="Modo silencioso"
          description="Apaga voz y señales del timer"
          value={profile.silentMode}
          onValueChange={(silentMode) => updateProfile({ silentMode })}
        />
        <SettingsToggleRow
          icon={<Moon size={21} color="#7657FF" strokeWidth={2.7} />}
          label="Solo vibración"
          description="Entrená sin sonido"
          value={profile.vibrationOnly}
          onValueChange={(vibrationOnly) => updateProfile({ vibrationOnly })}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Recordatorios" delay={140}>
        <SettingsToggleRow
          icon={<Bell size={21} color="#7657FF" strokeWidth={2.7} />}
          label="Recordatorio diario"
          description="Un aviso al día, sin spam"
          value={profile.remindersEnabled}
          onValueChange={(remindersEnabled) => updateReminder(profile.reminderTime, remindersEnabled)}
        />
        <SettingsInfoRow
          icon={<Clock3 size={21} color="#7657FF" strokeWidth={2.7} />}
          label="Horario"
          description="Aviso diario"
          accessory={
            <TextInput
              accessibilityLabel="Horario de recordatorio"
              value={reminderTimeDraft}
              onChangeText={setReminderTimeDraft}
              onEndEditing={({ nativeEvent }) => void updateReminder(nativeEvent.text)}
              maxLength={5}
              placeholder="19:00"
              placeholderTextColor="#9A91B5"
              style={styles.timeInput}
            />
          }
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Más" delay={210}>
        <SettingsInfoRow
          icon={<Database size={21} color="#7657FF" strokeWidth={2.7} />}
          label="Datos locales"
          description="Todo se guarda en este dispositivo"
        />
        <SettingsInfoRow
          icon={<Shield size={21} color="#7657FF" strokeWidth={2.7} />}
          label="Privacidad"
          description="Ropee funciona offline en esta versión"
          accessory={
            <View style={styles.statusChip}>
              <AppText weight="800" style={styles.statusChipText}>
                Local
              </AppText>
            </View>
          }
          isLast
        />
      </SettingsSection>

      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel="Reiniciar datos locales"
        onPress={confirmReset}
        pressedScale={0.985}
        style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.76 : 1, borderColor: colors.danger }]}
      >
        <RotateCcw size={18} color={colors.danger} strokeWidth={2.8} />
        <AppText weight="800" style={[styles.resetButtonText, { color: colors.danger }]}>
          Reiniciar datos
        </AppText>
      </MotionPressable>
    </Screen>
  );
};

const SettingsSection = ({ children, title, delay }: SettingsSectionProps) => (
  <MotionReveal delay={delay} distance={6} style={styles.section}>
    <AppText weight="800" style={styles.sectionTitle}>
      {title}
    </AppText>
    <View style={styles.sectionCard}>{children}</View>
  </MotionReveal>
);

const SettingsCadenceRow = ({
  description,
  icon,
  label,
  onValueChange,
  value,
}: {
  description: string;
  icon: ReactNode;
  label: string;
  onValueChange: (value: number) => void;
  value: number;
}) => (
  <View style={styles.cadenceRow}>
    <View style={styles.iconBox}>{icon}</View>
    <View style={styles.cadenceContent}>
      <View style={styles.cadenceHeader}>
        <View style={styles.rowCopy}>
          <AppText weight="800" style={styles.rowTitle}>
            {label}
          </AppText>
          <AppText weight="700" style={styles.rowDescription} numberOfLines={1}>
            {description}
          </AppText>
        </View>
        <View style={styles.cadenceValueChip}>
          <AppText weight="800" style={styles.cadenceValueText}>
            {value} spm
          </AppText>
        </View>
      </View>

      <View style={styles.cadenceOptions}>
        {JUMP_CADENCE_OPTIONS.map((option) => {
          const selected = option === value;
          return (
            <MotionPressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option} saltos por minuto`}
              containerStyle={styles.cadenceOptionMotion}
              key={option}
              onPress={() => onValueChange(option)}
              pressedScale={0.94}
              style={({ pressed }) => [
                styles.cadenceOption,
                selected ? styles.cadenceOptionSelected : null,
                pressed ? styles.cadenceOptionPressed : null,
              ]}
            >
              <AppText weight="800" style={[styles.cadenceOptionText, selected ? styles.cadenceOptionTextSelected : null]}>
                {option}
              </AppText>
            </MotionPressable>
          );
        })}
      </View>
    </View>
    <View style={styles.separator} />
  </View>
);

const SettingsToggleRow = ({
  description,
  icon,
  isLast = false,
  label,
  onValueChange,
  value,
}: SettingsToggleRowProps) => {
  return (
    <MotionPressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      pressedScale={0.99}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.iconBox}>{icon}</View>
      <View style={styles.rowCopy}>
        <AppText weight="800" style={styles.rowTitle}>
          {label}
        </AppText>
        <AppText weight="700" style={styles.rowDescription} numberOfLines={1}>
          {description}
        </AppText>
      </View>
      <SettingsSwitch value={value} />
      {!isLast ? <View style={styles.separator} /> : null}
    </MotionPressable>
  );
};

const SettingsSwitch = ({ value }: { value: boolean }) => {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(value ? 1 : 0);
      return undefined;
    }
    const animation = Animated.spring(progress, {
      toValue: value ? 1 : 0,
      damping: 17,
      stiffness: 260,
      mass: 0.55,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion, value]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const backgroundColor = progress.interpolate({ inputRange: [0, 1], outputRange: ['#EEE9F8', '#7657FF'] });
  const thumbColor = progress.interpolate({ inputRange: [0, 1], outputRange: ['#B9B0CC', '#FFFFFF'] });

  return (
    <Animated.View style={[styles.customSwitch, value ? styles.customSwitchOn : undefined, { backgroundColor }]}> 
      <Animated.View
        style={[
          styles.customSwitchThumb,
          value ? styles.customSwitchThumbOn : undefined,
          { backgroundColor: thumbColor, transform: [{ translateX }] },
        ]}
      />
    </Animated.View>
  );
};

const SettingsInfoRow = ({ accessory, description, icon, isLast = false, label }: SettingsInfoRowProps) => (
  <View style={styles.row}>
    <View style={styles.iconBox}>{icon}</View>
    <View style={styles.rowCopy}>
      <AppText weight="800" style={styles.rowTitle}>
        {label}
      </AppText>
      <AppText weight="700" style={styles.rowDescription} numberOfLines={1}>
        {description}
      </AppText>
    </View>
    {accessory}
    {!isLast ? <View style={styles.separator} /> : null}
  </View>
);

const styles = StyleSheet.create({
  screen: {
    gap: 18,
    paddingTop: 20,
  },
  header: {
    gap: 5,
    paddingHorizontal: 4,
  },
  title: {
    color: '#151232',
    fontSize: 31,
    lineHeight: 37,
  },
  subtitle: {
    color: '#6A6388',
    fontSize: 17,
    lineHeight: 22,
  },
  section: {
    gap: 9,
  },
  sectionTitle: {
    color: '#7657FF',
    fontSize: 16,
    lineHeight: 20,
    paddingHorizontal: 2,
  },
  sectionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE8F7',
    shadowColor: '#6F5BFF',
    shadowOpacity: 0.055,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  cadenceRow: {
    minHeight: 108,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 13,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  cadenceContent: {
    flex: 1,
    minWidth: 0,
    gap: 9,
  },
  cadenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cadenceValueChip: {
    minHeight: 31,
    minWidth: 78,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    backgroundColor: '#F4EEFF',
  },
  cadenceValueText: {
    color: '#7657FF',
    fontSize: 12,
    lineHeight: 15,
  },
  cadenceOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  cadenceOption: {
    flex: 1,
    minHeight: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F1FF',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cadenceOptionMotion: {
    flex: 1,
    minWidth: 0,
  },
  cadenceOptionSelected: {
    backgroundColor: '#7657FF',
    borderColor: '#7657FF',
  },
  cadenceOptionPressed: {
    opacity: 0.76,
  },
  cadenceOptionText: {
    color: '#81789A',
    fontSize: 10,
    lineHeight: 13,
  },
  cadenceOptionTextSelected: {
    color: '#FFFFFF',
  },
  rowPressed: {
    backgroundColor: '#FBF9FF',
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1ECFF',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowTitle: {
    color: '#17142E',
    fontSize: 15,
    lineHeight: 19,
  },
  rowDescription: {
    color: '#6F6887',
    fontSize: 12,
    lineHeight: 15,
  },
  customSwitch: {
    width: 47,
    height: 27,
    borderRadius: 999,
    padding: 3,
    justifyContent: 'center',
  },
  customSwitchOn: {
    alignItems: 'flex-end',
    backgroundColor: '#7657FF',
    shadowColor: '#7657FF',
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  customSwitchOff: {
    alignItems: 'flex-start',
    backgroundColor: '#EEE9F8',
  },
  customSwitchThumb: {
    width: 21,
    height: 21,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  customSwitchThumbOn: {
    shadowColor: '#4F3DDA',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  customSwitchThumbOff: {
    backgroundColor: '#B9B0CC',
  },
  separator: {
    position: 'absolute',
    left: 74,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: '#EEE9F6',
  },
  timeInput: {
    minWidth: 74,
    height: 34,
    borderRadius: 12,
    paddingHorizontal: 10,
    color: '#7657FF',
    backgroundColor: '#F4EEFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusChip: {
    minHeight: 31,
    minWidth: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#F4EEFF',
  },
  statusChipText: {
    color: '#7657FF',
    fontSize: 13,
    lineHeight: 16,
  },
  resetButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#FFF3F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 2,
  },
  resetButtonText: {
    fontSize: 14,
    lineHeight: 18,
  },
});
