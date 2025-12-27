import { useState, useEffect, useCallback, useRef } from 'react';
import { Routine, ScheduledRoutine, RoutineStep, ROUTINE_STORAGE_KEYS } from '@/types';

interface UseActiveRoutineReturn {
  activeRoutine: ScheduledRoutine | null;
  currentStep: RoutineStep | null;
  currentStepIndex: number;
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;

  startRoutine: (routine: Routine | ScheduledRoutine) => void;
  completeStep: () => void;
  skipStep: () => void;
  extendStep: (minutes: number) => void;
  pause: () => void;
  resume: () => void;
  exitRoutine: (saveProgress?: boolean) => void;

  progress: {
    completedSteps: number;
    skippedSteps: number;
    totalSteps: number;
    percentComplete: number;
    estimatedTimeRemaining: number;
  };
}

export function useActiveRoutine(): UseActiveRoutineReturn {
  const [activeRoutine, setActiveRoutine] = useState<ScheduledRoutine | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pausedTimeRef = useRef<number>(0);

  // Load active routine from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(ROUTINE_STORAGE_KEYS.ACTIVE_ROUTINE);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setActiveRoutine(data.routine);
        setCurrentStepIndex(data.currentStepIndex);
        setIsRunning(data.isRunning);
        setIsPaused(data.isPaused);
        setElapsedSeconds(data.elapsedSeconds || 0);
        if (data.stepStartTime) {
          setStepStartTime(new Date(data.stepStartTime));
        }
      } catch (e) {
        console.error('Failed to load active routine:', e);
        localStorage.removeItem(ROUTINE_STORAGE_KEYS.ACTIVE_ROUTINE);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (activeRoutine) {
      localStorage.setItem(ROUTINE_STORAGE_KEYS.ACTIVE_ROUTINE, JSON.stringify({
        routine: activeRoutine,
        currentStepIndex,
        isRunning,
        isPaused,
        elapsedSeconds,
        stepStartTime: stepStartTime?.toISOString(),
      }));
    } else {
      localStorage.removeItem(ROUTINE_STORAGE_KEYS.ACTIVE_ROUTINE);
    }
  }, [activeRoutine, currentStepIndex, isRunning, isPaused, elapsedSeconds, stepStartTime]);

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const currentStep = activeRoutine?.steps[currentStepIndex] || null;

  const startRoutine = useCallback((routine: Routine | ScheduledRoutine) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Convert Routine to ScheduledRoutine if needed
    const scheduledRoutine: ScheduledRoutine = 'routineId' in routine
      ? routine
      : {
          id: crypto.randomUUID(),
          routineId: routine.id,
          date: today,
          scheduledStartTime: now.toTimeString().slice(0, 5),
          actualStartTime: now.toISOString(),
          steps: routine.steps.map(s => ({ ...s, status: 'pending' as const })),
          status: 'in_progress',
          currentStepIndex: 0,
        };

    // Mark first step as in progress
    scheduledRoutine.steps[0].status = 'in_progress';
    scheduledRoutine.status = 'in_progress';
    scheduledRoutine.actualStartTime = now.toISOString();

    setActiveRoutine(scheduledRoutine);
    setCurrentStepIndex(0);
    setIsRunning(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setStepStartTime(now);
  }, []);

  const moveToNextStep = useCallback(() => {
    if (!activeRoutine) return;

    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= activeRoutine.steps.length) {
      // Routine complete
      const updatedRoutine = {
        ...activeRoutine,
        status: 'completed' as const,
        actualEndTime: new Date().toISOString(),
        totalActualMinutes: calculateTotalActualMinutes(activeRoutine.steps),
      };
      setActiveRoutine(updatedRoutine);
      setIsRunning(false);
      return;
    }

    // Move to next step
    const updatedSteps = [...activeRoutine.steps];
    updatedSteps[nextIndex] = { ...updatedSteps[nextIndex], status: 'in_progress' };

    setActiveRoutine({
      ...activeRoutine,
      steps: updatedSteps,
      currentStepIndex: nextIndex,
    });
    setCurrentStepIndex(nextIndex);
    setElapsedSeconds(0);
    setStepStartTime(new Date());
  }, [activeRoutine, currentStepIndex]);

  const completeStep = useCallback(() => {
    if (!activeRoutine || !currentStep) return;

    const updatedSteps = [...activeRoutine.steps];
    updatedSteps[currentStepIndex] = {
      ...currentStep,
      status: 'completed',
      actualMinutes: Math.ceil(elapsedSeconds / 60),
    };

    setActiveRoutine({
      ...activeRoutine,
      steps: updatedSteps,
    });

    moveToNextStep();
  }, [activeRoutine, currentStep, currentStepIndex, elapsedSeconds, moveToNextStep]);

  const skipStep = useCallback(() => {
    if (!activeRoutine || !currentStep) return;

    const updatedSteps = [...activeRoutine.steps];
    updatedSteps[currentStepIndex] = {
      ...currentStep,
      status: 'skipped',
      actualMinutes: 0,
    };

    setActiveRoutine({
      ...activeRoutine,
      steps: updatedSteps,
    });

    moveToNextStep();
  }, [activeRoutine, currentStep, currentStepIndex, moveToNextStep]);

  const extendStep = useCallback((minutes: number) => {
    // Extension is tracked via elapsedSeconds - this is mainly for display purposes
    // The actual extension just continues the timer
    console.log(`Step extended by ${minutes} minutes`);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    pausedTimeRef.current = Date.now();

    if (activeRoutine) {
      setActiveRoutine({
        ...activeRoutine,
        pausedAt: new Date().toISOString(),
      });
    }
  }, [activeRoutine]);

  const resume = useCallback(() => {
    setIsPaused(false);

    if (activeRoutine) {
      setActiveRoutine({
        ...activeRoutine,
        pausedAt: undefined,
      });
    }
  }, [activeRoutine]);

  const exitRoutine = useCallback((saveProgress = true) => {
    if (saveProgress && activeRoutine) {
      // Mark as partially completed if not finished
      const completedSteps = activeRoutine.steps.filter(s => s.status === 'completed').length;
      const status = completedSteps === activeRoutine.steps.length
        ? 'completed'
        : completedSteps > 0
        ? 'partially_completed'
        : 'skipped';

      const finalRoutine = {
        ...activeRoutine,
        status: status as ScheduledRoutine['status'],
        actualEndTime: new Date().toISOString(),
        totalActualMinutes: calculateTotalActualMinutes(activeRoutine.steps),
      };

      // Save to history
      saveRoutineToHistory(finalRoutine);
    }

    setActiveRoutine(null);
    setCurrentStepIndex(0);
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setStepStartTime(null);
    localStorage.removeItem(ROUTINE_STORAGE_KEYS.ACTIVE_ROUTINE);
  }, [activeRoutine]);

  // Calculate progress
  const progress = activeRoutine
    ? {
        completedSteps: activeRoutine.steps.filter(s => s.status === 'completed').length,
        skippedSteps: activeRoutine.steps.filter(s => s.status === 'skipped').length,
        totalSteps: activeRoutine.steps.length,
        percentComplete: Math.round(
          (activeRoutine.steps.filter(s => s.status === 'completed' || s.status === 'skipped').length /
            activeRoutine.steps.length) * 100
        ),
        estimatedTimeRemaining: activeRoutine.steps
          .slice(currentStepIndex)
          .reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0) -
          Math.floor(elapsedSeconds / 60),
      }
    : {
        completedSteps: 0,
        skippedSteps: 0,
        totalSteps: 0,
        percentComplete: 0,
        estimatedTimeRemaining: 0,
      };

  return {
    activeRoutine,
    currentStep,
    currentStepIndex,
    isRunning,
    isPaused,
    elapsedSeconds,
    startRoutine,
    completeStep,
    skipStep,
    extendStep,
    pause,
    resume,
    exitRoutine,
    progress,
  };
}

function calculateTotalActualMinutes(steps: RoutineStep[]): number {
  return steps.reduce((sum, step) => sum + (step.actualMinutes || 0), 0);
}

function saveRoutineToHistory(routine: ScheduledRoutine) {
  try {
    const historyKey = ROUTINE_STORAGE_KEYS.ROUTINE_HISTORY;
    const stored = localStorage.getItem(historyKey);
    const history = stored ? JSON.parse(stored) : [];

    history.unshift({
      id: routine.id,
      routineId: routine.routineId,
      date: routine.date,
      estimatedMinutes: routine.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0),
      actualMinutes: routine.totalActualMinutes,
      stepsCompleted: routine.steps.filter(s => s.status === 'completed').length,
      stepsSkipped: routine.steps.filter(s => s.status === 'skipped').length,
      stepBreakdown: routine.steps.map(s => ({
        stepName: s.name,
        estimated: s.estimatedMinutes,
        actual: s.actualMinutes || 0,
        wasSkipped: s.status === 'skipped',
      })),
    });

    // Keep only last 100 records
    const trimmed = history.slice(0, 100);
    localStorage.setItem(historyKey, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save routine history:', e);
  }
}
