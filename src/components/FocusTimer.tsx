import { useState, useEffect, memo, useMemo } from 'react';
import { Play, Pause, RotateCcw, Clock, Maximize2, PlusCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimerHub } from './TimerHub';
import { TimerState, TimerSession, Task, Playbook } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CircularTimer } from './CircularTimer';
import { EstimationComparisonCard } from './EstimationComparisonCard';
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
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    timeRemaining: 25 * 60,
    totalTime: 25 * 60,
  });
  const [hubOpen, setHubOpen] = useState(false);
  const [sessions, setSessions] = useLocalStorage<TimerSession[]>('neurulae-timer-sessions', []);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);

  // Track actual elapsed time
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0);

  // Completed task info for comparison card
  const [completedTaskInfo, setCompletedTaskInfo] = useState<CompletedTaskInfo | null>(null);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer.isRunning && timer.timeRemaining > 0) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1),
        }));
      }, 1000);
    }

    // Handle timer complete
    if (timer.isRunning && timer.timeRemaining === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.timeRemaining]);

  const getActualMinutes = () => {
    if (!taskStartTime) return Math.ceil((timer.totalTime - timer.timeRemaining) / 60);
    const totalElapsed = elapsedBeforePause + (timer.isRunning ? Date.now() - taskStartTime : 0);
    return Math.max(1, Math.ceil(totalElapsed / 60000));
  };

  const handleTimerComplete = () => {
    const actualMinutes = getActualMinutes();

    // Save session
    const session: TimerSession = {
      id: crypto.randomUUID(),
      taskId: selectedTaskId && selectedTaskId !== 'none' ? selectedTaskId : undefined,
      startTime: new Date(Date.now() - actualMinutes * 60000).toISOString(),
      endTime: new Date().toISOString(),
      actualMinutes,
      date: new Date().toISOString().split('T')[0],
      timerType: 'interval',
    };
    setSessions([session, ...sessions]);

    // Show completion card if task was selected
    if (selectedTask) {
      setCompletedTaskInfo({
        title: selectedTask.title,
        estimatedMinutes: selectedTask.estimatedMinutes || null,
        actualMinutes,
        taskId: selectedTask.id,
      });

      // Update task with actual time
      if (onUpdateTask) {
        onUpdateTask(selectedTask.id, {
          actualMinutes: (selectedTask.actualMinutes || 0) + actualMinutes,
        });
      }
    } else {
      toast.success('Timer complete!', { icon: '🎉' });
    }

    // Reset timer state
    setTimer(prev => ({ ...prev, isRunning: false }));
    setTaskStartTime(null);
    setElapsedBeforePause(0);
  };

  const toggleTimer = () => {
    if (timer.isRunning) {
      // Pausing
      if (taskStartTime) {
        setElapsedBeforePause(prev => prev + (Date.now() - taskStartTime));
      }
      setTimer(prev => ({ ...prev, isRunning: false }));
    } else {
      // Starting
      setTaskStartTime(Date.now());
      setTimer(prev => ({ ...prev, isRunning: true }));
    }
  };

  const resetTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: false,
      timeRemaining: prev.totalTime,
    }));
    setTaskStartTime(null);
    setElapsedBeforePause(0);
  };

  const setPreset = (minutes: number) => {
    const seconds = minutes * 60;
    setTimer({
      isRunning: false,
      timeRemaining: seconds,
      totalTime: seconds,
    });
    setTaskStartTime(null);
    setElapsedBeforePause(0);
  };

  const handleAddTime = (extraMinutes: number) => {
    setTimer(prev => ({
      ...prev,
      timeRemaining: prev.timeRemaining + extraMinutes * 60,
      totalTime: prev.totalTime + extraMinutes * 60,
    }));
    toast.success(`+${extraMinutes} minutes added`);
  };

  const handleDoneEarly = () => {
    if (timer.isRunning || timer.timeRemaining < timer.totalTime) {
      handleTimerComplete();
    }
  };

  const handleSaveSession = (session: TimerSession) => {
    const enhancedSession = { ...session, taskId: selectedTaskId };
    setSessions([enhancedSession, ...sessions]);
  };

  const handleDismissComparison = () => {
    setCompletedTaskInfo(null);
    resetTimer();
  };

  // When selecting a task with an estimate, use that as the timer duration
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);

    if (taskId && taskId !== 'none' && !timer.isRunning) {
      const task = tasks.find(t => t.id === taskId);
      if (task?.estimatedMinutes && task.estimatedMinutes > 0) {
        const seconds = task.estimatedMinutes * 60;
        setTimer({
          isRunning: false,
          timeRemaining: seconds,
          totalTime: seconds,
        });
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
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Circular Timer */}
          <div className="flex justify-center py-2">
            <CircularTimer
              timeRemaining={timer.timeRemaining}
              totalTime={timer.totalTime}
              size="lg"
              isPaused={!timer.isRunning}
            />
          </div>

          {/* Task Selector */}
          <Select value={selectedTaskId} onValueChange={handleTaskSelect} disabled={timer.isRunning}>
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
                disabled={timer.isRunning}
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
              {timer.isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
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
          {timer.isRunning && (
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
