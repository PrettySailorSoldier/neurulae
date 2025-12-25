import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TimedTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, SkipForward, Trash2, Plus, GripVertical, Coffee, Clock, PlusCircle, CheckCircle } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { CircularTimer } from '@/components/CircularTimer';
import { EstimationComparisonCard } from '@/components/EstimationComparisonCard';
import { cn } from '@/lib/utils';

interface TaskSequencerProps {
  onSaveSession: (taskId: string | undefined, minutes: number) => void;
}

interface CompletedTaskInfo {
  title: string;
  estimatedMinutes: number;
  actualMinutes: number;
  taskId?: string;
}

export function TaskSequencer({ onSaveSession }: TaskSequencerProps) {
  const [tasks, setTasks] = useLocalStorage<TimedTask[]>('neurulae-task-sequence', []);
  const [currentTaskIndex, setCurrentTaskIndex] = useLocalStorage('neurulae-current-task-index', 0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pauseBetweenTasks, setPauseBetweenTasks] = useLocalStorage('neurulae-pause-between-tasks', true);
  const [breakMinutes, setBreakMinutes] = useLocalStorage('neurulae-break-minutes', 5);
  const [onBreak, setOnBreak] = useState(false);

  // Track elapsed time for actual duration calculation
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0);

  // Completed task info for estimation comparison card
  const [completedTaskInfo, setCompletedTaskInfo] = useState<CompletedTaskInfo | null>(null);

  // Calculate totals
  const totalMinutes = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const completedMinutes = tasks
    .slice(0, currentTaskIndex)
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const remainingMinutes = totalMinutes - completedMinutes;

  // Tasks with vs without estimates
  const unestimatedTaskCount = tasks.filter(t => !t.completed && t.estimatedMinutes === 0).length;

  // Calculate "Done By" time
  const doneByTime = useMemo(() => {
    if (tasks.length === 0 || remainingMinutes <= 0) return null;

    const now = new Date();
    const doneBy = new Date(now.getTime() + remainingMinutes * 60 * 1000);

    return doneBy.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [tasks.length, remainingMinutes]);

  // Timer tick effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTaskComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, currentTaskIndex, onBreak]);

  // Calculate actual time spent on current task
  const getActualMinutes = () => {
    if (!taskStartTime) return 0;
    const totalElapsed = elapsedBeforePause + (isRunning ? Date.now() - taskStartTime : 0);
    return Math.ceil(totalElapsed / 60000); // Convert to minutes, round up
  };

  const handleTaskComplete = () => {
    const currentTask = tasks[currentTaskIndex];

    if (onBreak) {
      toast.success('Break complete! Back to work', { icon: '💪' });
      setOnBreak(false);
      if (currentTaskIndex + 1 < tasks.length) {
        setCurrentTaskIndex(prev => prev + 1);
        const nextTask = tasks[currentTaskIndex + 1];
        setTimeRemaining(nextTask.estimatedMinutes * 60);
        // Reset time tracking for new task
        setTaskStartTime(Date.now());
        setElapsedBeforePause(0);
      } else {
        handleAllComplete();
      }
    } else {
      if (currentTask) {
        const actualMinutes = getActualMinutes();
        onSaveSession(currentTask.linkedTaskId, actualMinutes);

        // Show estimation comparison card
        setCompletedTaskInfo({
          title: currentTask.title,
          estimatedMinutes: currentTask.estimatedMinutes,
          actualMinutes: actualMinutes,
          taskId: currentTask.linkedTaskId,
        });

        setTasks(prev => prev.map((t, i) =>
          i === currentTaskIndex ? { ...t, completed: true } : t
        ));
      }

      if (pauseBetweenTasks && currentTaskIndex + 1 < tasks.length) {
        setOnBreak(true);
        setTimeRemaining(breakMinutes * 60);
        toast.success('Break time! Relax and recharge', { icon: '☕' });
      } else if (currentTaskIndex + 1 < tasks.length) {
        advanceToNextTask();
      } else {
        handleAllComplete();
      }
    }
  };

  const advanceToNextTask = () => {
    setCurrentTaskIndex(prev => prev + 1);
    const nextTask = tasks[currentTaskIndex + 1];
    if (nextTask) {
      setTimeRemaining(nextTask.estimatedMinutes * 60);
      setTaskStartTime(Date.now());
      setElapsedBeforePause(0);
    }
  };

  const handleAllComplete = () => {
    toast.success('All tasks complete! Amazing work!', {
      icon: '🎉',
      description: `You completed ${tasks.length} tasks!`
    });
    setIsRunning(false);
    setTimeRemaining(0);
    setTaskStartTime(null);
    setElapsedBeforePause(0);
  };

  const handleAddTask = () => {
    const newTask: TimedTask = {
      id: crypto.randomUUID(),
      title: 'New Task',
      estimatedMinutes: 25,
      completed: false,
      order: tasks.length,
    };
    setTasks([...tasks, newTask]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleUpdateTask = (id: string, field: keyof TimedTask, value: any) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleStart = () => {
    if (tasks.length === 0) return;

    if (!isRunning && timeRemaining === 0) {
      const firstTask = tasks[currentTaskIndex];
      setTimeRemaining(firstTask.estimatedMinutes * 60);
      setTaskStartTime(Date.now());
      setElapsedBeforePause(0);
    } else if (!isRunning) {
      // Resuming from pause
      setTaskStartTime(Date.now());
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    if (isRunning && taskStartTime) {
      // Save elapsed time before pause
      setElapsedBeforePause(prev => prev + (Date.now() - taskStartTime));
    }
    setIsRunning(false);
  };

  const handleToggle = () => {
    if (isRunning) {
      handlePause();
    } else {
      handleStart();
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setTasks(items.map((task, i) => ({ ...task, order: i })));
  };

  const handleSkip = () => {
    if (currentTaskIndex + 1 < tasks.length) {
      const nextTask = tasks[currentTaskIndex + 1];
      setCurrentTaskIndex(prev => prev + 1);
      setTimeRemaining(nextTask.estimatedMinutes * 60);
      setOnBreak(false);
      setTaskStartTime(Date.now());
      setElapsedBeforePause(0);
    }
  };

  const handleAddTime = (extraMinutes: number) => {
    setTimeRemaining(prev => prev + extraMinutes * 60);
    toast.success(`+${extraMinutes} minutes added`);
  };

  const handleDoneEarly = () => {
    if (!tasks[currentTaskIndex]) return;
    handleTaskComplete();
  };

  const handleDismissComparison = () => {
    setCompletedTaskInfo(null);
  };

  const handleStartNextFromComparison = () => {
    setCompletedTaskInfo(null);
    if (currentTaskIndex + 1 < tasks.length && !isRunning) {
      handleStart();
    }
  };

  const currentTask = tasks[currentTaskIndex];
  const nextTask = currentTaskIndex + 1 < tasks.length ? tasks[currentTaskIndex + 1] : null;
  const overallProgress = ((completedMinutes / totalMinutes) * 100) || 0;

  return (
    <div className="space-y-6">
      {/* Estimation Comparison Card Overlay */}
      {completedTaskInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <EstimationComparisonCard
            taskTitle={completedTaskInfo.title}
            estimatedMinutes={completedTaskInfo.estimatedMinutes}
            actualMinutes={completedTaskInfo.actualMinutes}
            onDismiss={handleDismissComparison}
            onStartNext={nextTask ? handleStartNextFromComparison : undefined}
            nextTaskTitle={nextTask?.title}
          />
        </div>
      )}

      {/* Main Timer Display */}
      <div className={cn(
        'border-2 rounded-xl p-6 text-center transition-all',
        onBreak
          ? 'bg-gradient-to-br from-accent/20 to-accent/5 border-accent'
          : 'bg-gradient-to-br from-primary/10 to-card border-primary/30'
      )}>
        {/* Current Task Label */}
        <div className="text-sm font-semibold mb-4 flex items-center justify-center gap-2">
          {onBreak ? (
            <>
              <Coffee className="h-4 w-4 text-accent" />
              <span className="text-accent">Break Time</span>
            </>
          ) : currentTask ? (
            <span className="text-primary truncate max-w-xs">{currentTask.title}</span>
          ) : (
            <span className="text-muted-foreground">No tasks queued</span>
          )}
        </div>

        {/* Circular Timer */}
        <div className="flex justify-center mb-4">
          <CircularTimer
            timeRemaining={timeRemaining}
            totalTime={currentTask ? currentTask.estimatedMinutes * 60 : breakMinutes * 60}
            size="xl"
            isPaused={!isRunning}
          />
        </div>

        {/* Done By Time */}
        {doneByTime && !onBreak && (
          <div className="flex items-center justify-center gap-2 mb-4 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Done by:</span>
            <span className="font-semibold text-primary">{doneByTime}</span>
            {unestimatedTaskCount > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                ({unestimatedTaskCount} task{unestimatedTaskCount !== 1 ? 's' : ''} unestimated)
              </span>
            )}
          </div>
        )}

        {/* Overall Stats */}
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground flex-wrap">
          <div>Total: {formatDuration(totalMinutes)}</div>
          <div className="text-primary/50">•</div>
          <div className="text-green-500 font-medium">Done: {formatDuration(completedMinutes)}</div>
          <div className="text-primary/50">•</div>
          <div>Left: {formatDuration(remainingMinutes)}</div>
        </div>

        {/* Overall Progress Bar */}
        <div className="max-w-lg mx-auto mt-4">
          <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {tasks.filter(t => t.completed).length} of {tasks.length} tasks complete
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button
          onClick={handleToggle}
          size="lg"
          className="bg-primary hover:bg-primary/90"
          disabled={tasks.length === 0}
        >
          {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>

        {isRunning && (
          <>
            <Button
              onClick={() => handleAddTime(5)}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              +5 min
            </Button>
            <Button
              onClick={handleDoneEarly}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Done Early
            </Button>
          </>
        )}

        <Button
          onClick={handleSkip}
          variant="outline"
          size="lg"
          disabled={currentTaskIndex >= tasks.length - 1}
        >
          <SkipForward className="h-5 w-5 mr-2" />
          Skip
        </Button>
      </div>

      {/* Settings */}
      <div className="flex items-center gap-4 justify-center flex-wrap">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={pauseBetweenTasks}
            onChange={(e) => setPauseBetweenTasks(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          Pause between tasks
        </label>
        {pauseBetweenTasks && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Break:</span>
            <Input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 5))}
              className="w-16 bg-input border-border text-center"
              min="1"
            />
            <span className="text-sm text-muted-foreground">min</span>
          </div>
        )}
      </div>

      {/* Task Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Task Queue</h4>
          <Button onClick={handleAddTask} size="sm" variant="outline" disabled={isRunning}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="mb-2">No tasks yet</p>
            <p className="text-sm">Add your first task to get started!</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    'space-y-2 transition-colors rounded-lg',
                    snapshot.isDraggingOver && 'bg-primary/5 p-2'
                  )}
                >
                  {tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={isRunning || task.completed}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            'relative flex items-center gap-2 p-3 rounded-lg border transition-all',
                            index === currentTaskIndex && !onBreak && !task.completed
                              ? 'bg-primary/20 border-primary shadow-md ring-1 ring-primary/30'
                              : task.completed
                              ? 'bg-muted/30 border-muted/50 opacity-60'
                              : 'bg-card border-border hover:border-primary/50',
                            snapshot.isDragging && 'shadow-lg rotate-1 scale-105'
                          )}
                        >
                          <div {...provided.dragHandleProps}>
                            <GripVertical className={cn(
                              'h-5 w-5',
                              isRunning || task.completed
                                ? 'text-muted-foreground/30'
                                : 'text-muted-foreground cursor-grab active:cursor-grabbing'
                            )} />
                          </div>

                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <div className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                              task.completed
                                ? 'bg-green-500/20 text-green-500'
                                : index === currentTaskIndex && !onBreak
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-primary/10 text-primary'
                            )}>
                              {task.completed ? '✓' : index + 1}
                            </div>
                            <Input
                              value={task.title}
                              onChange={(e) => handleUpdateTask(task.id, 'title', e.target.value)}
                              className="flex-1 bg-transparent border-0 focus-visible:ring-0 font-medium truncate"
                              disabled={task.completed || isRunning}
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Input
                              type="number"
                              value={task.estimatedMinutes}
                              onChange={(e) => handleUpdateTask(task.id, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                              className="w-14 text-center bg-input text-sm"
                              min="1"
                              disabled={task.completed || isRunning}
                            />
                            <span className="text-xs text-muted-foreground w-6">min</span>
                          </div>

                          <Button
                            onClick={() => handleDeleteTask(task.id)}
                            variant="ghost"
                            size="icon"
                            className="hover:bg-destructive/20 hover:text-destructive h-8 w-8"
                            disabled={task.completed || isRunning}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
