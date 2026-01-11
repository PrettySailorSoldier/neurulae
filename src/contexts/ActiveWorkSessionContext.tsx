import { createContext, useContext, ReactNode, useMemo } from 'react';
import { 
  useActiveWorkSession, 
  ActiveWorkSession, 
  SessionSource, 
  DayPhase,
  SessionEventListener 
} from '@/hooks/useActiveWorkSession';
import { Task, TimeBlock, ScheduledTask } from '@/types';

// Context value type
interface ActiveWorkSessionContextType {
  // Session state
  activeSession: ActiveWorkSession | null;
  currentTask: Task | null;
  currentTimelineBlock: TimeBlock | null;
  isActive: boolean;
  isPaused: boolean;
  
  // Timer state
  timeRemaining: number;
  totalTime: number;
  
  // Suggestions
  suggestedTask: { task: Task; block: TimeBlock } | null;
  currentPhase: DayPhase;
  
  // Session controls
  startSession: (
    task: Task | { id: string; title: string },
    options: {
      source: SessionSource;
      timelineBlockId?: string;
      durationSeconds?: number;
    }
  ) => void;
  startFromTimelineBlock: (block: TimeBlock, task?: Task | null) => void;
  startFromTaskList: (task: Task, durationSeconds?: number) => void;
  startFromIntentions: (task: Task) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  completeSession: () => void;
  switchTask: (newTask: Task, durationSeconds?: number) => void;
  
  // Event subscription
  onSessionEvent: (listener: SessionEventListener) => () => void;
}

const ActiveWorkSessionContext = createContext<ActiveWorkSessionContextType | null>(null);

interface ActiveWorkSessionProviderProps {
  children: ReactNode;
  tasks: Task[];
  timeBlocks?: TimeBlock[];
  scheduledTasks?: ScheduledTask[];
  onTaskComplete?: (taskId: string) => void;
}

export function ActiveWorkSessionProvider({
  children,
  tasks,
  timeBlocks = [],
  scheduledTasks = [],
  onTaskComplete,
}: ActiveWorkSessionProviderProps) {
  const session = useActiveWorkSession({
    tasks,
    timeBlocks,
    scheduledTasks,
    onTaskComplete,
  });

  const value = useMemo<ActiveWorkSessionContextType>(() => ({
    activeSession: session.activeSession,
    currentTask: session.currentTask,
    currentTimelineBlock: session.currentTimelineBlock,
    isActive: session.isActive,
    isPaused: session.isPaused,
    timeRemaining: session.timeRemaining,
    totalTime: session.totalTime,
    suggestedTask: session.suggestedTask,
    currentPhase: session.currentPhase,
    startSession: session.startSession,
    startFromTimelineBlock: session.startFromTimelineBlock,
    startFromTaskList: session.startFromTaskList,
    startFromIntentions: session.startFromIntentions,
    pauseSession: session.pauseSession,
    resumeSession: session.resumeSession,
    endSession: session.endSession,
    completeSession: session.completeSession,
    switchTask: session.switchTask,
    onSessionEvent: session.onSessionEvent,
  }), [session]);

  return (
    <ActiveWorkSessionContext.Provider value={value}>
      {children}
    </ActiveWorkSessionContext.Provider>
  );
}

// Hook to access active work session from any component
export function useActiveWorkSessionContext() {
  const context = useContext(ActiveWorkSessionContext);
  if (!context) {
    throw new Error('useActiveWorkSessionContext must be used within ActiveWorkSessionProvider');
  }
  return context;
}

// Safe hook that returns null outside provider (for public pages)
export function useActiveWorkSessionState() {
  return useContext(ActiveWorkSessionContext);
}

// Convenience hook that only returns the active session info (for display-only components)
export function useCurrentWorkSession() {
  const context = useContext(ActiveWorkSessionContext);
  return {
    activeSession: context?.activeSession ?? null,
    currentTask: context?.currentTask ?? null,
    isActive: context?.isActive ?? false,
    isPaused: context?.isPaused ?? false,
    timeRemaining: context?.timeRemaining ?? 0,
    currentPhase: context?.currentPhase ?? 'morning' as DayPhase,
  };
}
