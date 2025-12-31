import { TaskList } from '@/components/TaskList';
import { Task, TimeBlock, ScheduledTask } from '@/types';

interface BulkTaskInput {
  title: string;
  estimatedMinutes?: number;
}

interface TaskSectionProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  userId?: string;
  onAddTask: (taskOrTitle: string | Omit<Task, 'id' | 'createdAt'>, estimatedMinutes?: number, taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other') => void;
  onBulkAddTasks?: (tasks: BulkTaskInput[]) => Promise<void>;
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
  onBreakdownTask?: (task: Task) => void;
  onOpenAIChat?: (context: string) => void;
  onStartIntention?: (task: Task) => void;
  activeIntentionId?: string | null;
  showQuickActions: boolean;
  onClearCompleted?: () => void;
  onClearAll?: () => void;
  onOpenDailyPlanning?: () => void;
  // When true, tasks are draggable and can be dropped on time blocks
  enableDragDrop?: boolean;
}

export function TaskSection({
  tasks,
  timeBlocks,
  userId,
  onAddTask,
  onBulkAddTasks,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onPrioritize,
  onScheduleTasks,
  onAskAI,
  onBreakdownTask,
  onOpenAIChat,
  onStartIntention,
  activeIntentionId,
  showQuickActions,
  onClearCompleted,
  onClearAll,
  onOpenDailyPlanning,
  enableDragDrop = false,
}: TaskSectionProps) {
  return (
    <div className="lg:col-span-2" data-tutorial="tasks">
      <TaskList
        tasks={tasks}
        timeBlocks={timeBlocks}
        userId={userId}
        onAddTask={onAddTask}
        onBulkAddTasks={onBulkAddTasks}
        onToggleComplete={onToggleComplete}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onPrioritize={onPrioritize}
        onScheduleTasks={onScheduleTasks}
        onAskAI={showQuickActions ? onAskAI : undefined}
        onBreakdownTask={showQuickActions ? onBreakdownTask : undefined}
        onOpenAIChat={onOpenAIChat}
        onStartIntention={onStartIntention}
        activeIntentionId={activeIntentionId}
        showQuickActions={showQuickActions}
        onClearCompleted={onClearCompleted}
        onClearAll={onClearAll}
        onOpenDailyPlanning={onOpenDailyPlanning}
        enableDragDrop={enableDragDrop}
      />
    </div>
  );
}
