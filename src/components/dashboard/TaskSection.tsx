import { MobileTaskView } from '@/components/MobileTaskView';
import { Task, TimeBlock } from '@/types';
import { useActiveTimerState } from '@/contexts/TimerContext';

interface BulkTaskInput {
  title: string;
  estimatedMinutes?: number;
}

interface TaskSectionProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  userId?: string;
  userName?: string;
  userAvatar?: string;
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
  userName,
  userAvatar,
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
  // Get active timer state to highlight the currently running task
  const activeTimerState = useActiveTimerState();
  
  // Wrapper to handle the different function signature
  const handleAddTask = (title: string, estimatedMinutes?: number, taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other') => {
    onAddTask(title, estimatedMinutes, taskType);
  };

  return (
    <div className="h-full min-h-[600px]" data-tutorial="tasks">
      <MobileTaskView
        tasks={tasks}
        userName={userName}
        userAvatar={userAvatar}
        onToggleComplete={onToggleComplete}
        onAddTask={handleAddTask}
        onBulkAddTasks={onBulkAddTasks}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onAskAI={showQuickActions ? onAskAI : undefined}
        onOpenAIChat={onOpenAIChat}
        onOpenDailyPlanning={onOpenDailyPlanning}
        activeTaskId={activeTimerState?.taskId}
        isTimerRunning={activeTimerState?.isRunning && !activeTimerState?.isPaused}
      />
    </div>
  );
}
