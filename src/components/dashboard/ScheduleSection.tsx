import { DailyFlowTimeline } from '@/components/DailyFlowTimeline';
import { Task, TimeBlock, ScheduledTask } from '@/types';

// Active timer state for visual integration with timeline
interface ActiveTimerState {
  isRunning: boolean;
  isPaused: boolean;
  taskId: string | null;
  taskTitle: string | null;
  timeRemaining: number; // seconds
  totalTime: number; // seconds
}

interface ScheduleSectionProps {
  timeBlocks: TimeBlock[];
  scheduledTasks: ScheduledTask[];
  tasks: Task[];
  onAddTimeBlock: (blockData: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onUpdateTimeBlock: (id: string, blockData: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onDeleteTimeBlock: (id: string) => void;
  onAddTask: (taskOrTitle: string | Omit<Task, 'id' | 'createdAt'>, estimatedMinutes?: number, taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other') => void;
  onScheduleTask?: (scheduledTask: Omit<ScheduledTask, 'id'>) => void;
  // When true, expects an external DragDropContext to be provided by parent
  useExternalDragContext?: boolean;
  // Active timer state for showing timer progress in timeline
  activeTimerState?: ActiveTimerState;
}

export function ScheduleSection({
  timeBlocks,
  scheduledTasks,
  tasks,
  onAddTimeBlock,
  onUpdateTimeBlock,
  onDeleteTimeBlock,
  onAddTask,
  onScheduleTask,
  useExternalDragContext = false,
  activeTimerState,
}: ScheduleSectionProps) {
  return (
    <div data-tutorial="timeline">
      <DailyFlowTimeline
        timeBlocks={timeBlocks}
        scheduledTasks={scheduledTasks}
        tasks={tasks}
        onAddTimeBlock={onAddTimeBlock}
        onUpdateTimeBlock={onUpdateTimeBlock}
        onDeleteTimeBlock={onDeleteTimeBlock}
        onAddTask={onAddTask}
        onScheduleTask={onScheduleTask}
        useExternalDragContext={useExternalDragContext}
        activeTimerState={activeTimerState}
      />
    </div>
  );
}
