import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Task, TimerSession } from '@/types';

export type TimerType = 'focus' | 'sequence' | 'interval' | 'flowtime' | 'chime' | null;

interface GlobalTimerState {
  isRunning: boolean;
  isPaused: boolean;
  timeRemaining: number; // seconds
  totalTime: number; // seconds
  timerType: TimerType;
  taskId: string | null;
  taskTitle: string | null;
  startedAt: string | null; // ISO timestamp
  pausedAt: string | null;
  elapsedBeforePause: number; // milliseconds
}

const DEFAULT_STATE: GlobalTimerState = {
  isRunning: false,
  isPaused: false,
  timeRemaining: 0,
  totalTime: 0,
  timerType: null,
  taskId: null,
  taskTitle: null,
  startedAt: null,
  pausedAt: null,
  elapsedBeforePause: 0,
};

interface UseGlobalTimerOptions {
  onComplete?: (taskId: string | null, actualMinutes: number) => void;
  onTick?: (timeRemaining: number) => void;
}

export function useGlobalTimer(options: UseGlobalTimerOptions = {}) {
  const [state, setState] = useLocalStorage<GlobalTimerState>('neurulae-global-timer', DEFAULT_STATE);
  const [sessions, setSessions] = useLocalStorage<TimerSession[]>('neurulae-timer-sessions', []);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef(options);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Timer tick effect
  useEffect(() => {
    if (state.isRunning && !state.isPaused && state.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const newTime = Math.max(0, prev.timeRemaining - 1);

          if (optionsRef.current.onTick) {
            optionsRef.current.onTick(newTime);
          }

          if (newTime === 0) {
            // Timer complete - will be handled by the complete effect
            return { ...prev, timeRemaining: 0, isRunning: false };
          }

          return { ...prev, timeRemaining: newTime };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning, state.isPaused, state.timeRemaining > 0]);

  // Handle completion
  useEffect(() => {
    if (state.timeRemaining === 0 && state.totalTime > 0 && !state.isRunning && state.startedAt) {
      const actualMinutes = getActualMinutes();

      if (optionsRef.current.onComplete) {
        optionsRef.current.onComplete(state.taskId, actualMinutes);
      }

      // Save session
      const session: TimerSession = {
        id: crypto.randomUUID(),
        taskId: state.taskId || undefined,
        startTime: state.startedAt,
        endTime: new Date().toISOString(),
        actualMinutes,
        date: new Date().toISOString().split('T')[0],
        timerType: (state.timerType as TimerSession['timerType']) || 'interval',
      };
      setSessions(prev => [session, ...prev]);
    }
  }, [state.timeRemaining, state.isRunning]);

  const getActualMinutes = useCallback(() => {
    if (!state.startedAt) return 0;

    let totalElapsed = state.elapsedBeforePause;

    if (state.isRunning && !state.isPaused) {
      const startTime = state.pausedAt
        ? new Date(state.pausedAt).getTime()
        : new Date(state.startedAt).getTime();
      totalElapsed += Date.now() - startTime;
    }

    return Math.max(1, Math.ceil(totalElapsed / 60000));
  }, [state]);

  const startTimer = useCallback((
    durationSeconds: number,
    timerType: TimerType,
    task?: { id: string; title: string } | null
  ) => {
    // Stop any existing timer first
    if (state.isRunning) {
      stopTimer();
    }

    setState({
      isRunning: true,
      isPaused: false,
      timeRemaining: durationSeconds,
      totalTime: durationSeconds,
      timerType,
      taskId: task?.id || null,
      taskTitle: task?.title || null,
      startedAt: new Date().toISOString(),
      pausedAt: null,
      elapsedBeforePause: 0,
    });
  }, [state.isRunning]);

  const pauseTimer = useCallback(() => {
    if (!state.isRunning || state.isPaused) return;

    const now = Date.now();
    const startTime = state.pausedAt
      ? new Date(state.pausedAt).getTime()
      : new Date(state.startedAt!).getTime();

    setState(prev => ({
      ...prev,
      isPaused: true,
      pausedAt: new Date().toISOString(),
      elapsedBeforePause: prev.elapsedBeforePause + (now - startTime),
    }));
  }, [state.isRunning, state.isPaused, state.startedAt, state.pausedAt]);

  const resumeTimer = useCallback(() => {
    if (!state.isPaused) return;

    setState(prev => ({
      ...prev,
      isPaused: false,
      pausedAt: null,
    }));
  }, [state.isPaused]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(DEFAULT_STATE);
  }, []);

  const addTime = useCallback((extraSeconds: number) => {
    setState(prev => ({
      ...prev,
      timeRemaining: prev.timeRemaining + extraSeconds,
      totalTime: prev.totalTime + extraSeconds,
    }));
  }, []);

  const completeEarly = useCallback(() => {
    if (!state.isRunning && !state.isPaused) return;

    const actualMinutes = getActualMinutes();

    if (optionsRef.current.onComplete) {
      optionsRef.current.onComplete(state.taskId, actualMinutes);
    }

    // Save session
    const session: TimerSession = {
      id: crypto.randomUUID(),
      taskId: state.taskId || undefined,
      startTime: state.startedAt || new Date().toISOString(),
      endTime: new Date().toISOString(),
      actualMinutes,
      date: new Date().toISOString().split('T')[0],
      timerType: (state.timerType as TimerSession['timerType']) || 'interval',
    };
    setSessions(prev => [session, ...prev]);

    stopTimer();
  }, [state, getActualMinutes, stopTimer]);

  const switchTask = useCallback((newTask: { id: string; title: string }, newDurationSeconds?: number) => {
    // Pause current timer to save elapsed time
    if (state.isRunning && !state.isPaused) {
      pauseTimer();
    }

    // Update task binding
    setState(prev => ({
      ...prev,
      taskId: newTask.id,
      taskTitle: newTask.title,
      timeRemaining: newDurationSeconds ?? prev.timeRemaining,
      totalTime: newDurationSeconds ?? prev.totalTime,
      isPaused: false,
      pausedAt: null,
    }));
  }, [state.isRunning, state.isPaused, pauseTimer]);

  return {
    // State
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    timeRemaining: state.timeRemaining,
    totalTime: state.totalTime,
    timerType: state.timerType,
    taskId: state.taskId,
    taskTitle: state.taskTitle,
    hasActiveTimer: state.isRunning || state.isPaused,

    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    addTime,
    completeEarly,
    switchTask,
    getActualMinutes,

    // Sessions
    sessions,
  };
}
