import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Goal, Task } from '../types';
import { apiService } from '../services/api';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notificationService';
import { TacticalHUD } from '../components/TacticalHUD';
import * as Haptics from 'expo-haptics';
import { auth } from '../config/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Import signOut

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
  setUser: (user: User | null) => void;
  logout: () => Promise<void>; // Added logout function
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const [hudState, setHudState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success',
  });

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // --- AUTO LOGIN LOGIC ---
  useEffect(() => {
    console.log("🔄 AppContext: Initializing Auth Listener...");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || !firebaseUser.email) {
        console.log("ℹ️ No Firebase user detected.");
        setUser(null);
        setGoals([]);
        setTasks([]);
        setIsLoading(false);
        return;
      }

      console.log("🔥 Auth State Changed. Checking backend for:", firebaseUser.email);
      
      try {
        const profile = await apiService.getUserProfile(firebaseUser.email);
        console.log("✅ Backend Profile Found:", profile.id);
        
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
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('User not found') || errorMessage.includes('404')) {
          console.log("⚠️ New user signup detected (Backend sync pending).");
        } else {
          console.error("❌ Auto-login Error:", errorMessage);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // --- LOGOUT FUNCTION (CRITICAL FIX) ---
  const logout = useCallback(async () => {
    try {
      await signOut(auth); // This wipes the session from the phone
      setUser(null);
      setGoals([]);
      setTasks([]);
      console.log("🔒 Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  // --- STREAK MONITORING ---
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
      console.error("Data Sync Error:", e.message);
      if (e.message && (e.message.includes('User not found') || e.message.includes('404'))) {
        setUser(null);
      }
    }
  }, [user?.email]); 

  // AI & Goals
  const analyzeGoal = useCallback(async (goal: string, clarification: string = "", question: string = "") => {
    return await apiService.analyzeGoal(goal, clarification, question);
  }, []);

  const getAiQuestion = useCallback(async (goalText: string) => {
    if (!user?.email) return null;
    try {
      const response = await apiService.getClarifyingQuestion(user.email, goalText);
      return response.question;
    } catch (e) {
      console.error("AI Question Error:", e);
      return null;
    }
  }, [user]);

  const generatePlan = useCallback(async (goalText: string, clarification: string = "", dailyMinutes: number = 0) => {
    if (!user?.email) return null;
    try {
      const response = await apiService.generateAiPlan(user.email, goalText, clarification, dailyMinutes);
      return response.tasks;
    } catch (e) {
      console.error("AI Generation Error:", e);
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
      console.error("Add Goal Error", e);
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
        user, setUser,
        logout, // Exposed to UI
        isLoading, 
        goals, tasks, currentGoal,
        pendingRequestsCount, 
        addGoal, updateGoal, deleteGoal, archiveGoal,
        addTasks, overrideTasks, completeTask,
        toggleSubTask, updateTask, reportTaskIssue,
        setCurrentGoal, rateProductivity,
        refreshData, saveOnboarding,
        generatePlan, generateDailyPlan, getAiQuestion, analyzeGoal,
        triggerTestNotification
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