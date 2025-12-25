import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { ActiveIntention, IntentionInterruption, Task } from '@/types';

interface UseActiveIntentionOptions {
  tasks: Task[];
  onTaskComplete?: (taskId: string) => void;
}

export function useActiveIntention({ tasks, onTaskComplete }: UseActiveIntentionOptions) {
  const [activeIntention, setActiveIntention] = useLocalStorage<ActiveIntention | null>(
    'neurulae-active-intention',
    null
  );

  // Get the current task object if it exists
  const currentTask = useMemo(() => {
    if (!activeIntention) return null;
    return tasks.find(t => t.id === activeIntention.taskId) || null;
  }, [activeIntention, tasks]);

  // Start working on a task
  const startIntention = useCallback((task: Task) => {
    const now = new Date().toISOString();
    setActiveIntention({
      taskId: task.id,
      taskName: task.title,
      startedAt: now,
      isPaused: false,
      pausedAt: null,
      totalPausedTime: 0,
      interruptions: [],
    });
  }, [setActiveIntention]);

  // Pause the current intention with optional note
  const pauseIntention = useCallback((note?: string) => {
    if (!activeIntention || activeIntention.isPaused) return;

    const now = new Date().toISOString();
    const interruption: IntentionInterruption | null = note ? {
      id: crypto.randomUUID(),
      note,
      timestamp: now,
    } : null;

    setActiveIntention({
      ...activeIntention,
      isPaused: true,
      pausedAt: now,
      interruptions: interruption
        ? [...activeIntention.interruptions, interruption]
        : activeIntention.interruptions,
    });
  }, [activeIntention, setActiveIntention]);

  // Resume the current intention
  const resumeIntention = useCallback(() => {
    if (!activeIntention || !activeIntention.isPaused || !activeIntention.pausedAt) return;

    const now = Date.now();
    const pausedAt = new Date(activeIntention.pausedAt).getTime();
    const pausedDuration = now - pausedAt;

    setActiveIntention({
      ...activeIntention,
      isPaused: false,
      pausedAt: null,
      totalPausedTime: activeIntention.totalPausedTime + pausedDuration,
    });
  }, [activeIntention, setActiveIntention]);

  // Complete the current intention and optionally mark task as complete
  const completeIntention = useCallback((markTaskComplete: boolean = true) => {
    if (!activeIntention) return;

    if (markTaskComplete && onTaskComplete) {
      onTaskComplete(activeIntention.taskId);
    }

    setActiveIntention(null);
  }, [activeIntention, setActiveIntention, onTaskComplete]);

  // Clear intention without completing the task
  const clearIntention = useCallback(() => {
    setActiveIntention(null);
  }, [setActiveIntention]);

  // Switch to a different task (pauses current without note, starts new)
  const switchIntention = useCallback((newTask: Task, pauseNote?: string) => {
    if (activeIntention) {
      // Record the switch as an interruption if note provided
      if (pauseNote) {
        const now = new Date().toISOString();
        const interruption: IntentionInterruption = {
          id: crypto.randomUUID(),
          note: pauseNote,
          timestamp: now,
        };
        // We don't save this to the old intention since we're switching away
        // The interruption history is useful if we return to the task
      }
    }
    startIntention(newTask);
  }, [activeIntention, startIntention]);

  // Calculate elapsed time in milliseconds (excluding paused time)
  const getElapsedTime = useCallback(() => {
    if (!activeIntention) return 0;

    const startTime = new Date(activeIntention.startedAt).getTime();
    const now = Date.now();

    let elapsed = now - startTime - activeIntention.totalPausedTime;

    // If currently paused, subtract the current pause duration
    if (activeIntention.isPaused && activeIntention.pausedAt) {
      const pausedAt = new Date(activeIntention.pausedAt).getTime();
      elapsed -= (now - pausedAt);
    }

    return Math.max(0, elapsed);
  }, [activeIntention]);

  // Format elapsed time as human-readable string
  const formatElapsedTime = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }, []);

  return {
    activeIntention,
    currentTask,
    startIntention,
    pauseIntention,
    resumeIntention,
    completeIntention,
    clearIntention,
    switchIntention,
    getElapsedTime,
    formatElapsedTime,
    isActive: !!activeIntention,
    isPaused: activeIntention?.isPaused ?? false,
  };
}
