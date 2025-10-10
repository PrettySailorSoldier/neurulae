export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  projectId?: string;
  focusTimeMinutes?: number;
  recurring?: 'none' | 'daily' | 'weekly';
  colorTag?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
  createdAt: string;
}

export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  taskId?: string;
  title?: string;
}

export type Theme = 'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy';

export interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  totalTime: number;
  currentTaskId?: string;
}
