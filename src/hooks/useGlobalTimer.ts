import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Task, TimerSession, HierarchicalInterval, IntervalStep } from '@/types';

export type TimerType = 'focus' | 'sequence' | 'interval' | 'flowtime' | 'chime' | 'hierarchical-interval' | null;

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
  // Hierarchical interval state
  hierarchicalInterval: HierarchicalInterval | null;
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
  hierarchicalInterval: null,
};

interface UseGlobalTimerOptions {
  onComplete?: (taskId: string | null, actualMinutes: number) => void;
  onTick?: (timeRemaining: number) => void;
  onStepComplete?: (completedStep: IntervalStep, nextStep: IntervalStep | null, stepIndex: number) => void;
  onHierarchicalComplete?: (interval: HierarchicalInterval, actualMinutes: number) => void;
  // NEW: Sync with active intention system
  onTimerStart?: (taskId: string, taskTitle: string) => void;
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

  // Helper function to play step transition sound
  const playStepTransitionSound = useCallback(() => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Two-tone chime for step transition (higher pitch than regular chime)
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Second tone for distinction
      setTimeout(() => {
        const audioContext2 = new AudioContext();
        const oscillator2 = audioContext2.createOscillator();
        const gainNode2 = audioContext2.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext2.destination);

        oscillator2.frequency.value = 1046.5; // C6 note
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0.3, audioContext2.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext2.currentTime + 0.3);

        oscillator2.start(audioContext2.currentTime);
        oscillator2.stop(audioContext2.currentTime + 0.3);
      }, 150);
    } catch (error) {
      console.warn('Could not play step transition sound:', error);
    }
  }, []);

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
            // Check if this is a hierarchical interval timer
            if (prev.timerType === 'hierarchical-interval' && prev.hierarchicalInterval) {
              const interval = prev.hierarchicalInterval;
              const currentStepIndex = interval.currentStepIndex;
              const currentStep = interval.steps[currentStepIndex];
              const nextStepIndex = currentStepIndex + 1;
              const hasNextStep = nextStepIndex < interval.steps.length;

              // Mark current step as complete
              const updatedSteps = interval.steps.map((step, idx) =>
                idx === currentStepIndex ? { ...step, isComplete: true } : step
              );

              // Calculate elapsed duration (add current step's duration)
              const newElapsedDuration = interval.elapsedDuration + currentStep.duration;

              if (hasNextStep) {
                // Auto-advance to next step
                const nextStep = interval.steps[nextStepIndex];

                // Play notification sound
                playStepTransitionSound();

                // Fire step complete callback
                if (optionsRef.current.onStepComplete) {
                  optionsRef.current.onStepComplete(currentStep, nextStep, currentStepIndex);
                }

                return {
                  ...prev,
                  timeRemaining: nextStep.duration,
                  totalTime: nextStep.duration,
                  hierarchicalInterval: {
                    ...interval,
                    steps: updatedSteps,
                    currentStepIndex: nextStepIndex,
                    elapsedDuration: newElapsedDuration,
                  },
                };
              } else {
                // All steps complete - fire final callbacks
                const completedInterval: HierarchicalInterval = {
                  ...interval,
                  steps: updatedSteps,
                  elapsedDuration: newElapsedDuration,
                };

                // Play completion sound (different from step transition)
                playStepTransitionSound();

                // Fire step complete callback for last step
                if (optionsRef.current.onStepComplete) {
                  optionsRef.current.onStepComplete(currentStep, null, currentStepIndex);
                }

                // Timer complete - will be handled by the complete effect
                return {
                  ...prev,
                  timeRemaining: 0,
                  isRunning: false,
                  hierarchicalInterval: completedInterval,
                };
              }
            }

            // Timer complete - will be handled by the complete effect
            return { ...prev, timeRemaining: 0, isRunning: false };
          }

          // Update elapsed duration for hierarchical intervals
          if (prev.timerType === 'hierarchical-interval' && prev.hierarchicalInterval) {
            return {
              ...prev,
              timeRemaining: newTime,
              hierarchicalInterval: {
                ...prev.hierarchicalInterval,
                elapsedDuration: prev.hierarchicalInterval.elapsedDuration + 1,
              },
            };
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
  }, [state.isRunning, state.isPaused, state.timeRemaining > 0, playStepTransitionSound]);

  // Handle completion
  useEffect(() => {
    if (state.timeRemaining === 0 && state.totalTime > 0 && !state.isRunning && state.startedAt) {
      const actualMinutes = getActualMinutes();

      // Handle hierarchical interval completion
      if (state.timerType === 'hierarchical-interval' && state.hierarchicalInterval) {
        if (optionsRef.current.onHierarchicalComplete) {
          optionsRef.current.onHierarchicalComplete(state.hierarchicalInterval, actualMinutes);
        }
      }

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

  // Define stopTimer first to avoid circular reference issues
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(DEFAULT_STATE);
  }, []);

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
      hierarchicalInterval: null,
    });

    // Fire onTimerStart callback for active intention sync
    if (task?.id && task?.title && optionsRef.current.onTimerStart) {
      optionsRef.current.onTimerStart(task.id, task.title);
    }
  }, [state.isRunning, stopTimer]);

  // Start a hierarchical interval timer with nested steps
  const startHierarchicalInterval = useCallback((
    interval: Omit<HierarchicalInterval, 'currentStepIndex' | 'elapsedDuration'>,
    task?: { id: string; title: string } | null
  ) => {
    // Stop any existing timer first
    if (state.isRunning) {
      stopTimer();
    }

    if (interval.steps.length === 0) {
      console.warn('Cannot start hierarchical interval with no steps');
      return;
    }

    const firstStep = interval.steps[0];
    const totalDuration = interval.steps.reduce((sum, step) => sum + step.duration, 0);

    // Initialize the hierarchical interval with reset step completion status
    const initializedInterval: HierarchicalInterval = {
      ...interval,
      totalDuration,
      currentStepIndex: 0,
      elapsedDuration: 0,
      steps: interval.steps.map(step => ({ ...step, isComplete: false })),
    };

    const finalTaskId = task?.id || interval.taskId || null;
    const finalTaskTitle = task?.title || interval.name;

    setState({
      isRunning: true,
      isPaused: false,
      timeRemaining: firstStep.duration,
      totalTime: firstStep.duration,
      timerType: 'hierarchical-interval',
      taskId: finalTaskId,
      taskTitle: finalTaskTitle,
      startedAt: new Date().toISOString(),
      pausedAt: null,
      elapsedBeforePause: 0,
      hierarchicalInterval: initializedInterval,
    });

    // Fire onTimerStart callback for active intention sync
    if (finalTaskId && finalTaskTitle && optionsRef.current.onTimerStart) {
      optionsRef.current.onTimerStart(finalTaskId, finalTaskTitle);
    }
  }, [state.isRunning, stopTimer]);

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

    // Handle hierarchical interval completion
    if (state.timerType === 'hierarchical-interval' && state.hierarchicalInterval) {
      if (optionsRef.current.onHierarchicalComplete) {
        optionsRef.current.onHierarchicalComplete(state.hierarchicalInterval, actualMinutes);
      }
    }

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

  // Get current step info for hierarchical intervals
  const getCurrentStep = useCallback((): IntervalStep | null => {
    if (!state.hierarchicalInterval) return null;
    return state.hierarchicalInterval.steps[state.hierarchicalInterval.currentStepIndex] || null;
  }, [state.hierarchicalInterval]);

  // Get progress info for hierarchical intervals
  const getHierarchicalProgress = useCallback(() => {
    if (!state.hierarchicalInterval) return null;
    const interval = state.hierarchicalInterval;
    return {
      currentStepIndex: interval.currentStepIndex,
      totalSteps: interval.steps.length,
      completedSteps: interval.steps.filter(s => s.isComplete).length,
      elapsedDuration: interval.elapsedDuration,
      totalDuration: interval.totalDuration,
      percentComplete: Math.round((interval.elapsedDuration / interval.totalDuration) * 100),
    };
  }, [state.hierarchicalInterval]);

  // Skip to next step in hierarchical interval
  const skipToNextStep = useCallback(() => {
    if (state.timerType !== 'hierarchical-interval' || !state.hierarchicalInterval) return;

    const interval = state.hierarchicalInterval;
    const currentStepIndex = interval.currentStepIndex;
    const currentStep = interval.steps[currentStepIndex];
    const nextStepIndex = currentStepIndex + 1;
    const hasNextStep = nextStepIndex < interval.steps.length;

    // Mark current step as complete
    const updatedSteps = interval.steps.map((step, idx) =>
      idx === currentStepIndex ? { ...step, isComplete: true } : step
    );

    // Add remaining time of current step to elapsed
    const stepElapsed = currentStep.duration - state.timeRemaining;
    const newElapsedDuration = interval.elapsedDuration + stepElapsed;

    if (hasNextStep) {
      const nextStep = interval.steps[nextStepIndex];
      playStepTransitionSound();

      if (optionsRef.current.onStepComplete) {
        optionsRef.current.onStepComplete(currentStep, nextStep, currentStepIndex);
      }

      setState(prev => ({
        ...prev,
        timeRemaining: nextStep.duration,
        totalTime: nextStep.duration,
        hierarchicalInterval: {
          ...interval,
          steps: updatedSteps,
          currentStepIndex: nextStepIndex,
          elapsedDuration: newElapsedDuration,
        },
      }));
    } else {
      // Complete the entire interval
      completeEarly();
    }
  }, [state.timerType, state.hierarchicalInterval, state.timeRemaining, playStepTransitionSound, completeEarly]);

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

    // Hierarchical interval state
    hierarchicalInterval: state.hierarchicalInterval,
    currentStep: getCurrentStep(),
    hierarchicalProgress: getHierarchicalProgress(),

    // Actions
    startTimer,
    startHierarchicalInterval,
    pauseTimer,
    resumeTimer,
    stopTimer,
    addTime,
    completeEarly,
    switchTask,
    getActualMinutes,
    skipToNextStep,

    // Sessions
    sessions,
  };
}
