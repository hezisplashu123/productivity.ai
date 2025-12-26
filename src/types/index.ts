export interface Goal {
  id: string;
  title: string;
  createdAt: Date;
  completedAt?: Date;
  status: 'active' | 'completed';
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  timeBudget: number; // in minutes
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  productivityRating?: number; // 1-5
  subTasks?: SubTask[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProductivityRating {
  taskId: string;
  rating: number; // 1-5
  timestamp: Date;
}


