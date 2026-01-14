import React, { createContext, useContext, useState, useCallback } from 'react';
import { Goal, Task } from '../types';

interface AppContextType {
  goals: Goal[];
  tasks: Task[];
  currentGoal: Goal | null;
  addGoal: (title: string) => Goal;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  addTasks: (goalId: string, tasks: any[]) => void;
  overrideTasks: (goalId: string, tasks: any[]) => void;
  completeTask: (taskId: string) => void;
  toggleSubTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  setCurrentGoal: (goal: Goal | null) => void;
  rateProductivity: (taskId: string, rating: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);

  const addGoal = useCallback((title: string) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title,
      createdAt: new Date(),
      status: 'active',
    };
    setGoals((prev) => [newGoal, ...prev]);
    return newGoal;
  }, []);

  const updateGoal = useCallback((goalId: string, updates: Partial<Goal>) => {
    setGoals((prev) => 
      prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g))
    );
    if (currentGoal?.id === goalId) {
      setCurrentGoal((prev) => (prev ? { ...prev, ...updates } : null));
    }
  }, [currentGoal]);

  const deleteGoal = useCallback((goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setTasks((prev) => prev.filter((t) => t.goalId !== goalId));
    if (currentGoal?.id === goalId) {
      setCurrentGoal(null);
    }
  }, [currentGoal]);

  const addTasks = useCallback((goalId: string, stagedTasks: any[]) => {
    const newTasks: Task[] = stagedTasks.map((t, index) => ({
      id: t.id || `${goalId}-task-${index}-${Date.now()}`,
      goalId: goalId,
      title: t.title,
      duration: t.duration,
      description: t.description || "",
      status: 'queued',
      completed: false,
    }));
    setTasks((prev) => [...newTasks, ...prev]);
  }, []);

  // Deletes old tasks for a goal and adds new ones (for editing/refining)
  const overrideTasks = useCallback((goalId: string, stagedTasks: any[]) => {
    setTasks((prev) => {
      const filtered = prev.filter(t => t.goalId !== goalId);
      const newTasks: Task[] = stagedTasks.map((t, index) => ({
        id: t.id || `${goalId}-task-${index}-${Date.now()}`,
        goalId: goalId,
        title: t.title,
        duration: t.duration,
        description: t.description || "",
        status: 'queued',
        completed: false,
      }));
      return [...newTasks, ...filtered];
    });
  }, []);

  // GENERIC UPDATE TASK FUNCTION
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  }, []);

  const toggleSubTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'completed' ? 'queued' : 'completed',
              completed: task.status !== 'completed',
            }
          : task
      )
    );
  }, []);

  const completeTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: 'completed', completed: true, completedAt: new Date() }
          : task
      )
    );
  }, []);

  const rateProductivity = useCallback((taskId: string, rating: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, productivityRating: rating } : task
      )
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        goals,
        tasks,
        currentGoal,
        addGoal,
        updateGoal,
        deleteGoal,
        addTasks,
        overrideTasks,
        completeTask,
        toggleSubTask,
        updateTask,
        setCurrentGoal,
        rateProductivity,
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