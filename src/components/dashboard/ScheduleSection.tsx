import { DailyFlowTimeline } from '@/components/DailyFlowTimeline';
import { Task, TimeBlock, ScheduledTask } from '@/types';
import { useActiveTimerState } from '@/contexts/TimerContext';

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
}: ScheduleSectionProps) {
  // Get active timer state from context to sync with timeline
  const activeTimerState = useActiveTimerState();

  // Convert context state to the format expected by DailyFlowTimeline
  const timelineTimerState = activeTimerState ? {
    isRunning: activeTimerState.isRunning,
    isPaused: activeTimerState.isPaused,
    taskId: activeTimerState.taskId,
    taskTitle: activeTimerState.taskTitle,
    timeRemaining: activeTimerState.timeRemaining,
    totalTime: activeTimerState.totalTime,
  } : undefined;

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
        activeTimerState={timelineTimerState}
      />
    </div>
  );
}
