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
  addTasks: (goalId: string, tasks: any[]) => Promise<void>;
  overrideTasks: (goalId: string, tasks: any[]) => void;
  completeTask: (taskId: string) => void;
  toggleSubTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  setCurrentGoal: (goal: Goal | null) => void;
  rateProductivity: (taskId: string, rating: number) => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);

  // Load data from Backend when User logs in
  const refreshData = useCallback(async () => {
    if (!user?.email) return;
    try {
      const profile = await apiService.getUserProfile(user.email);
      setGoals(profile.goals || []);
      
      // Flatten tasks from all goals
      const allTasks: Task[] = [];
      profile.goals.forEach((g: any) => {
        if (g.tasks) allTasks.push(...g.tasks);
      });
      setTasks(allTasks);
    } catch (e) {
      console.error("Sync Error:", e);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshData();
  }, [user, refreshData]);

  // --- ACTIONS ---

  const addGoal = useCallback(async (title: string) => {
    if (!user?.email) return null;
    try {
      // Save to Backend
      const newGoal = await apiService.createGoal(user.email, title);
      
      // Update Local State
      setGoals((prev) => [newGoal, ...prev]);
      setCurrentGoal(newGoal);
      return newGoal;
    } catch (e) {
      console.error("Add Goal Error", e);
      return null;
    }
  }, [user]);

  const addTasks = useCallback(async (goalId: string, stagedTasks: any[]) => {
    try {
      // Save to Backend
      const createdTasks = await apiService.addTasksToGoal(goalId, stagedTasks);
      
      // Update Local State
      setTasks((prev) => [...createdTasks, ...prev]);
    } catch (e) {
      console.error("Add Tasks Error", e);
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Optimistic Update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    
    // Save to Backend
    try {
      await apiService.updateTask(taskId, updates);
    } catch (e) {
      console.error("Update Task Error", e);
    }
  }, []);

  const completeTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'completed', completed: true, completedAt: new Date() });
  }, [updateTask]);

  // -- Boilerplate / Local Only for now --
  const updateGoal = useCallback((goalId: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g)));
    if (currentGoal?.id === goalId) {
      setCurrentGoal((prev) => (prev ? { ...prev, ...updates } : null));
    }
  }, [currentGoal]);

  const deleteGoal = useCallback((goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setTasks((prev) => prev.filter((t) => t.goalId !== goalId));
    if (currentGoal?.id === goalId) setCurrentGoal(null);
  }, [currentGoal]);

  const overrideTasks = useCallback((goalId: string, stagedTasks: any[]) => {
    // Complex logic handled simpler by just adding for MVP
    addTasks(goalId, stagedTasks);
  }, [addTasks]);

  const toggleSubTask = useCallback((taskId: string) => {
    // Legacy support
  }, []);

  const rateProductivity = useCallback((taskId: string, rating: number) => {
    updateTask(taskId, { productivityRating: rating });
  }, [updateTask]);

  return (
    <AppContext.Provider
      value={{
        user, setUser,
        goals, tasks, currentGoal,
        addGoal, updateGoal, deleteGoal,
        addTasks, overrideTasks, completeTask,
        toggleSubTask, updateTask,
        setCurrentGoal, rateProductivity,
        refreshData
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