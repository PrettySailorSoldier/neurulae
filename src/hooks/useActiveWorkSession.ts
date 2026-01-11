import { useCallback, useMemo, useEffect } from 'react';
import { useTimerContext, useActiveTimerState } from '@/contexts/TimerContext';
import { useLocalStorage } from './useLocalStorage';
import { Task, TimeBlock, ScheduledTask } from '@/types';

// Source where the work session was initiated
export type SessionSource = 'timer' | 'timeline-block' | 'task-list' | 'intentions' | 'focus-timer';

// Day phases for context awareness
export type DayPhase = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

// Active work session metadata
export interface ActiveWorkSession {
  taskId: string;
  taskTitle: string;
  source: SessionSource;
  timelineBlockId?: string;
  startedAt: string;
  estimatedDuration?: number; // in seconds
  phase: DayPhase;
}

// Session event types for cross-component communication
export type SessionEventType = 
  | 'session:started'
  | 'session:paused'
  | 'session:resumed'
  | 'session:ended'
  | 'session:switched'
  | 'session:completed';

export interface SessionEvent {
  type: SessionEventType;
  session: ActiveWorkSession | null;
  taskId?: string;
  timestamp: string;
}

// Event listeners for session events
type SessionEventListener = (event: SessionEvent) => void;
const sessionEventListeners = new Set<SessionEventListener>();

// Event emitter
function emitSessionEvent(event: SessionEvent) {
  sessionEventListeners.forEach(listener => {
    try {
      listener(event);
    } catch (e) {
      console.error('[ActiveWorkSession] Event listener error:', e);
    }
  });
}

interface UseActiveWorkSessionOptions {
  tasks: Task[];
  timeBlocks?: TimeBlock[];
  scheduledTasks?: ScheduledTask[];
  onTaskComplete?: (taskId: string) => void;
}

