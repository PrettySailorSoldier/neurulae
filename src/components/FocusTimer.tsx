import { useState, useMemo, memo } from 'react';
import { Play, Pause, RotateCcw, Clock, Maximize2, PlusCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimerHub } from './TimerHub';
import { TimerSession, Task, Playbook } from '@/types';
import { CircularTimer } from './CircularTimer';
import { EstimationComparisonCard } from './EstimationComparisonCard';
import { useGlobalTimer } from '@/hooks/useGlobalTimer';
import { toast } from 'sonner';

const PRESETS = [
  { label: '25 min', minutes: 25 },
  { label: '15 min', minutes: 15 },
  { label: '5 min', minutes: 5 },
];

interface FocusTimerProps {
  tasks?: Task[];
  playbooks?: Playbook[];
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

interface CompletedTaskInfo {
  title: string;
  estimatedMinutes: number | null;
  actualMinutes: number;
  taskId: string;
}

export const FocusTimer = memo(function FocusTimer({ tasks = [], playbooks = [], onUpdateTask }: FocusTimerProps) {
  const [hubOpen, setHubOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [presetDuration, setPresetDuration] = useState(25 * 60); // Default 25 minutes in seconds

  // Completed task info for comparison card
  const [completedTaskInfo, setCompletedTaskInfo] = useState<CompletedTaskInfo | null>(null);

  // Use global timer for state synchronization across components
  const {
    isRunning,
    isPaused,
    timeRemaining,
    totalTime,
    taskId: activeTaskId,
    taskTitle: activeTaskTitle,
    hasActiveTimer,
    sessions,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    addTime,
    completeEarly,
    getActualMinutes,
  } = useGlobalTimer({
    onComplete: (taskId, actualMinutes) => {
      const task = taskId ? tasks.find(t => t.id === taskId) : null;

      if (task) {
        // Show completion card with estimation comparison
        setCompletedTaskInfo({
          title: task.title,
          estimatedMinutes: task.estimatedMinutes || null,
          actualMinutes,
          taskId: task.id,
        });

        // Update task with actual time
        if (onUpdateTask) {
          onUpdateTask(task.id, {
            actualMinutes: (task.actualMinutes || 0) + actualMinutes,
          });
        }
      } else {
        toast.success('Timer complete!', { icon: '🎉' });
      }
    },
  });

  // Memoize task/playbook options to prevent recalculation on every render
  const taskOptions = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed).slice(0, 20);
    const activePlaybooks = playbooks.slice(0, 10);
    return { activeTasks, activePlaybooks };
  }, [tasks, playbooks]);

  // Get selected task object
  const selectedTask = useMemo(() => {
    if (!selectedTaskId || selectedTaskId === 'none') return null;
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, tasks]);

  // Determine display values - use global timer state if running, otherwise use local preset
  const displayTimeRemaining = hasActiveTimer ? timeRemaining : presetDuration;
  const displayTotalTime = hasActiveTimer ? totalTime : presetDuration;
  const displayIsRunning = hasActiveTimer && isRunning && !isPaused;

  const toggleTimer = () => {
    if (hasActiveTimer) {
      if (isPaused) {
        resumeTimer();
      } else {
        pauseTimer();
      }
    } else {
      // Start a new timer
      const task = selectedTask ? { id: selectedTask.id, title: selectedTask.title } : null;
      startTimer(presetDuration, 'focus', task);
    }
  };

  const resetTimer = () => {
    if (hasActiveTimer) {
      stopTimer();
    }
    setPresetDuration(25 * 60); // Reset to default
  };

  const setPreset = (minutes: number) => {
    const seconds = minutes * 60;
    setPresetDuration(seconds);
    // If timer is running, stop it first
    if (hasActiveTimer) {
      stopTimer();
    }
  };

  const handleAddTime = (extraMinutes: number) => {
    if (hasActiveTimer) {
      addTime(extraMinutes * 60);
      toast.success(`+${extraMinutes} minutes added`);
    }
  };

  const handleDoneEarly = () => {
    if (hasActiveTimer) {
      completeEarly();
    }
  };

