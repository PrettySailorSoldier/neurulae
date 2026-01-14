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
  /** Whether timer is currently running */
  timerIsRunning?: boolean;
  /** Elapsed seconds on current timer */
  elapsedSeconds?: number;
  /** Title of task being timed (if any) */
  timedTaskTitle?: string | null;
  /** Extra classes */
  className?: string;
}

/**
 * Format seconds into MM:SS or H:MM:SS display
 */
function formatElapsedTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function QuickActionBar({
  onOpenTimer,
  onAddTask,
  onOpenLibrary,
  totalTaskCount,
  timerIsRunning = false,
  elapsedSeconds = 0,
  timedTaskTitle,
  className,
}: QuickActionBarProps) {
  return (
    <div className={cn(
      "flex gap-3 justify-center flex-wrap",
      className
    )}>
      <Button 
        variant={timerIsRunning ? "default" : "outline"}
        size="lg"
        onClick={onOpenTimer}
        className={cn(
          "gap-2 relative",
          timerIsRunning && "animate-pulse-glow"
        )}
        title={timerIsRunning && timedTaskTitle ? `Working on: ${timedTaskTitle}` : undefined}
      >
        <Timer className="h-5 w-5" />
        Timer
        {timerIsRunning && (
          <Badge 
            variant="secondary" 
            className="ml-1 animate-pulse tabular-nums"
          >
            {formatElapsedTime(elapsedSeconds)}
          </Badge>
        )}
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
