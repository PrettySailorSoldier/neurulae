import { Timer, Plus, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickActionBarProps {
  /** Open timer/focus session */
  onOpenTimer: () => void;
  /** Open add task dialog/input */
  onAddTask: () => void;
  /** Open full task library */
  onOpenLibrary: () => void;
  /** Total number of incomplete tasks */
  totalTaskCount: number;
  /** Extra classes */
  className?: string;
}

export function QuickActionBar({
  onOpenTimer,
  onAddTask,
  onOpenLibrary,
  totalTaskCount,
  className,
}: QuickActionBarProps) {
  return (
    <div className={cn(
      "flex gap-3 justify-center flex-wrap",
      className
    )}>
      <Button 
        variant="outline" 
        size="lg"
        onClick={onOpenTimer}
        className="gap-2"
      >
        <Timer className="h-5 w-5" />
        Timer
      </Button>
      
      <Button 
        size="lg"
        onClick={onAddTask}
        className="gap-2"
      >
        <Plus className="h-5 w-5" />
        Add Task
      </Button>
      
      <Button 
        variant="outline"
        size="lg"
        onClick={onOpenLibrary}
        className="gap-2"
      >
        <Library className="h-5 w-5" />
        Browse All
        <Badge variant="secondary" className="ml-1">
          {totalTaskCount}
        </Badge>
      </Button>
    </div>
  );
}
