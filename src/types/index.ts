export interface Goal {
  id: string;
  title: string;
  createdAt: Date;
  completedAt?: Date;
  status: 'active' | 'completed';
}

export type TaskStatus = 'queued' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  duration: number; // in minutes - the focus time for this task
  status: TaskStatus;
  order?: number; // Order in the queue (for drag-and-drop)
  dueDate?: Date;
  completedAt?: Date;
  productivityRating?: number; // 1-5
  subTasks?: SubTask[];
  // Legacy support - will be removed
  completed?: boolean;
  timeBudget?: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  duration?: number; // in minutes
}

export interface ProductivityRating {
  taskId: string;
  rating: number; // 1-5
  timestamp: Date;
}




