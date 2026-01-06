import { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useGlobalTimer, TimerType } from '@/hooks/useGlobalTimer';
import { HierarchicalInterval, IntervalStep, TimerSession } from '@/types';

// Active timer state that can be consumed by any component
export interface ActiveTimerState {
  isRunning: boolean;
  isPaused: boolean;
  taskId: string | null;
  taskTitle: string | null;
  timeRemaining: number;
  totalTime: number;
  timerType: TimerType;
  hasActiveTimer: boolean;
  // For time block visualization
  startedAt: string | null;
  estimatedEndAt: string | null;
}

interface TimerContextType {
  // Active timer state for UI components
  activeTimerState: ActiveTimerState;
  
  // Timer controls
  startTimer: (durationSeconds: number, timerType: TimerType, task?: { id: string; title: string } | null) => void;
  startHierarchicalInterval: (interval: Omit<HierarchicalInterval, 'currentStepIndex' | 'elapsedDuration'>, task?: { id: string; title: string } | null) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  addTime: (extraSeconds: number) => void;
  completeEarly: () => void;
  switchTask: (newTask: { id: string; title: string }, newDurationSeconds?: number) => void;
  getActualMinutes: () => number;
  skipToNextStep: () => void;
  
  // Hierarchical interval state
  hierarchicalInterval: HierarchicalInterval | null;
  currentStep: IntervalStep | null;
  hierarchicalProgress: {
    currentStepIndex: number;
    totalSteps: number;
    completedSteps: number;
    elapsedDuration: number;
    totalDuration: number;
    percentComplete: number;
  } | null;
  
  // Sessions
  sessions: TimerSession[];
}

const TimerContext = createContext<TimerContextType | null>(null);

interface TimerProviderProps {
  children: ReactNode;
  onComplete?: (taskId: string | null, actualMinutes: number) => void;
  onTick?: (timeRemaining: number) => void;
  onStepComplete?: (completedStep: IntervalStep, nextStep: IntervalStep | null, stepIndex: number) => void;
  onHierarchicalComplete?: (interval: HierarchicalInterval, actualMinutes: number) => void;
  onTimerStart?: (taskId: string, taskTitle: string) => void;
}

export function TimerProvider({
  children,
  onComplete,
  onTick,
  onStepComplete,
  onHierarchicalComplete,
  onTimerStart,
}: TimerProviderProps) {
  const timer = useGlobalTimer({
    onComplete,
    onTick,
    onStepComplete,
    onHierarchicalComplete,
    onTimerStart,
  });

  // Calculate estimated end time based on current timer state
  const getEstimatedEndAt = useCallback((): string | null => {
    if (!timer.hasActiveTimer) return null;
    const now = new Date();
    const endTime = new Date(now.getTime() + timer.timeRemaining * 1000);
    return endTime.toISOString();
  }, [timer.hasActiveTimer, timer.timeRemaining]);

  // Get started at time from local storage (approximation)
  const getStartedAt = useCallback((): string | null => {
    if (!timer.hasActiveTimer) return null;
    const now = new Date();
    const startTime = new Date(now.getTime() - (timer.totalTime - timer.timeRemaining) * 1000);
    return startTime.toISOString();
  }, [timer.hasActiveTimer, timer.totalTime, timer.timeRemaining]);

  const activeTimerState: ActiveTimerState = {
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    taskId: timer.taskId,
    taskTitle: timer.taskTitle,
    timeRemaining: timer.timeRemaining,
    totalTime: timer.totalTime,
    timerType: timer.timerType,
    hasActiveTimer: timer.hasActiveTimer,
    startedAt: getStartedAt(),
    estimatedEndAt: getEstimatedEndAt(),
  };

  const value: TimerContextType = {
    activeTimerState,
    startTimer: timer.startTimer,
    startHierarchicalInterval: timer.startHierarchicalInterval,
    pauseTimer: timer.pauseTimer,
    resumeTimer: timer.resumeTimer,
    stopTimer: timer.stopTimer,
    addTime: timer.addTime,
    completeEarly: timer.completeEarly,
    switchTask: timer.switchTask,
    getActualMinutes: timer.getActualMinutes,
    skipToNextStep: timer.skipToNextStep,
    hierarchicalInterval: timer.hierarchicalInterval,
    currentStep: timer.currentStep,
    hierarchicalProgress: timer.hierarchicalProgress,
    sessions: timer.sessions,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
}

// Hook that only returns the active timer state (for components that just need to observe)
// Returns null if not inside a TimerProvider (safe for public pages)
export function useActiveTimerState(): ActiveTimerState | null {
  const context = useContext(TimerContext);
  return context?.activeTimerState ?? null;
}
