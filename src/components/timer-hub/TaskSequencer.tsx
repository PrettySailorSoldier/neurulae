import { useState, useEffect } from 'react';
import { TimedTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, SkipForward, Trash2, Plus, GripVertical } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';

interface TaskSequencerProps {
  onSaveSession: (taskId: string | undefined, minutes: number) => void;
}

export function TaskSequencer({ onSaveSession }: TaskSequencerProps) {
  const [tasks, setTasks] = useState<TimedTask[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pauseBetweenTasks, setPauseBetweenTasks] = useState(true);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [onBreak, setOnBreak] = useState(false);

  const totalMinutes = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const completedMinutes = tasks
    .slice(0, currentTaskIndex)
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);

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

  const handleTaskComplete = () => {
    const currentTask = tasks[currentTaskIndex];
    
    if (onBreak) {
      // Break completed, move to next task
      setOnBreak(false);
      if (currentTaskIndex + 1 < tasks.length) {
        setCurrentTaskIndex(prev => prev + 1);
        setTimeRemaining(tasks[currentTaskIndex + 1].estimatedMinutes * 60);
      } else {
        // All tasks complete
        setIsRunning(false);
        setTimeRemaining(0);
      }
    } else {
      // Task completed
      if (currentTask) {
        onSaveSession(currentTask.linkedTaskId, currentTask.estimatedMinutes);
        setTasks(prev => prev.map((t, i) => 
          i === currentTaskIndex ? { ...t, completed: true } : t
        ));
      }

      if (pauseBetweenTasks && currentTaskIndex + 1 < tasks.length) {
        // Start break
        setOnBreak(true);
        setTimeRemaining(breakMinutes * 60);
      } else if (currentTaskIndex + 1 < tasks.length) {
        // Move to next task
        setCurrentTaskIndex(prev => prev + 1);
        setTimeRemaining(tasks[currentTaskIndex + 1].estimatedMinutes * 60);
      } else {
        // All tasks complete
        setIsRunning(false);
        setTimeRemaining(0);
      }
    }
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
    }
    setIsRunning(true);
  };

  const handleSkip = () => {
    if (currentTaskIndex + 1 < tasks.length) {
      const nextTask = tasks[currentTaskIndex + 1];
      setCurrentTaskIndex(prev => prev + 1);
      setTimeRemaining(nextTask.estimatedMinutes * 60);
      setOnBreak(false);
    }
  };

  const currentTask = tasks[currentTaskIndex];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="space-y-6">
      {/* Accumulated Time Display */}
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <div className="text-sm text-muted-foreground mb-2">
          {onBreak ? 'Break Time' : currentTask ? `Current: ${currentTask.title}` : 'No tasks queued'}
        </div>
        <div className="text-5xl font-bold mb-4">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div>Total Time: {formatDuration(totalMinutes)}</div>
          <div>•</div>
          <div>Completed: {formatDuration(completedMinutes)}</div>
          <div>•</div>
          <div>Remaining: {formatDuration(totalMinutes - completedMinutes)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={() => setIsRunning(!isRunning)}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
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
      <div className="flex items-center gap-4 justify-center">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pauseBetweenTasks}
            onChange={(e) => setPauseBetweenTasks(e.target.checked)}
            className="rounded border-border"
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
              className="w-20 bg-input border-border"
              min="1"
            />
            <span className="text-sm text-muted-foreground">min</span>
          </div>
        )}
      </div>

      {/* Task Queue */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Task Queue</h4>
          <Button onClick={handleAddTask} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tasks yet. Add your first task to get started!
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                  index === currentTaskIndex && !onBreak
                    ? 'bg-primary/20 border-primary'
                    : task.completed
                    ? 'bg-muted/50 border-muted'
                    : 'bg-card border-border'
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <Input
                  value={task.title}
                  onChange={(e) => handleUpdateTask(task.id, 'title', e.target.value)}
                  className="flex-1 bg-input border-border"
                  disabled={task.completed}
                />
                <Input
                  type="number"
                  value={task.estimatedMinutes}
                  onChange={(e) => handleUpdateTask(task.id, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                  className="w-20 bg-input border-border"
                  min="1"
                  disabled={task.completed}
                />
                <span className="text-sm text-muted-foreground">min</span>
                <Button
                  onClick={() => handleDeleteTask(task.id)}
                  variant="ghost"
                  size="icon"
                  disabled={task.completed}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}