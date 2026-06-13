import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { getOrCreateDeviceId, storage } from '../utils/storage';
import { palettes, Theme } from '../constants/colors';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  profileId?: string;
}

export type Gamemode = 'friendship' | 'relationship' | 'family';

interface AppContextType {
  user: AppUser | null;
  isLoading: boolean;
  gamemode: Gamemode;
  theme: Theme;
  setGamemode: (mode: Gamemode) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gamemode, setGamemodeState] = useState<Gamemode>('friendship');

  const hydrateGuestUser = useCallback(async () => {
    try {
      const savedMode = await storage.getGamemode();
      setGamemodeState(savedMode);

      const deviceId = await getOrCreateDeviceId();
      const email = `guest_${deviceId}@hezi.app`;

      try {
        // Try to connect to backend
        const syncedUser = await apiService.syncUser({
          email,
          socialId: deviceId,
          name: 'Guest',
          provider: 'guest',
        });

        const profileId = syncedUser.profile?.id ?? syncedUser.profileId;

        setUser({
          id: syncedUser.id,
          email: syncedUser.email,
          name: syncedUser.name || 'Guest',
          profileId,
        });
      } catch (apiError) {
        console.warn("Backend unavailable, using local fallback profile.", apiError);
        // If backend is sleeping/offline, log them in locally anyway!
        setUser({
          id: deviceId,
          email,
          name: 'Guest'
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

  const theme = palettes[gamemode] || palettes.friendship;

  return (
    <AppContext.Provider value={{ user, isLoading, gamemode, theme, setGamemode, logout, refreshUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};