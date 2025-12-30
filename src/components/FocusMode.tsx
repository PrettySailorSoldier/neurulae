import { useState, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2, Clock, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Task } from '@/types';
import { cn } from '@/lib/utils';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onCompleteTask?: (taskId: string) => void;
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

export function FocusMode({
  isOpen,
  onClose,
  task,
  onCompleteTask,
  tasks,
  onSelectTask,
}: FocusModeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(task || null);

  // Update selected task when prop changes
  useEffect(() => {
    if (task) {
      setSelectedTask(task);
    }
  }, [task]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' && !e.target?.toString().includes('input')) {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleReset = useCallback(() => {
    setElapsedSeconds(0);
    setIsRunning(false);
  }, []);

  const handleComplete = useCallback(() => {
    if (selectedTask && onCompleteTask) {
      onCompleteTask(selectedTask.id);
      setSelectedTask(null);
      handleReset();
    }
  }, [selectedTask, onCompleteTask, handleReset]);

  const handleSelectTask = useCallback((task: Task) => {
    setSelectedTask(task);
    handleReset();
    if (onSelectTask) {
      onSelectTask(task);
    }
  }, [handleReset, onSelectTask]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = selectedTask?.estimatedMinutes
    ? Math.min((elapsedSeconds / (selectedTask.estimatedMinutes * 60)) * 100, 100)
    : 0;

  const incompleteTasks = tasks.filter((t) => !t.completed);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Keyboard hint */}
      <div className="absolute top-4 left-4 text-xs text-muted-foreground">
        <span className="bg-muted px-2 py-1 rounded">Esc</span> to exit
        <span className="mx-2">|</span>
        <span className="bg-muted px-2 py-1 rounded">Space</span> to pause/resume
      </div>

      <div className="w-full max-w-2xl px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Zap className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Focus Mode</h1>
          </div>
          <p className="text-muted-foreground">
            Eliminate distractions. Focus on what matters.
          </p>
        </div>

        {/* Current Task */}
        {selectedTask ? (
          <Card className="p-6 bg-card/50 backdrop-blur border-2 border-primary/20">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Target className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h2 className="text-xl font-semibold">{selectedTask.title}</h2>
                    {selectedTask.estimatedMinutes && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        Estimated: {selectedTask.estimatedMinutes} minutes
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleComplete}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Complete
                </Button>
              </div>

              {/* Progress bar */}
              {selectedTask.estimatedMinutes && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(elapsedSeconds)} elapsed</span>
                    <span>{selectedTask.estimatedMinutes}:00 estimated</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-6 bg-card/50 backdrop-blur border-dashed border-2">
            <div className="text-center space-y-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h2 className="text-lg font-semibold">No task selected</h2>
                <p className="text-sm text-muted-foreground">
                  Select a task below to focus on
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Timer Display */}
        <div className="text-center space-y-6">
          <div
            className={cn(
              'text-7xl md:text-8xl font-mono font-bold tabular-nums transition-colors',
              isRunning ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {formatTime(elapsedSeconds)}
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
              className="h-14 w-14 rounded-full"
              disabled={elapsedSeconds === 0}
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              onClick={() => setIsRunning(!isRunning)}
              className="h-20 w-20 rounded-full text-lg"
            >
              {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>
            <div className="h-14 w-14" /> {/* Spacer for symmetry */}
          </div>
        </div>

        {/* Task Selection */}
        {incompleteTasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground text-center">
              Switch Task
            </h3>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {incompleteTasks.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTask(t)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                    'hover:bg-accent hover:border-accent',
                    selectedTask?.id === t.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card/50 border-border'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{t.title}</span>
                    {t.estimatedMinutes && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {t.estimatedMinutes}m
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
