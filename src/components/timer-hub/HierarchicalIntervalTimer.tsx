import { useState, useCallback } from 'react';
import { HierarchicalInterval, IntervalStep, Task } from '@/types';
import { useGlobalTimer } from '@/hooks/useGlobalTimer';
import { IntervalBuilder } from './IntervalBuilder';
import { HierarchicalTimerView, HierarchicalCompletionSummary } from './HierarchicalTimerView';
import { toast } from 'sonner';

interface HierarchicalIntervalTimerProps {
  tasks?: Task[];
  prefilledTask?: Task | null; // Task to pre-fill the builder with
  onSaveSession?: (taskId: string | undefined, minutes: number) => void;
  onUpdateTask?: (task: Task) => void; // For saving interval session to task
}

interface CompletionInfo {
  interval: HierarchicalInterval;
  actualMinutes: number;
}

export function HierarchicalIntervalTimer({ tasks = [], prefilledTask, onSaveSession, onUpdateTask }: HierarchicalIntervalTimerProps) {
  const [completionInfo, setCompletionInfo] = useState<CompletionInfo | null>(null);
  const [lastInterval, setLastInterval] = useState<Omit<HierarchicalInterval, 'currentStepIndex' | 'elapsedDuration'> | null>(null);

  // Callbacks for timer events
  const handleStepComplete = useCallback((completedStep: IntervalStep, nextStep: IntervalStep | null, stepIndex: number) => {
    if (nextStep) {
      toast.success(`✓ ${completedStep.name} complete!`, {
        description: `Next: ${nextStep.name}`,
      });
    } else {
      toast.success(`✓ ${completedStep.name} complete!`, {
        description: 'All steps finished!',
      });
    }
  }, []);

  const handleHierarchicalComplete = useCallback((interval: HierarchicalInterval, actualMinutes: number) => {
    setCompletionInfo({ interval, actualMinutes });

    if (onSaveSession) {
      onSaveSession(interval.taskId, actualMinutes);
    }

    // Log session to linked task if available
    if (interval.taskId && onUpdateTask) {
      const linkedTask = tasks.find(t => t.id === interval.taskId);
      if (linkedTask) {
        const completedSteps = interval.steps.filter(s => s.isComplete).length;
        const newSession = {
          id: crypto.randomUUID(),
          completedAt: new Date().toISOString(),
          actualMinutes,
          stepsCompleted: completedSteps,
          totalSteps: interval.steps.length,
        };

        onUpdateTask({
          ...linkedTask,
          actualMinutes: (linkedTask.actualMinutes || 0) + actualMinutes,
          intervalSessions: [...(linkedTask.intervalSessions || []), newSession],
        });

        toast.success('Time logged to task', {
          description: `+${actualMinutes}m added to "${linkedTask.title}"`,
        });
      }
    }
  }, [onSaveSession, onUpdateTask, tasks]);

  const handleTimerComplete = useCallback((taskId: string | null, actualMinutes: number) => {
    // This is handled by onHierarchicalComplete for hierarchical intervals
  }, []);

  const timer = useGlobalTimer({
    onStepComplete: handleStepComplete,
    onHierarchicalComplete: handleHierarchicalComplete,
    onComplete: handleTimerComplete,
  });

  // Check if we have an active hierarchical interval
  const isHierarchicalActive = timer.timerType === 'hierarchical-interval' && timer.hierarchicalInterval;

  // Start a new interval
  const handleStartInterval = useCallback((interval: Omit<HierarchicalInterval, 'currentStepIndex' | 'elapsedDuration'>) => {
    setLastInterval(interval);
    setCompletionInfo(null);
    timer.startHierarchicalInterval(interval);
    toast.success(`Starting ${interval.name}`, {
      description: `${interval.steps.length} steps • ${Math.round(interval.totalDuration / 60)} minutes total`,
    });
  }, [timer]);

  // Handle stop
  const handleStop = useCallback(() => {
    timer.stopTimer();
    toast.info('Interval stopped');
  }, [timer]);

  // Handle add time
  const handleAddTime = useCallback((seconds: number) => {
    timer.addTime(seconds);
    toast.success(`+${Math.round(seconds / 60)} minute${seconds >= 120 ? 's' : ''} added`);
  }, [timer]);

  // Handle complete early (done early on current step)
  const handleCompleteEarly = useCallback(() => {
    timer.skipToNextStep();
  }, [timer]);

  // Dismiss completion summary
  const handleDismissCompletion = useCallback(() => {
    setCompletionInfo(null);
  }, []);

  // Restart the same interval
  const handleRestart = useCallback(() => {
    if (lastInterval) {
      setCompletionInfo(null);
      timer.startHierarchicalInterval(lastInterval);
      toast.success(`Restarting ${lastInterval.name}`);
    }
  }, [lastInterval, timer]);

  // Show completion summary if interval just finished
  if (completionInfo) {
    return (
      <HierarchicalCompletionSummary
        interval={completionInfo.interval}
        actualMinutes={completionInfo.actualMinutes}
        onDismiss={handleDismissCompletion}
        onRestart={lastInterval ? handleRestart : undefined}
      />
    );
  }

  // Show running timer view if interval is active
  if (isHierarchicalActive && timer.hierarchicalInterval) {
    return (
      <HierarchicalTimerView
        interval={timer.hierarchicalInterval}
        timeRemaining={timer.timeRemaining}
        isRunning={timer.isRunning}
        isPaused={timer.isPaused}
        onPause={timer.pauseTimer}
        onResume={timer.resumeTimer}
        onStop={handleStop}
        onSkipStep={timer.skipToNextStep}
        onAddTime={handleAddTime}
        onCompleteEarly={handleCompleteEarly}
      />
    );
  }

  // Handle saving template link to task
  const handleLinkTemplateToTask = useCallback((taskId: string, templateId: string) => {
    if (!onUpdateTask) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      onUpdateTask({
        ...task,
        linkedIntervalTemplateId: templateId,
      });
      toast.success('Timer plan saved to task');
    }
  }, [tasks, onUpdateTask]);

  // Show builder when no interval is active
  return (
    <IntervalBuilder
      tasks={tasks}
      prefilledTask={prefilledTask}
      onStartInterval={handleStartInterval}
      onLinkTemplateToTask={handleLinkTemplateToTask}
    />
  );
}
