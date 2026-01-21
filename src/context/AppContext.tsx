import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Goal, Task } from '../types';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  onboardingData?: any;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  goals: Goal[];
  tasks: Task[];
  currentGoal: Goal | null;
  addGoal: (title: string) => Promise<Goal | null>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  archiveGoal: (goalId: string) => void;
  addTasks: (goalId: string, tasks: any[]) => Promise<void>;
  overrideTasks: (goalId: string, tasks: any[]) => void;
  completeTask: (taskId: string) => void;
  toggleSubTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  reportTaskIssue: (taskId: string, feedback: string) => Promise<void>; // --- AI STEP 3
  setCurrentGoal: (goal: Goal | null) => void;
  rateProductivity: (taskId: string, rating: number) => void;
  refreshData: () => void;
  saveOnboarding: (data: any) => Promise<void>;
  generatePlan: (goalText: string, clarification?: string) => Promise<any | null>; // --- AI STEP 2
  getAiQuestion: (goalText: string) => Promise<string | null>; // --- AI STEP 1
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);

  // Sync data from backend to global state
  const refreshData = useCallback(async () => {
    if (!user?.email) return;
    try {
      const profile = await apiService.getUserProfile(user.email);
      setGoals(profile.goals || []);
      
      const allTasks: Task[] = [];
      profile.goals.forEach((g: any) => {
        if (g.tasks) allTasks.push(...g.tasks);
      });
      setTasks(allTasks);
    } catch (e) {
      console.error("Data Sync Error:", e);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshData();
  }, [user, refreshData]);

  // ==========================================
  // AI STRATEGIST METHODS
  // ==========================================

  // Step 1: Request a question from AI to clarify the user's intent
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

  // Step 2: Generate the 3-5 step prescriptive plan
  const generatePlan = useCallback(async (goalText: string, clarification: string = "") => {
    if (!user?.email) return null;
    try {
      const response = await apiService.generateAiPlan(user.email, goalText, clarification);
      return response.tasks; // Returns { shortTitle, tasks[] }
    } catch (e) {
      console.error("AI Generation Error:", e);
      return null;
    }
  }, [user]);

  // Step 3: Iterate/Refine a single task based on user feedback
  const reportTaskIssue = useCallback(async (taskId: string, feedback: string) => {
    if (!user?.email) return;
    try {
      const updatedTask = await apiService.refineTask(user.email, taskId, feedback);
      // Update the task list locally with the new AI version
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (e) {
      console.error("AI Refinement Error:", e);
    }
  }, [user]);

  // ==========================================
  // GOAL & TASK MANAGEMENT
  // ==========================================

  const addGoal = useCallback(async (title: string) => {
    if (!user?.email) return null;
    try {
      const newGoal = await apiService.createGoal(user.email, title);
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
    if (currentGoal?.id === goalId) {
      setCurrentGoal((prev) => (prev ? { ...prev, ...updates } : null));
    }
    try {
      await apiService.updateGoal(goalId, updates);
    } catch (e) {
      console.error("Update Goal API Error", e);
    }
  }, [currentGoal]);

  const archiveGoal = useCallback(async (goalId: string) => {
    const updates = { status: 'archived' as const };
    setGoals((prev) => prev.map(g => g.id === goalId ? { ...g, ...updates, completedAt: new Date() } : g));
    if (currentGoal?.id === goalId) setCurrentGoal(null);
    try {
      await apiService.updateGoal(goalId, updates);
    } catch (e) {
      console.error("Archive Goal API Error", e);
    }
  }, [currentGoal]);

  const deleteGoal = useCallback((goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setTasks((prev) => prev.filter((t) => t.goalId !== goalId));
    if (currentGoal?.id === goalId) setCurrentGoal(null);
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
    // 🛡️ Filter fields to prevent Prisma errors on the backend
    const { id, goalId, createdAt, updatedAt, completed, goal, ...cleanUpdates } = updates;
    
    // Optimistic local update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...cleanUpdates } : t)));
    
    try {
      await apiService.updateTask(taskId, cleanUpdates);
    } catch (e) {
      console.error("Update Task Error:", e);
      refreshData(); // Re-sync with server if update fails
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

  // Legacy stubs for types
  const toggleSubTask = useCallback(() => {}, []);
  const rateProductivity = useCallback(() => {}, []);

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
        generatePlan, getAiQuestion
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};