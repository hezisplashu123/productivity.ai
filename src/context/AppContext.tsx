import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { getOrCreateDeviceId, storage } from '../utils/storage';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  profileId?: string;
}

interface AppContextType {
  user: AppUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateGuestUser = useCallback(async () => {
    try {
      const deviceId = await getOrCreateDeviceId();
      const email = `guest_${deviceId}@hezi.app`;

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

  return (
    <AppContext.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
