import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const scheduleDailyReminder = async (time: string, enabled: boolean) => {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
  if (!enabled || Platform.OS === 'web') return;

  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return;

  const parts = time.split(':').map(Number);
  const hourValue = parts[0];
  const minuteValue = parts[1];
  const hour = Number.isFinite(hourValue) ? Number(hourValue) : 19;
  const minute = Number.isFinite(minuteValue) ? Number(minuteValue) : 0;

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
};
