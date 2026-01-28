import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { lightColors as colors } from '../constants/colors';

// 1. Configure how notifications look when the app is OPEN
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getCopyForArchetype = (archetype: string | null, type: 'start' | 'streak' | 'gap' | 'rescue') => {
  const messages = {
    'night-owl': {
      start: ["🌑 The world is asleep. Your watch begins.", "Protocol: Midnight Oil engaged.", "Silence secured. Time to build."],
      streak: ["⚠️ Reactor cooling down.", "Don't let the silence go to waste.", "The night is slipping away."],
      gap: ["⚡ 30m Ghost Gap detected.", "Moonlight is for makers. Fill the gap."],
      rescue: ["⚠️ STREAK CRITICAL. 2 hours until midnight.", "Do not break the chain. One task. Now.", "The night is fading. Save your progress."]
    },
    'early-bird': {
      start: ["🌅 Win the morning, win the day.", "Protocol: Sunrise Strike initiated.", "While they sleep, we build."],
      streak: ["⚠️ Momentum detected dropping.", "Keep the early streak alive.", "Don't break the morning chain."],
      gap: ["⚡ 45m Ghost Gap detected.", "Coffee is hot. Gap is open."],
      rescue: ["⚠️ DAY ENDING. Streak at risk.", "You won the morning, don't lose the night.", "Secure the W before sleep."]
    },
    'default': {
      start: ["⚡ Mission parameters set.", "Your tactical plan is ready.", "Objective clear. Engage."],
      streak: ["⚠️ Reactor Core critical.", "Secure the objective to maintain streak.", "System instability detected."],
      gap: ["⚡ Ghost Time detected.", "Reclaim lost minutes now."],
      rescue: ["🚨 REACTOR CRITICAL. Streak expires in 3 hours.", "Don't let the zero win.", "One small task saves the streak."]
    }
  };

  // @ts-ignore
  const theme = messages[archetype || 'default'] || messages['default'];
  const options = theme[type] || theme['start'];
  return options[Math.floor(Math.random() * options.length)];
};

export const NotificationService = {
  async registerForPushNotificationsAsync() {
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
        return false;
      }
      return true;
    }
    return false;
  },

  async scheduleFocusReminder(focusWindow: string) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      let triggerHour = 9; 
      if (focusWindow === 'early-bird') triggerHour = 6;
      if (focusWindow === 'night-owl') triggerHour = 21;
      if (focusWindow === 'mid-day') triggerHour = 13;

      const message = getCopyForArchetype(focusWindow, 'start');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚡ Tactical Alert",
          body: message,
          sound: true,
          data: { type: 'focus_start' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: triggerHour,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.warn("⚠️ Notification Schedule Failed:", error);
    }
  },

  // --- NEW: STREAK RESCUE PROTOCOL ---
  async scheduleStreakRescue(archetype: string = 'default') {
    try {
      // 1. Check if we already have a rescue notification
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const hasRescue = scheduled.some(n => n.content.data?.type === 'streak_rescue');
      if (hasRescue) return;

      const message = getCopyForArchetype(archetype, 'rescue');

      // 2. Schedule for 9:00 PM (21:00) Tonight
      const now = new Date();
      const triggerDate = new Date();
      triggerDate.setHours(21, 0, 0, 0);

      // If it's already past 9 PM, schedule for 1 hour from now (Emergency mode)
      if (now.getHours() >= 21) {
        triggerDate.setTime(now.getTime() + (60 * 60 * 1000)); 
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚠️ STREAK RESCUE",
          body: message,
          sound: true,
          badge: 1,
          data: { type: 'streak_rescue' },
        },
        trigger: {
            // @ts-ignore - Expo types can be finicky with Date objects vs Components
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate, 
        },
      });
      console.log("🛡️ Streak Rescue Scheduled for:", triggerDate.toLocaleTimeString());
    } catch (error) {
      console.warn("⚠️ Rescue Schedule Failed:", error);
    }
  },

  async cancelStreakRescue() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const rescueNotif = scheduled.find(n => n.content.data?.type === 'streak_rescue');
    if (rescueNotif) {
      await Notifications.cancelScheduledNotificationAsync(rescueNotif.identifier);
      console.log("✅ Streak Saved. Rescue notification cancelled.");
    }
  },

  async sendImmediateTest(archetype: string) {
    try {
      const message = getCopyForArchetype(archetype, 'rescue'); // Changed to rescue for testing
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚠️ STREAK RESCUE TEST",
          body: message,
          data: { type: 'streak_rescue' },
          sound: true,
        },
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