/**
 * useSuggestedAction Hook
 * 
 * Provides a suggested next action based on context.
 * Updates automatically when time, tasks, or schedule changes.
 */

import { useState, useEffect, useMemo } from 'react';
import { Task, TimeBlock, ScheduledTask, TomorrowIntentions } from '@/types';
import { 
  getSuggestedNextAction, 
  getCurrentPhase, 
  SuggestedAction,
  DayPhase 
} from '@/lib/suggestedActionEngine';
import { useActiveTimerState } from '@/contexts/TimerContext';

interface UseSuggestedActionProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  scheduledTasks: ScheduledTask[];
  intentions?: TomorrowIntentions | null;
}

interface UseSuggestedActionReturn {
  suggestion: SuggestedAction | null;
  phase: DayPhase;
  refresh: () => void;
  dismiss: () => void;
  isDismissed: boolean;
}

export function useSuggestedAction({
  tasks,
  timeBlocks,
  scheduledTasks,
  intentions,
}: UseSuggestedActionProps): UseSuggestedActionReturn {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDismissed, setIsDismissed] = useState(false);
  const activeTimerState = useActiveTimerState();
  
  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Reset dismissed state when relevant data changes
  useEffect(() => {
    setIsDismissed(false);
  }, [tasks.length, timeBlocks.length, scheduledTasks.length]);

  const phase = useMemo(() => getCurrentPhase(), [currentTime]);

  const suggestion = useMemo(() => {
    if (isDismissed) return null;
    
    return getSuggestedNextAction({
      currentTime,
      phase,
      timeBlocks,
      scheduledTasks,
      tasks,
      intentions,
      activeTaskId: activeTimerState?.taskId,
    });
  }, [currentTime, phase, timeBlocks, scheduledTasks, tasks, intentions, activeTimerState?.taskId, isDismissed]);

  const refresh = () => {
    setCurrentTime(new Date());
    setIsDismissed(false);
  };

  const dismiss = () => {
    setIsDismissed(true);
  };

  return {
    suggestion,
    phase,
    refresh,
    dismiss,
    isDismissed,
  };
}
