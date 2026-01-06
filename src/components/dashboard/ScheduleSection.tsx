import { DailyFlowTimeline } from '@/components/DailyFlowTimeline';
import { Task, TimeBlock, ScheduledTask } from '@/types';

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
      />
    </div>
  );
}
