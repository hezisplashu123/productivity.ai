import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { getOrCreateDeviceId, storage } from '../utils/storage';
import { palettes, Theme } from '../constants/colors';
import { AppUser, Gamemode } from '../types';

interface AppContextType {
  user: AppUser | null;
  isLoading: boolean;
  gamemode: Gamemode;
  theme: Theme;
  playerCount: number | null;
  setGamemode: (mode: Gamemode) => void;
  setPlayerCount: (count: number) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gamemode, setGamemodeState] = useState<Gamemode>('friendship');
  const [playerCount, setPlayerCountState] = useState<number | null>(null);

  const hydrateGuestUser = useCallback(async () => {
    try {
      const savedMode = await storage.getGamemode();
      const savedPlayerCount = await storage.getPlayerCount();
      const savedAgeRange = await storage.getAgeRange();

      const ADULT_AGE_RANGES = ['18-21', '22-25', '26-29', '30-39', '40-49', '50+'];
      let activeMode = savedMode;
      if (activeMode === 'relationship' && !ADULT_AGE_RANGES.includes(savedAgeRange ?? '')) {
        activeMode = 'friendship';
        await storage.setGamemode('friendship');
      }
      setGamemodeState(activeMode);
      setPlayerCountState(savedPlayerCount);

      const deviceId = await getOrCreateDeviceId();
      const email = `guest_${deviceId}@hezi.app`;

      try {
        const syncedUser = await apiService.syncUser({
          email,
          socialId: deviceId,
          name: 'Guest',
          provider: 'guest',
        });

        const profileId = syncedUser.profile?.id ?? syncedUser.profileId;

        // If they have an ageRange saved locally but the backend doesn't have it, ensure it.
        if (savedAgeRange && syncedUser.profile?.ageRange !== savedAgeRange) {
          await apiService.ensureProfile(syncedUser.id, undefined, savedAgeRange);
        }

        setUser({
          id: syncedUser.id,
          email: syncedUser.email,
          name: syncedUser.name || 'Guest',
          profileId,
          ageRange: savedAgeRange || undefined,
        });
      } catch (apiError) {
        console.warn("Backend unavailable, using local fallback profile.", apiError);
        setUser({
          id: deviceId,
          email,
          name: 'Guest',
          ageRange: savedAgeRange || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to hydrate guest user:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    hydrateGuestUser().finally(() => setIsLoading(false));
  }, [hydrateGuestUser]);

  const refreshUser = useCallback(async () => {
    await hydrateGuestUser();
  }, [hydrateGuestUser]);

  const logout = useCallback(async () => {
    setUser(null);
    await storage.clearAllUserData();
    await hydrateGuestUser();
  }, [hydrateGuestUser]);

  const setGamemode = (mode: Gamemode) => {
    setGamemodeState(mode);
    storage.setGamemode(mode);
  };

  const setPlayerCount = (count: number) => {
    setPlayerCountState(count);
    storage.setPlayerCount(count);
  };

  const theme = palettes[gamemode] || palettes.friendship;

  return (
    <AppContext.Provider value={{ user, isLoading, gamemode, theme, playerCount, setGamemode, setPlayerCount, logout, refreshUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};