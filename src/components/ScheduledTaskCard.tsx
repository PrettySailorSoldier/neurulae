import { Task } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, GripVertical } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';

interface ScheduledTaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  estimatedMinutes?: number;
}

export function ScheduledTaskCard({ task, onToggleComplete, estimatedMinutes }: ScheduledTaskCardProps) {
  return (
    <div className="group flex items-center gap-2 bg-card/50 border border-border rounded-md p-2 hover:bg-card transition-colors cursor-move">
      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggleComplete(task.id)}
        className="border-border"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        {estimatedMinutes && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDuration(estimatedMinutes)}
          </div>
        )}
      </div>
    </div>
  );
}