  const handleSaveSession = (session: TimerSession) => {
    // Sessions are automatically saved by useGlobalTimer
    // This callback is for compatibility with TimerHub
  };

  const handleDismissComparison = () => {
    setCompletedTaskInfo(null);
    setPresetDuration(25 * 60);
  };

  // When selecting a task with an estimate, use that as the timer duration
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);

    if (taskId && taskId !== 'none' && !hasActiveTimer) {
      const task = tasks.find(t => t.id === taskId);
      if (task?.estimatedMinutes && task.estimatedMinutes > 0) {
        setPresetDuration(task.estimatedMinutes * 60);
      }
    }
  };

  return (
    <>
      {/* Estimation Comparison Card Overlay */}
      {completedTaskInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <EstimationComparisonCard
            taskTitle={completedTaskInfo.title}
            estimatedMinutes={completedTaskInfo.estimatedMinutes}
            actualMinutes={completedTaskInfo.actualMinutes}
            onDismiss={handleDismissComparison}
          />
        </div>
      )}

      <Card className="card-elevated border-2" data-tutorial="focus-timer">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-base">Focus Timer</span>
            {hasActiveTimer && activeTaskTitle && (
              <span className="text-xs font-normal text-muted-foreground truncate max-w-[150px]">
                - {activeTaskTitle}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Circular Timer */}
          <div className="flex justify-center py-2">
            <CircularTimer
              timeRemaining={displayTimeRemaining}
              totalTime={displayTotalTime}
              size="lg"
              isPaused={!displayIsRunning}
            />
          </div>

          {/* Task Selector */}
          <Select
            value={hasActiveTimer ? (activeTaskId || 'none') : selectedTaskId}
            onValueChange={handleTaskSelect}
            disabled={hasActiveTimer}
          >
            <SelectTrigger className="w-full text-xs h-9">
              <SelectValue placeholder="Select task (optional)" />
            </SelectTrigger>
            <SelectContent className="max-h-64 z-[100]">
              <SelectItem value="none">No task selected</SelectItem>
              {taskOptions.activeTasks.length > 0 && (
                <>
                  <SelectItem value="tasks-header" disabled className="font-semibold text-primary">
                    Tasks
                  </SelectItem>
                  {taskOptions.activeTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                      {task.estimatedMinutes && (
                        <span className="text-muted-foreground ml-2">({task.estimatedMinutes}m)</span>
                      )}
                    </SelectItem>
                  ))}
                </>
              )}
              {taskOptions.activePlaybooks.length > 0 && (
                <>
                  <SelectItem value="playbooks-header" disabled className="font-semibold text-primary">
                    Playbooks
                  </SelectItem>
                  {taskOptions.activePlaybooks.map((playbook) => (
                    <SelectItem key={playbook.id} value={playbook.id}>
                      📖 {playbook.title}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          {/* Presets */}
          <div className="flex gap-2 justify-center">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => setPreset(preset.minutes)}
                disabled={hasActiveTimer}
                className="text-xs h-8"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Main Controls */}
          <div className="flex gap-2 justify-center flex-wrap">
            <Button
              onClick={toggleTimer}
              className="btn-primary"
            >
              {hasActiveTimer && !isPaused ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : hasActiveTimer && isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              onClick={resetTimer}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Running Controls */}
          {hasActiveTimer && (
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => handleAddTime(5)}
                variant="outline"
                size="sm"
                className="text-xs gap-1"
              >
                <PlusCircle className="h-3 w-3" />
                +5 min
              </Button>
              <Button
                onClick={handleDoneEarly}
                variant="outline"
                size="sm"
                className="text-xs gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Done Early
              </Button>
            </div>
          )}

          {/* Advanced Timers Button */}
          <Button
            onClick={() => setHubOpen(true)}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Advanced Timers
          </Button>
        </CardContent>

        <TimerHub
          open={hubOpen}
          onOpenChange={setHubOpen}
          onSaveSession={handleSaveSession}
        />
      </Card>
    </>
  );
});
