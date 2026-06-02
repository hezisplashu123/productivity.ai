import AsyncStorage from '@react-native-async-storage/async-storage';

const SWIPE_TUTORIAL_KEY = '@swipe_tutorial_complete';
const ACTIVE_CATEGORY_KEY = '@active_category_id';

export const storage = {
  async isSwipeTutorialComplete(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(SWIPE_TUTORIAL_KEY)) === 'true';
    } catch {
      return false;
    }
  },

  async setSwipeTutorialComplete(complete: boolean): Promise<void> {
    await AsyncStorage.setItem(SWIPE_TUTORIAL_KEY, complete ? 'true' : 'false');
  },

  async setActiveCategory(categoryId: string): Promise<void> {
    await AsyncStorage.setItem(ACTIVE_CATEGORY_KEY, categoryId);
  },

  async getActiveCategory(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_CATEGORY_KEY);
    } catch {
      return null;
    }
  },

  async clearAllUserData(): Promise<void> {
    await AsyncStorage.multiRemove([SWIPE_TUTORIAL_KEY, ACTIVE_CATEGORY_KEY]);
  },
};
