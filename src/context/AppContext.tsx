import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Goal, Task } from '../types';
import { apiService } from '../services/api';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notificationService';
import { TacticalHUD } from '../components/TacticalHUD';
import * as Haptics from 'expo-haptics';

interface User {
  id: string;
  email: string;
  name: string;
  onboardingData?: any;
  currentStreak?: number; // Added
  lastActiveDate?: string; // Added
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  goals: Goal[];
  tasks: Task[];
  currentGoal: Goal | null;
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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);

  const [hudState, setHudState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success',
  });

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // --- STREAK MONITORING ---
  useEffect(() => {
    const checkStreakStatus = async () => {
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0];
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().split('T')[0] : '';

      if (lastActive !== today) {
        // User hasn't completed a task today yet -> Schedule Rescue
        const archetype = user.onboardingData?.focusWindow || 'default';
        await NotificationService.scheduleStreakRescue(archetype);
      } else {
        // User IS active today -> Cancel Rescue
        await NotificationService.cancelStreakRescue();
      }
    };

    checkStreakStatus();
  }, [user, tasks]); // Re-run when user or tasks change

  useEffect(() => {
    const setupNotifications = async () => {
      const hasPermission = await NotificationService.registerForPushNotificationsAsync();
      if (hasPermission && user?.onboardingData?.focusWindow) {
        await NotificationService.scheduleFocusReminder(user.onboardingData.focusWindow);
      }
    };
    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      
      // Determine HUD type based on notification type
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
      
      // Update local user streak data from profile
      setUser(prev => prev ? { 
        ...prev, 
        currentStreak: profile.currentStreak,
        lastActiveDate: profile.lastActiveDate 
      } : null);

    } catch (e) {
      console.error("Data Sync Error:", e);
    }
  }, [user?.email]); // Only depend on email to prevent loops

  useEffect(() => {
    if (user?.email) refreshData();
  }, [user?.email, refreshData]);

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
    
    // We refresh data after update to sync streaks
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
        goals, tasks, currentGoal,
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