import AsyncStorage from '@react-native-async-storage/async-storage';

const HABIT_PROFILER_COMPLETE_KEY = '@habit_profiler_complete';
const ONBOARDING_COMPLETE_KEY = '@onboarding_complete';
const ONBOARDING_DATA_KEY = '@onboarding_data';
const HABIT_PROFILE_DATA_KEY = '@habit_profile_data';

export const storage = {
  // Check if habit profiler is complete
  async isHabitProfilerComplete(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(HABIT_PROFILER_COMPLETE_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error reading habit profiler status:', error);
      return false;
    }
  },

  // Mark habit profiler as complete
  async setHabitProfilerComplete(complete: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(HABIT_PROFILER_COMPLETE_KEY, complete ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving habit profiler status:', error);
    }
  },

  // Check if onboarding is complete
  async isOnboardingComplete(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error reading onboarding status:', error);
      return false;
    }
  },

  // Mark onboarding as complete
  async setOnboardingComplete(complete: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, complete ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  },

  // Save habit profile data
  async saveHabitProfileData(data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(HABIT_PROFILE_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving habit profile data:', error);
    }
  },

  // Get habit profile data
  async getHabitProfileData(): Promise<any | null> {
    try {
      const value = await AsyncStorage.getItem(HABIT_PROFILE_DATA_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading habit profile data:', error);
      return null;
    }
  },

  // Save onboarding data
  async saveOnboardingData(data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  },

  // Get onboarding data
  async getOnboardingData(): Promise<any | null> {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading onboarding data:', error);
      return null;
    }
  },

  // --- NEW: SECURITY METHOD ---
  // Completely wipes user-specific data from the device
  async clearAllUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        HABIT_PROFILER_COMPLETE_KEY,
        ONBOARDING_COMPLETE_KEY,
        ONBOARDING_DATA_KEY,
        HABIT_PROFILE_DATA_KEY
      ]);
      console.log('🔒 Secure storage cleared');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }
};