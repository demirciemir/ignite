import * as Notifications from 'expo-notifications';

export async function scheduleStreakReminder(lastWorkoutDate: string | null) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.isStreakReminder) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  
  let reminderDate = new Date();
  reminderDate.setHours(20, 0, 0, 0);

  if (lastWorkoutDate === todayStr || now.getTime() > reminderDate.getTime()) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  const triggerSeconds = (reminderDate.getTime() - now.getTime()) / 1000;

  if (triggerSeconds > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔥 Don't lose your streak!",
        body: "You haven't completed a session today. Take a few minutes to keep your streak alive before midnight!",
        sound: true,
        data: { isStreakReminder: true }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      } as Notifications.NotificationTriggerInput
    });
  }
}
