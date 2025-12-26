import React, { createContext, useContext, useState, useCallback } from 'react';
import { Goal, Task, ProductivityRating } from '../types';
import { mockGoals, mockTasks } from '../data/mockData';

interface AppContextType {
  goals: Goal[];
  tasks: Task[];
  currentGoal: Goal | null;
  addGoal: (title: string) => Goal;
  addTasks: (goalId: string, tasks: Task[]) => void;
  completeTask: (taskId: string) => void;
  rateProductivity: (taskId: string, rating: number) => void;
  setCurrentGoal: (goal: Goal | null) => void;
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
    setGoals((prev) => [...prev, newGoal]);
    setCurrentGoal(newGoal);
    return newGoal;
  }, []);

  const addTasks = useCallback((goalId: string, newTasks: Task[]) => {
    setTasks((prev) => {
      // Ensure unique IDs by appending timestamp
      const timestamp = Date.now();
      const tasksWithUniqueIds = newTasks.map((task, index) => ({
        ...task,
        id: `${task.id}-${timestamp}-${index}`,
        goalId,
      }));
      return [...prev, ...tasksWithUniqueIds];
    });
  }, []);

  const completeTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, completed: true, completedAt: new Date() }
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
        addTasks,
        completeTask,
        rateProductivity,
        setCurrentGoal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

