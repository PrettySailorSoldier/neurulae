import { TaskList } from '@/components/TaskList';
import { Task, TimeBlock, ScheduledTask } from '@/types';

interface TaskSectionProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  onAddTask: (taskOrTitle: string | Omit<Task, 'id' | 'createdAt'>, estimatedMinutes?: number, taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other') => void;
  onToggleComplete: (id: string) => void;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (id: string) => void;
  onPrioritize: (taskIds: string[]) => void;
  onScheduleTasks: (schedule: Array<{
    taskId: string;
    blockId: string;
    estimatedMinutes?: number;
    order?: number;
  }>) => void;
  onAskAI?: (message: string) => void;
  showQuickActions: boolean;
}

export function TaskSection({
  tasks,
  timeBlocks,
  onAddTask,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onPrioritize,
  onScheduleTasks,
  onAskAI,
  showQuickActions,
}: TaskSectionProps) {
  return (
    <div className="lg:col-span-2" data-tutorial="tasks">
      <TaskList
        tasks={tasks}
        timeBlocks={timeBlocks}
        onAddTask={onAddTask}
        onToggleComplete={onToggleComplete}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onPrioritize={onPrioritize}
        onScheduleTasks={onScheduleTasks}
        onAskAI={showQuickActions ? onAskAI : undefined}
        showQuickActions={showQuickActions}
      />
    </div>
  );
}