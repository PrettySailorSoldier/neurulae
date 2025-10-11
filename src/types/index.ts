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
  linkedPlaybookId?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
  createdAt: string;
}

export type Theme = 'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy';

export interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  totalTime: number;
  currentTaskId?: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // "HH:MM" format (e.g., "07:00")
  endTime: string;   // "HH:MM" format (e.g., "21:00")
  type: 'main' | 'dedicated'; // left side vs right side of timeline
  scheduleType: 'weekday' | 'weekend' | 'everyday';
  color?: string; // optional custom color
  createdAt: string;
}

export interface ScheduledTask {
  id: string;
  taskId: string; // links to Task.id
  blockId: string; // which TimeBlock it belongs to
  date: string; // YYYY-MM-DD format
  startTime?: string; // optional specific time within block
  estimatedMinutes?: number;
}

export interface TimedTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  completed: boolean;
  order: number;
  linkedTaskId?: string;
}

export interface TimerSession {
  id: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  actualMinutes?: number;
  date: string;
  timerType: 'interval' | 'sequence' | 'flowtime' | 'chime' | 'tomato';
}

export interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  estimatedMinutes?: number;
  completed: boolean;
  order: number;
  tips?: string[];
}

export interface Playbook {
  id: string;
  title: string;
  description?: string;
  category: string;
  steps: PlaybookStep[];
  isTemplate: boolean;
  linkedTaskIds: string[];
  resetOnRecurrence: boolean;
  createdAt: string;
}

export interface ReminderWidget {
  id: string;
  title: string;
  description?: string;
  items: ReminderItem[];
  resetSchedule: 'none' | 'daily' | 'weekly' | 'monthly';
  lastResetDate?: string;
  createdAt: string;
}

export interface ReminderItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}
