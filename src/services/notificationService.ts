import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { normalizeReminderTime } from '@/utils/reminder';

export const scheduleDailyReminder = async (time: string, enabled: boolean) => {
  if (Platform.OS === 'web') return 'unsupported' as const;

  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
  if (!enabled) return 'disabled' as const;

  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return 'denied' as const;

  const [hour = 19, minute = 0] = normalizeReminderTime(time).split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ropee',
      body: 'Hoy toca moverse. Mejor 10 minutos reales que 0 minutos perfectos.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return 'scheduled' as const;
};
