import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Goal, Task } from '../types';
import { apiService } from '../services/api';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notificationService';
import { TacticalHUD } from '../components/TacticalHUD';
import * as Haptics from 'expo-haptics';
import { auth } from '../config/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import { storage } from '../utils/storage';
import { Platform, Alert } from 'react-native';

// Safe Import Pattern for RevenueCat
let Purchases: any = null;
let LOG_LEVEL: any;

try {
  // Only attempt to require if not in Expo Go (standard client)
  // or catch the error if the native module isn't linked
  const rc = require('react-native-purchases');
  Purchases = rc.default;
  LOG_LEVEL = rc.LOG_LEVEL;
} catch (e) {
  console.log("ℹ️ RevenueCat native module not found. This is expected in Expo Go.");
}

// ⚠️ MAKE SURE THIS IS YOUR LIVE PUBLIC KEY FROM REVENUECAT DASHBOARD
const REVENUECAT_API_KEY = 'appl_OoFcMevmZzPrvmwvLjBGRxALoWf'; 
const ENTITLEMENT_ID = 'Prodai Pro';

interface User {
  id: string;
  email: string;
  name: string;
  onboardingData?: any;
  currentStreak?: number;
  lastActiveDate?: string;
}

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  isPro: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>; 
  goals: Goal[];
  tasks: Task[];
  currentGoal: Goal | null;
  pendingRequestsCount: number;
  addGoal: (title: string, type?: string, targetDate?: Date, dailyMinutes?: number) => Promise<Goal | null>; 
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  archiveGoal: (goalId: string) => void;
  addTasks: (goalId: string, tasks: any[]) => Promise<void>;
  overrideTasks: (goalId: string, tasks: any[]) => void;
  completeTask: (taskId: string) => void;
  toggleSubTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  reportTaskIssue: (taskId: string, feedback: string) => Promise<void>; 
  setCurrentGoal: (goal: Goal | null) => void;
  rateProductivity: (taskId: string, rating: number) => void;
  refreshData: () => void;
  saveOnboarding: (data: any) => Promise<void>;
  generatePlan: (goalText: string, clarification?: string, dailyMinutes?: number) => Promise<any | null>;
  generateDailyPlan: (goalTitle: string, dayNumber: number, totalDays: number, dailyMinutes: number) => Promise<any>;
  getAiQuestion: (goalText: string) => Promise<string | null>;
  analyzeGoal: (goal: string, clarification?: string, question?: string) => Promise<any>; 
  triggerTestNotification: () => void;
  restorePurchases: () => Promise<void>;
  purchasePackage: (pack: any) => Promise<void>;
  packages: any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  
  // Subscription State
  const [isPro, setIsPro] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);

  const [hudState, setHudState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success',
  });

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // --- INITIALIZE REVENUECAT ---
  useEffect(() => {
    const initPurchases = async () => {
      // 1. Safety Check: If Purchases is null (Expo Go), skip initialization
      if (!Purchases) {
        console.log("ℹ️ Skipping RevenueCat initialization (Dev Mode/Expo Go)");
        return;
      }

      try {
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          // Use DEBUG log level only for dev builds
          await Purchases.setLogLevel(LOG_LEVEL.DEBUG); 
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
          
          try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current && offerings.current.availablePackages.length !== 0) {
              setPackages(offerings.current.availablePackages);
            }
          } catch (e) {
            console.log("RC: Error fetching offerings", e);
          }

          try {
            const customerInfo = await Purchases.getCustomerInfo();
            if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
              setIsPro(true);
            }
          } catch (e) {
            console.log("RC: Error fetching customer info", e);
          }
        }
      } catch (e) {
        console.log("❌ RevenueCat Init Error", e);
      }
    };
    initPurchases();
  }, []);

  // --- AUTO LOGIN SECURITY ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || !firebaseUser.email) {
        setUser(null);
        setGoals([]);
        setTasks([]);
        setCurrentGoal(null);
        setIsLoading(false);
        return;
      }

      try {
        // Sync RevenueCat User ID (Safe Check)
        if (Purchases && (Platform.OS === 'android' || Platform.OS === 'ios')) {
          await Purchases.logIn(firebaseUser.uid);
        }

        let profile;
        try {
          profile = await apiService.getUserProfile(firebaseUser.email);
        } catch (error: any) {
          // Self-healing logic
          if (error?.message?.includes('User not found') || error?.message?.includes('404')) {
            profile = await apiService.syncUser({
              email: firebaseUser.email,
              socialId: firebaseUser.uid,
              name: firebaseUser.displayName || 'Operative',
              provider: firebaseUser.providerData[0]?.providerId || 'email'
            });
          } else {
            throw error;
          }
        }
        
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          onboardingData: profile.onboardingData,
          currentStreak: profile.currentStreak,
          lastActiveDate: profile.lastActiveDate
        });

        setGoals(profile.goals || []);
        const allTasks: Task[] = [];
        if (profile.goals) {
          profile.goals.forEach((g: any) => {
            if (g.tasks) allTasks.push(...g.tasks);
          });
        }
        setTasks(allTasks);

        if (profile.id) {
          const requests = await apiService.getFriendRequests(profile.id);
          setPendingRequestsCount(requests.length);
        }
      } catch (error: any) {
        console.error("Critical Auth Sync Error:", error);
        await signOut(auth);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // --- REAL PURCHASE METHODS (SAFE WRAPPED) ---
  const purchasePackage = async (pack: any) => {
    if (!Purchases) {
      setHudState({ visible: true, title: 'Dev Mode', message: 'In-app purchases not available in Expo Go.', type: 'info' });
      return;
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        setIsPro(true);
        setHudState({ visible: true, title: 'Welcome', message: 'Upgrade Successful', type: 'success' });
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        setHudState({ visible: true, title: 'Error', message: e.message, type: 'warning' });
      }
    }
  };

  const restorePurchases = async () => {
    if (!Purchases) {
      Alert.alert(
        "Dev Mode",
        "Restore is not available in Expo Go because native modules are disabled. To test purchases, build a Development Client."
      );
      return;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        setIsPro(true);
        setHudState({ visible: true, title: 'Success', message: 'Premium access restored.', type: 'success' });
      } else {
        setHudState({ visible: true, title: 'No Subscription', message: 'No active subscription found.', type: 'info' });
      }
    } catch (e: any) {
      setHudState({ visible: true, title: 'Error', message: e.message, type: 'warning' });
    }
  };

  const logout = useCallback(async () => {
    try {
      await signOut(auth); 
      // Check Purchases before calling
      if (Purchases && (Platform.OS === 'android' || Platform.OS === 'ios')) {
        await Purchases.logOut();
      }
      setUser(null);
      setGoals([]);
      setTasks([]);
      setCurrentGoal(null);
      setPendingRequestsCount(0);
      setIsPro(false);
      await storage.clearAllUserData();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  useEffect(() => {
    const checkStreakStatus = async () => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().split('T')[0] : '';

      if (lastActive !== today) {
        const archetype = user.onboardingData?.focusWindow || 'default';
        await NotificationService.scheduleStreakRescue(archetype);
      } else {
        await NotificationService.cancelStreakRescue();
      }
    };

    if (!isLoading) {
        checkStreakStatus();
    }
  }, [user, tasks, isLoading]); 

  useEffect(() => {
    const setupNotifications = async () => {
      const hasPermission = await NotificationService.registerForPushNotificationsAsync();
      if (hasPermission && user?.onboardingData?.focusWindow) {
        await NotificationService.scheduleFocusReminder(user.onboardingData.focusWindow);
      }
    };
    if (user) setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      let hudType: 'info' | 'warning' | 'success' = 'info';
      if (data?.type === 'streak_rescue') hudType = 'warning';
      
      setHudState({
        visible: true,
        title: title || 'System Alert',
        message: body || 'Tap to view',
        type: hudType
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response.notification.request.content.data);
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [user]);

  const refreshData = useCallback(async () => {
    if (!user?.email) return;
    try {
      const profile = await apiService.getUserProfile(user.email);
      setGoals(profile.goals || []);
      const allTasks: Task[] = [];
      if (profile.goals) {
        profile.goals.forEach((g: any) => {
          if (g.tasks) allTasks.push(...g.tasks);
        });
      }
      setTasks(allTasks);
      setUser(prev => prev ? { 
        ...prev, 
        currentStreak: profile.currentStreak,
        lastActiveDate: profile.lastActiveDate 
      } : null);
      if (profile.id) {
        const requests = await apiService.getFriendRequests(profile.id);
        setPendingRequestsCount(requests.length);
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('User not found') || e.message.includes('404'))) {
        setUser(null);
      }
    }
  }, [user?.email]); 

  const analyzeGoal = useCallback(async (goal: string, clarification: string = "", question: string = "") => {
    return await apiService.analyzeGoal(goal, clarification, question);
  }, []);

  const getAiQuestion = useCallback(async (goalText: string) => {
    if (!user?.email) return null;
    try {
      const response = await apiService.getClarifyingQuestion(user.email, goalText);
      return response.question;
    } catch (e) {
      return null;
    }
  }, [user]);

  const generatePlan = useCallback(async (goalText: string, clarification: string = "", dailyMinutes: number = 0) => {
    if (!user?.email) return null;
    try {
      const response = await apiService.generateAiPlan(user.email, goalText, clarification, dailyMinutes);
      return response.tasks;
    } catch (e) {
      return null;
    }
  }, [user]);

  const generateDailyPlan = useCallback(async (goalTitle: string, dayNumber: number, totalDays: number, dailyMinutes: number) => {
    if (!user?.email) return null;
    return await apiService.generateDailyPlan(user.email, goalTitle, dayNumber, totalDays, dailyMinutes);
  }, [user]);

  const reportTaskIssue = useCallback(async (taskId: string, feedback: string) => {
    if (!user?.email) return;
    try {
      const updatedTask = await apiService.refineTask(user.email, taskId, feedback);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (e) {
      console.error("AI Refinement Error:", e);
    }
  }, [user]);

  const addGoal = useCallback(async (title: string, type: string = 'project', targetDate?: Date, dailyMinutes: number = 45) => {
    if (!user?.email) return null;
    try {
      const newGoal = await apiService.createGoal(user.email, title, type, targetDate, dailyMinutes);
      setGoals((prev) => [newGoal, ...prev]);
      setCurrentGoal(newGoal);
      return newGoal;
    } catch (e) {
      return null;
    }
  }, [user]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g)));
    if (currentGoal?.id === goalId) setCurrentGoal((prev) => (prev ? { ...prev, ...updates } : null));
    try { await apiService.updateGoal(goalId, updates); } catch (e) { console.error("Update Goal API Error", e); }
  }, [currentGoal]);

  const archiveGoal = useCallback(async (goalId: string) => {
    const updates = { status: 'archived' as const };
    setGoals((prev) => prev.map(g => g.id === goalId ? { ...g, ...updates, completedAt: new Date() } : g));
    if (currentGoal?.id === goalId) setCurrentGoal(null);
    try { await apiService.updateGoal(goalId, updates); } catch (e) { console.error("Archive Goal API Error", e); }
  }, [currentGoal]);

  const deleteGoal = useCallback(async (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setTasks((prev) => prev.filter((t) => t.goalId !== goalId));
    if (currentGoal?.id === goalId) setCurrentGoal(null);
    try { await apiService.deleteGoal(goalId); } catch (e) { console.error("Delete Goal API Error", e); }
  }, [currentGoal]);

  const addTasks = useCallback(async (goalId: string, stagedTasks: any[]) => {
    try {
      const createdTasks = await apiService.addTasksToGoal(goalId, stagedTasks);
      setTasks((prev) => [...createdTasks, ...prev]);
    } catch (e) {
      console.error("Add Tasks Error", e);
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: any) => {
    const { id, goalId, createdAt, updatedAt, completed, goal, ...cleanUpdates } = updates;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...cleanUpdates } : t)));
    try { 
      await apiService.updateTask(taskId, cleanUpdates); 
      refreshData(); 
    } catch (e) { 
      console.error("Update Task Error:", e); 
    }
  }, [refreshData]);

  const completeTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'completed' });
  }, [updateTask]);

  const overrideTasks = useCallback((goalId: string, stagedTasks: any[]) => {
    addTasks(goalId, stagedTasks);
  }, [addTasks]);

  const saveOnboarding = useCallback(async (data: any) => {
    if (!user?.email) return;
    try {
      const updatedUser = await apiService.updateUser(user.email, { onboardingData: data });
      setUser(updatedUser);
    } catch (e) {
      console.error("Save Onboarding Error", e);
    }
  }, [user]);

  const toggleSubTask = useCallback(() => {}, []);
  const rateProductivity = useCallback(() => {}, []);

  const triggerTestNotification = () => {
    const archetype = user?.onboardingData?.focusWindow || 'default';
    NotificationService.sendImmediateTest(archetype);
  };

  return (
    <AppContext.Provider
      value={{
        user, setUser, logout, isLoading, isPro, 
        goals, tasks, currentGoal, pendingRequestsCount, 
        addGoal, updateGoal, deleteGoal, archiveGoal,
        addTasks, overrideTasks, completeTask,
        toggleSubTask, updateTask, reportTaskIssue,
        setCurrentGoal, rateProductivity,
        refreshData, saveOnboarding,
        generatePlan, generateDailyPlan, getAiQuestion, analyzeGoal,
        triggerTestNotification, restorePurchases, purchasePackage, packages
      }}
    >
      {children}
      <TacticalHUD 
        visible={hudState.visible}
        title={hudState.title}
        message={hudState.message}
        type={hudState.type}
        onPress={() => setHudState(prev => ({...prev, visible: false}))}
        onClose={() => setHudState(prev => ({...prev, visible: false}))}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};