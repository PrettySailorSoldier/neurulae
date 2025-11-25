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
}

export function ScheduleSection({
  timeBlocks,
  scheduledTasks,
  tasks,
  onAddTimeBlock,
  onUpdateTimeBlock,
  onDeleteTimeBlock,
  onAddTask,
}: ScheduleSectionProps) {
  return (
    <div className="lg:col-span-3" data-tutorial="timeline">
      <DailyFlowTimeline
        timeBlocks={timeBlocks}
        scheduledTasks={scheduledTasks}
        tasks={tasks}
        onAddTimeBlock={onAddTimeBlock}
        onUpdateTimeBlock={onUpdateTimeBlock}
        onDeleteTimeBlock={onDeleteTimeBlock}
        onAddTask={onAddTask}
      />
    </div>
  );
}