export interface Goal {
  id: string;
  title: string;
  createdAt: Date | string; 
  completedAt?: Date | string;
  status: 'active' | 'completed' | 'archived';
  
  type?: 'project' | 'journey';
  targetDate?: Date | string;
  startDate?: Date | string;
  dailyMinutes?: number;
}

export type TaskStatus = 'queued' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  status: TaskStatus;
  order?: number; 
  dayNumber?: number; // <--- NEW: Tracks which day of the journey this task belongs to
  dueDate?: Date | string;
  completedAt?: Date | string;
  productivityRating?: number;
  subTasks?: SubTask[];
  completed?: boolean;
  timeBudget?: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  duration?: number;
}

export interface ProductivityRating {
  taskId: string;
  rating: number;
  timestamp: Date;
}