import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Removed ScrollArea - using native scroll for better mobile compatibility
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  onPlanComplete: (selectedTaskIds: string[]) => void;
  availableMinutesToday?: number; // Total available minutes for work today
}

export function DailyPlanningDialog({
  open,
  onOpenChange,
  tasks,
  onPlanComplete,
  availableMinutesToday = 480, // Default 8 hours
}: DailyPlanningDialogProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Filter to incomplete tasks only
  const incompleteTasks = useMemo(() => {
    return tasks.filter(t => !t.completed);
  }, [tasks]);

  // Calculate total estimated time for selected tasks
  const totalEstimatedMinutes = useMemo(() => {
    return Array.from(selectedTaskIds).reduce((total, taskId) => {
      const task = incompleteTasks.find(t => t.id === taskId);
      return total + (task?.estimatedMinutes || 30); // Default 30 min if not estimated
    }, 0);
  }, [selectedTaskIds, incompleteTasks]);

  // Check if overcommitting
  const isOvercommitting = totalEstimatedMinutes > availableMinutesToday;
  const utilizationPercentage = Math.round((totalEstimatedMinutes / availableMinutesToday) * 100);

  // Get priority tasks (due today or overdue)
  const priorityTasks = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return incompleteTasks
      .filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate <= todayEnd;
      })
      .sort((a, b) => {
        const aDate = new Date(a.dueDate!);
        const bDate = new Date(b.dueDate!);
        return aDate.getTime() - bDate.getTime();
      });
  }, [incompleteTasks]);

  // Get other tasks
  const otherTasks = useMemo(() => {
    const priorityIds = new Set(priorityTasks.map(t => t.id));
    return incompleteTasks.filter(task => !priorityIds.has(task.id));
  }, [incompleteTasks, priorityTasks]);

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleFinishPlanning = () => {
    onPlanComplete(Array.from(selectedTaskIds));
    setSelectedTaskIds(new Set());
    onOpenChange(false);
  };

  const handleSkip = () => {
    setSelectedTaskIds(new Set());
    onPlanComplete([]); // Call with empty array to mark as completed without selecting tasks
    onOpenChange(false);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getWorkloadColor = () => {
    if (utilizationPercentage <= 70) return 'text-green-600 dark:text-green-400';
    if (utilizationPercentage <= 90) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getWorkloadMessage = () => {
    if (selectedTaskIds.size === 0) return "Select 3-5 tasks to focus on today";
    if (utilizationPercentage <= 70) return "Great! You have a realistic workload";
    if (utilizationPercentage <= 90) return "You're at good capacity - stay focused!";
    return "Warning: You may be overcommitting for today";
  };

  const TaskItem = ({ task }: { task: Task }) => {
    const isSelected = selectedTaskIds.has(task.id);
    const estimatedMinutes = task.estimatedMinutes || 30;
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    return (
      <div
        onClick={() => handleToggleTask(task.id)}
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
          isSelected
            ? "bg-primary/10 border-primary shadow-sm"
            : "bg-card border-border hover:bg-accent/50"
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleToggleTask(task.id)}
          className="mt-0.5"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{task.title}</span>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">Overdue</Badge>
            )}
            {task.dueDate && !isOverdue && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
          {task.course && (
            <p className="text-xs text-muted-foreground">{task.course}</p>
          )}
          {task.subtasks && task.subtasks.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks complete
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTime(estimatedMinutes)}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-primary" />
            Plan Your Day
          </DialogTitle>
          <DialogDescription>
            Select 3-5 tasks to focus on today. Be realistic about what you can accomplish!
          </DialogDescription>
        </DialogHeader>

        {/* Workload Overview */}
        <div className="space-y-3 py-3 border-y">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className={cn("h-4 w-4", getWorkloadColor())} />
              <span className={cn("text-sm font-medium", getWorkloadColor())}>
                {getWorkloadMessage()}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
            </div>
          </div>

          {/* Time allocation bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Time allocated</span>
              <span>
                {formatTime(totalEstimatedMinutes)} / {formatTime(availableMinutesToday)}
                {' '}({utilizationPercentage}%)
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  utilizationPercentage <= 70 && "bg-green-500",
                  utilizationPercentage > 70 && utilizationPercentage <= 90 && "bg-yellow-500",
                  utilizationPercentage > 90 && "bg-red-500"
                )}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
          </div>

          {isOvercommitting && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                You've selected {formatTime(totalEstimatedMinutes)} of work, but only have{' '}
                {formatTime(availableMinutesToday)} available. Consider reducing your task list.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Task Lists - Scrollable container with native overflow */}
        <div className="flex-1 overflow-y-auto max-h-[50vh] min-h-[200px] -mx-6 px-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <div className="space-y-4 pr-2 pb-4">
            {/* Priority Tasks */}
            {priorityTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Due Today or Overdue ({priorityTasks.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {priorityTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Tasks */}
            {otherTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Other Tasks ({otherTasks.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {otherTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {incompleteTasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>All tasks complete! Great job!</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={handleSkip} className="flex-1">
            Skip for Now
          </Button>
          <Button
            onClick={handleFinishPlanning}
            disabled={selectedTaskIds.size === 0}
            className="flex-1"
          >
            Start My Day ({selectedTaskIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
