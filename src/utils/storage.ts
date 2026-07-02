import AsyncStorage from '@react-native-async-storage/async-storage';

const SWIPE_TUTORIAL_KEY = '@swipe_tutorial_complete';
const ACTIVE_CATEGORY_KEY = '@active_category_id';
const DEVICE_ID_KEY = '@device_id';
const GAMEMODE_KEY = '@gamemode_selection';
const PLAYER_COUNT_KEY = '@player_count';
const AGE_RANGE_KEY = '@age_range';

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const deviceId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

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

  async setGamemode(mode: 'friendship' | 'relationship' | 'family'): Promise<void> {
    await AsyncStorage.setItem(GAMEMODE_KEY, mode);
  },

  async getGamemode(): Promise<'friendship' | 'relationship' | 'family'> {
    try {
      const mode = await AsyncStorage.getItem(GAMEMODE_KEY);
      if (mode === 'relationship' || mode === 'family') return mode;
      return 'friendship'; // Default
    } catch {
      return 'friendship';
    }
  },

  async getPlayerCount(): Promise<number | null> {
    try {
      const count = await AsyncStorage.getItem(PLAYER_COUNT_KEY);
      return count ? parseInt(count, 10) : null;
    } catch {
      return null;
    }
  },

  async setPlayerCount(count: number): Promise<void> {
    await AsyncStorage.setItem(PLAYER_COUNT_KEY, count.toString());
  },

  async getAgeRange(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AGE_RANGE_KEY);
    } catch {
      return null;
    }
  },

  async setAgeRange(ageRange: string): Promise<void> {
    await AsyncStorage.setItem(AGE_RANGE_KEY, ageRange);
  },

  async getCachedQueue(gamemode: string, categoryId: string): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(`@queue_${gamemode}_${categoryId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveCachedQueue(gamemode: string, categoryId: string, queue: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`@queue_${gamemode}_${categoryId}`, JSON.stringify(queue));
    } catch (e) {
      console.warn("Failed to save queue to storage", e);
    }
  },

  async clearCachedQueue(gamemode: string, categoryId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@queue_${gamemode}_${categoryId}`);
    } catch (e) {
      console.warn("Failed to clear queue", e);
    }
  },

  async clearAllUserData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      console.warn("Failed to clear storage", e);
    }
  },
};