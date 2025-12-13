/** AI Assistant action types */
export type AIActionType =
  | 'create_task'
  | 'update_task'
  | 'create_time_block'
  | 'create_playbook'
  | 'update_playbook'
  | 'create_project'
  | 'suggest_time_blocks';

export interface AIAction {
  action: AIActionType;
  data: Record<string, unknown>;
}

export interface TaskCreateData {
  title: string;
  priority?: 'high' | 'medium' | 'low';
  category?: 'work' | 'personal' | 'health' | 'household' | 'social' | 'finance';
  estimatedMinutes?: number;
  dueDate?: string;
  description?: string;
  projectId?: string;
}

export interface TaskUpdateData extends Partial<TaskCreateData> {
  taskId: string;
}

export interface TimeBlockCreateData {
  title: string;
  startTime: string;
  endTime: string;
  category?: string;
  taskIds?: string[];
}

export interface PlaybookCreateData {
  title: string;
  description?: string;
  category?: string;
  steps?: string[];
}

export interface PlaybookUpdateData extends Partial<PlaybookCreateData> {
  playbookId?: string;
  title?: string;
}

export interface ProjectCreateData {
  title: string;
  description?: string;
  category?: string;
}

/** AI response types for Edge Functions */
export interface AIPlaybookStep {
  title: string;
  description: string;
  estimatedMinutes?: number;
  tips?: string[];
}

export interface AIPlaybookResponse {
  title?: string;
  steps: AIPlaybookStep[];
}

export interface AIScheduledTaskItem {
  taskId: string;
  taskName: string;
  startTime: string;
  endTime: string;
  estimatedMinutes?: number;
  reason?: string;
}

export interface AIOrganizeTasksResult {
  priorities: string[];
  schedule: Array<{
    taskId: string;
    blockId: string;
    estimatedMinutes?: number;
    order?: number;
    reason?: string;
  }>;
  tips?: string[];
}
