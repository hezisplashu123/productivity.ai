import { useCallback } from 'react';
import { TaskGoal } from '../components/TaskReactorCircle';

// Mock AI task generator - generates 3-4 sub-tasks for a given goal
const generateSubTasks = (goalTitle: string): TaskGoal['subTasks'] => {
  const templates: Record<string, TaskGoal['subTasks']> = {
    study: [
      { id: '1', title: 'Review Notes', duration: 30, isCompleted: false },
      { id: '2', title: 'Practice Problems', duration: 45, isCompleted: false },
      { id: '3', title: 'Create Study Guide', duration: 40, isCompleted: false },
      { id: '4', title: 'Final Review', duration: 25, isCompleted: false },
    ],
    work: [
      { id: '1', title: 'Research & Planning', duration: 60, isCompleted: false },
      { id: '2', title: 'Implementation', duration: 90, isCompleted: false },
      { id: '3', title: 'Testing & Review', duration: 45, isCompleted: false },
    ],
    default: [
      { id: '1', title: 'Research & Plan', duration: 30, isCompleted: false },
      { id: '2', title: 'Execute Main Task', duration: 60, isCompleted: false },
      { id: '3', title: 'Review & Refine', duration: 30, isCompleted: false },
    ],
  };

  const lowerTitle = goalTitle.toLowerCase();
  if (lowerTitle.includes('study') || lowerTitle.includes('learn') || lowerTitle.includes('exam')) {
    return templates.study;
  } else if (lowerTitle.includes('build') || lowerTitle.includes('create') || lowerTitle.includes('develop')) {
    return templates.work;
  }
  return templates.default;
};

// Neon colors for different goal types
const getGoalColor = (goalTitle: string): string => {
  const lowerTitle = goalTitle.toLowerCase();
  if (lowerTitle.includes('study') || lowerTitle.includes('learn') || lowerTitle.includes('exam')) {
    return '#00F0FF'; // Cyan
  } else if (lowerTitle.includes('build') || lowerTitle.includes('create') || lowerTitle.includes('develop')) {
    return '#FF6B35'; // Orange
  } else if (lowerTitle.includes('admin') || lowerTitle.includes('email') || lowerTitle.includes('meeting')) {
    return '#4ECDC4'; // Teal
  }
  return '#FF4500'; // Safety Orange (default)
};

export const useTaskGenerator = () => {
  const createGoal = useCallback((textInput: string): TaskGoal => {
    const subTasks = generateSubTasks(textInput);
    const totalTime = subTasks.reduce((sum, st) => sum + st.duration, 0);
    
    const newGoal: TaskGoal = {
      id: `goal-${Date.now()}`,
      title: textInput,
      totalTime,
      color: getGoalColor(textInput),
      subTasks,
    };

    return newGoal;
  }, []);

  return { createGoal };
};





