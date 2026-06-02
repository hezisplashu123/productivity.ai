import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { storage } from '../utils/storage';

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

  const hydrateUser = useCallback(async (firebaseUser: { email: string | null; uid: string; displayName: string | null }) => {
    if (!firebaseUser.email) {
      setUser(null);
      return;
    }

    try {
      // 1. Try to fetch existing user
      let fetchedUser = await apiService.getUserProfile(firebaseUser.email).catch(async (error: Error) => {
        if (error.message.includes('not found') || error.message.includes('404')) {
          // 2. If not found, sync (create) them
          return apiService.syncUser({
            email: firebaseUser.email!,
            socialId: firebaseUser.uid,
            name: firebaseUser.displayName || 'Player',
            provider: 'email',
          });
        }
        throw error;
      });

      // 3. Ensure we have the profile ID. If the backend didn't attach it, force it.
      let profileId = fetchedUser.profile?.id;
      if (!profileId) {
        const ensuredProfile = await apiService.ensureProfile(fetchedUser.id);
        profileId = ensuredProfile.id;
      }

      setUser({
        id: fetchedUser.id,
        email: fetchedUser.email,
        name: fetchedUser.name || 'Player',
        profileId: profileId,
      });

    } catch (error) {
      console.error('Failed to hydrate user:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser?.email) {
          setUser(null);
        } else {
          await hydrateUser(firebaseUser);
        }
      } catch (error) {
        console.error('Auth hydrate error:', error);
        await signOut(auth);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, [hydrateUser]);

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser?.email) await hydrateUser(firebaseUser);
  }, [hydrateUser]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    await storage.clearAllUserData();
  }, []);

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