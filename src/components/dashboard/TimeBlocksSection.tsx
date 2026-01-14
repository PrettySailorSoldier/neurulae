import { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { TimeBlock, ScheduledTask, Task } from '@/types';
import { DailyFlowTimeline } from '@/components/DailyFlowTimeline';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface TimeBlocksSectionProps {
  /** Time blocks to display */
  timeBlocks: TimeBlock[];
  /** Scheduled tasks */
  scheduledTasks: ScheduledTask[];
  /** All tasks */
  tasks: Task[];
  /** Add a new time block */
  onAddTimeBlock: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  /** Update an existing time block */
  onUpdateTimeBlock: (id: string, block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  /** Delete a time block */
  onDeleteTimeBlock: (id: string) => void;
  /** Add a new task */
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  /** Start a work session on a task */
  onStartWorkSession?: (task: Task) => void;
  /** Extra classes */
  className?: string;
}

export function TimeBlocksSection({
  timeBlocks,
  scheduledTasks,
  tasks,
  onAddTimeBlock,
  onUpdateTimeBlock,
  onDeleteTimeBlock,
  onAddTask,
  onStartWorkSession,
  className,
}: TimeBlocksSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "rounded-lg border border-border overflow-hidden transition-all",
        "bg-card/50 hover:bg-card",
        "opacity-90 hover:opacity-100",
        className
      )}
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Today's Schedule</span>
          {timeBlocks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({timeBlocks.length} block{timeBlocks.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="max-h-[300px] overflow-y-auto border-t border-border">
          <DailyFlowTimeline
            timeBlocks={timeBlocks}
            scheduledTasks={scheduledTasks}
            tasks={tasks}
            onAddTimeBlock={onAddTimeBlock}
            onUpdateTimeBlock={onUpdateTimeBlock}
            onDeleteTimeBlock={onDeleteTimeBlock}
            onAddTask={onAddTask}
            onStartWorkSession={onStartWorkSession}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