// Get current day phase based on hour
function getCurrentDayPhase(): DayPhase {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 12) return 'midday';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function useActiveWorkSession({
  tasks,
  timeBlocks = [],
  scheduledTasks = [],
  onTaskComplete,
}: UseActiveWorkSessionOptions) {
  // Get timer context (may be null if outside provider)
  const timerContext = useTimerContext();
  const activeTimerState = useActiveTimerState();

  // Session metadata stored separately from timer
  const [sessionMeta, setSessionMeta] = useLocalStorage<ActiveWorkSession | null>(
    'neurulae-active-work-session',
    null
  );

  // Derive combined active session state
  const activeSession = useMemo((): ActiveWorkSession | null => {
    if (!activeTimerState?.hasActiveTimer || !activeTimerState.taskId) {
      return null;
    }

    // Merge timer state with session metadata
    return sessionMeta && sessionMeta.taskId === activeTimerState.taskId
      ? sessionMeta
      : {
          taskId: activeTimerState.taskId,
          taskTitle: activeTimerState.taskTitle || 'Unknown Task',
          source: 'timer' as SessionSource,
          startedAt: activeTimerState.startedAt || new Date().toISOString(),
          phase: getCurrentDayPhase(),
        };
  }, [activeTimerState, sessionMeta]);

  // Get current task object
  const currentTask = useMemo(() => {
    if (!activeSession) return null;
    return tasks.find(t => t.id === activeSession.taskId) || null;
  }, [activeSession, tasks]);

  // Get current timeline block if session is linked to one
  const currentTimelineBlock = useMemo(() => {
    if (!activeSession?.timelineBlockId) return null;
    return timeBlocks.find(b => b.id === activeSession.timelineBlockId) || null;
  }, [activeSession, timeBlocks]);

  // Check if there's a scheduled task for the current time
  const suggestedTask = useMemo(() => {
    if (activeSession) return null; // Don't suggest if already working

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // Find a time block that's currently active
    const activeBlock = timeBlocks.find(block => {
      return block.startTime <= currentTimeStr && block.endTime > currentTimeStr;
    });

    if (!activeBlock) return null;

    // Find a scheduled task for this block
    const todayStr = now.toISOString().split('T')[0];
    const scheduledForNow = scheduledTasks.find(st => 
      st.blockId === activeBlock.id && st.date === todayStr
    );

    if (!scheduledForNow) return null;

    const task = tasks.find(t => t.id === scheduledForNow.taskId && !t.completed);
    return task ? { task, block: activeBlock } : null;
  }, [activeSession, timeBlocks, scheduledTasks, tasks]);

  // Start a work session
  const startSession = useCallback((
    task: Task | { id: string; title: string },
    options: {
      source: SessionSource;
      timelineBlockId?: string;
      durationSeconds?: number;
    }
  ) => {
    if (!timerContext) {
      console.warn('[ActiveWorkSession] Cannot start session: TimerContext not available');
      return;
    }

    const { source, timelineBlockId, durationSeconds = 25 * 60 } = options;

    // Create session metadata
    const session: ActiveWorkSession = {
      taskId: task.id,
      taskTitle: task.title,
      source,
      timelineBlockId,
      startedAt: new Date().toISOString(),
      estimatedDuration: durationSeconds,
      phase: getCurrentDayPhase(),
    };

    // Store session metadata
    setSessionMeta(session);

    // Start the timer with the task
    timerContext.startTimer(durationSeconds, 'pomodoro', {
      id: task.id,
      title: task.title,
    });

    // Emit session started event
    emitSessionEvent({
      type: 'session:started',
      session,
      taskId: task.id,
      timestamp: new Date().toISOString(),
    });

    console.log('[ActiveWorkSession] Session started:', session);
  }, [timerContext, setSessionMeta]);

  // Start session from a timeline block
  const startFromTimelineBlock = useCallback((
    block: TimeBlock,
    task?: Task | null
  ) => {
    // If no task provided, find a scheduled task for this block
    const todayStr = new Date().toISOString().split('T')[0];
    const scheduledTask = scheduledTasks.find(st => 
      st.blockId === block.id && st.date === todayStr
    );

    const taskToStart = task || (scheduledTask 
      ? tasks.find(t => t.id === scheduledTask.taskId) 
      : null);

    if (!taskToStart) {
      console.warn('[ActiveWorkSession] No task found for timeline block:', block.id);
      return;
    }

    // Calculate duration from block times
    const [startH, startM] = block.startTime.split(':').map(Number);
    const [endH, endM] = block.endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const durationSeconds = Math.max(durationMinutes * 60, 25 * 60); // Minimum 25 min

    startSession(taskToStart, {
      source: 'timeline-block',
      timelineBlockId: block.id,
      durationSeconds,
    });
  }, [scheduledTasks, tasks, startSession]);

  // Start session from task list
  const startFromTaskList = useCallback((task: Task, durationSeconds?: number) => {
    startSession(task, {
      source: 'task-list',
      durationSeconds: durationSeconds || task.estimatedMinutes ? (task.estimatedMinutes! * 60) : 25 * 60,
    });
  }, [startSession]);

  // Start session from intentions bar
  const startFromIntentions = useCallback((task: Task) => {
    startSession(task, {
      source: 'intentions',
      durationSeconds: task.estimatedMinutes ? task.estimatedMinutes * 60 : 25 * 60,
    });
  }, [startSession]);

  // Pause the session
  const pauseSession = useCallback(() => {
    if (!timerContext || !activeSession) return;
    
    timerContext.pauseTimer();
    
    emitSessionEvent({
      type: 'session:paused',
      session: activeSession,
      taskId: activeSession.taskId,
      timestamp: new Date().toISOString(),
    });
  }, [timerContext, activeSession]);

  // Resume the session
  const resumeSession = useCallback(() => {
    if (!timerContext || !activeSession) return;
    
    timerContext.resumeTimer();
    
    emitSessionEvent({
      type: 'session:resumed',
      session: activeSession,
      taskId: activeSession.taskId,
      timestamp: new Date().toISOString(),
    });
  }, [timerContext, activeSession]);

  // End the session without completing task
  const endSession = useCallback(() => {
    if (!timerContext) return;
    
    const session = activeSession;
    timerContext.stopTimer();
    setSessionMeta(null);
    
    emitSessionEvent({
      type: 'session:ended',
      session,
      taskId: session?.taskId,
      timestamp: new Date().toISOString(),
    });
  }, [timerContext, activeSession, setSessionMeta]);

  // Complete the session and mark task as done
  const completeSession = useCallback(() => {
    if (!timerContext || !activeSession) return;
    
    const session = activeSession;
    
    // Mark task as complete if callback provided
    if (onTaskComplete) {
      onTaskComplete(session.taskId);
    }
    
    timerContext.completeEarly();
    setSessionMeta(null);
    
    emitSessionEvent({
      type: 'session:completed',
      session,
      taskId: session.taskId,
      timestamp: new Date().toISOString(),
    });
  }, [timerContext, activeSession, onTaskComplete, setSessionMeta]);

  // Switch to a different task
  const switchTask = useCallback((newTask: Task, durationSeconds?: number) => {
    if (!timerContext) return;
    
    const oldSession = activeSession;
    const newDuration = durationSeconds || newTask.estimatedMinutes 
      ? (newTask.estimatedMinutes! * 60) 
      : 25 * 60;

    // Create new session metadata
    const newSession: ActiveWorkSession = {
      taskId: newTask.id,
      taskTitle: newTask.title,
      source: oldSession?.source || 'task-list',
      timelineBlockId: oldSession?.timelineBlockId,
      startedAt: new Date().toISOString(),
      estimatedDuration: newDuration,
      phase: getCurrentDayPhase(),
    };

    setSessionMeta(newSession);
    timerContext.switchTask({ id: newTask.id, title: newTask.title }, newDuration);
    
    emitSessionEvent({
      type: 'session:switched',
      session: newSession,
      taskId: newTask.id,
      timestamp: new Date().toISOString(),
    });
  }, [timerContext, activeSession, setSessionMeta]);

  // Add event listener for session events
  const onSessionEvent = useCallback((listener: SessionEventListener) => {
    sessionEventListeners.add(listener);
    return () => sessionEventListeners.delete(listener);
  }, []);

  // Sync session metadata when timer task changes
  useEffect(() => {
    if (!activeTimerState?.taskId) {
      // Timer stopped externally, clear session
      if (sessionMeta) {
        setSessionMeta(null);
      }
      return;
    }

    // If timer is on a different task than session, update session
    if (sessionMeta && sessionMeta.taskId !== activeTimerState.taskId) {
      setSessionMeta({
        ...sessionMeta,
        taskId: activeTimerState.taskId,
        taskTitle: activeTimerState.taskTitle || 'Unknown Task',
      });
    }
  }, [activeTimerState?.taskId, sessionMeta, setSessionMeta]);

  return {
    // Session state
    activeSession,
    currentTask,
    currentTimelineBlock,
    isActive: !!activeSession,
    isPaused: activeTimerState?.isPaused ?? false,
    
    // Timer state passthrough
    timeRemaining: activeTimerState?.timeRemaining ?? 0,
    totalTime: activeTimerState?.totalTime ?? 0,
    
    // Smart suggestions
    suggestedTask,
    currentPhase: getCurrentDayPhase(),
    
    // Session controls
    startSession,
    startFromTimelineBlock,
    startFromTaskList,
    startFromIntentions,
    pauseSession,
    resumeSession,
    endSession,
    completeSession,
    switchTask,
    
    // Event subscription
    onSessionEvent,
  };
}

// Export event types and listener registration for components that need to observe
export { emitSessionEvent, sessionEventListeners };
export type { SessionEventListener };
