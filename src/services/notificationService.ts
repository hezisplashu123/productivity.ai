import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { lightColors as colors } from '../constants/colors';

// 1. Configure how notifications look when the app is OPEN
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // We will catch this and show our Custom HUD instead
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getCopyForArchetype = (archetype: string | null, type: 'start' | 'streak' | 'gap') => {
  const messages = {
    'night-owl': {
      start: ["🌑 The world is asleep. Your watch begins.", "Protocol: Midnight Oil engaged.", "Silence secured. Time to build."],
      streak: ["⚠️ Reactor cooling down.", "Don't let the silence go to waste.", "The night is slipping away."],
      gap: ["⚡ 30m Ghost Gap detected.", "Moonlight is for makers. Fill the gap."]
    },
    'early-bird': {
      start: ["🌅 Win the morning, win the day.", "Protocol: Sunrise Strike initiated.", "While they sleep, we build."],
      streak: ["⚠️ Momentum detected dropping.", "Keep the early streak alive.", "Don't break the morning chain."],
      gap: ["⚡ 45m Ghost Gap detected.", "Coffee is hot. Gap is open."]
    },
    'default': {
      start: ["⚡ Mission parameters set.", "Your tactical plan is ready.", "Objective clear. Engage."],
      streak: ["⚠️ Reactor Core critical.", "Secure the objective to maintain streak.", "System instability detected."],
      gap: ["⚡ Ghost Time detected.", "Reclaim lost minutes now."]
    }
  };

  // @ts-ignore
  const theme = messages[archetype || 'default'] || messages['default'];
  const options = theme[type] || theme['start'];
  return options[Math.floor(Math.random() * options.length)];
};

export const NotificationService = {
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.primary,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }
      
      // We don't strictly need the token if we are just scheduling local notifications
      return true;
    } else {
      console.log('Must use physical device for Push Notifications');
      return false;
    }
  },

  async scheduleFocusReminder(focusWindow: string) {
    try {
      // 1. Cancel existing to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 2. Logic for time
      let triggerHour = 9; 
      if (focusWindow === 'early-bird') triggerHour = 6; // 6 AM
      if (focusWindow === 'night-owl') triggerHour = 21; // 9 PM
      if (focusWindow === 'mid-day') triggerHour = 13;   // 1 PM

      const message = getCopyForArchetype(focusWindow, 'start');

      console.log(`🔔 Scheduling Reminder: "${message}" at ${triggerHour}:00`);

      // 3. Schedule with explicit trigger object
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚡ Tactical Alert",
          body: message,
          sound: true,
          data: { type: 'focus_start' },
          ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: triggerHour,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      // Catch and log error, but DO NOT CRASH THE APP
      console.warn("⚠️ Notification Schedule Failed (Non-Fatal):", error);
    }
  },

  async sendImmediateTest(archetype: string) {
    try {
      const message = getCopyForArchetype(archetype, 'gap');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚠️ Anomaly Detected",
          body: message,
          data: { type: 'ghost_gap' },
          sound: true,
          ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
        // Using 1 second delay is more stable on Android than 'null'
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1, 
          repeats: false 
        }, 
      });
    } catch (error) {
      console.warn("⚠️ Test Notification Failed:", error);
    }
  }
};