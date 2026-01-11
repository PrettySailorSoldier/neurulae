/**
 * Suggested Action Engine
 * 
 * Determines what the user should do right now based on:
 * 1. Current scheduled timeline blocks
 * 2. Today's intentions
 * 3. Time of day (phase)
 * 4. Task priorities
 */

import { Task, TimeBlock, ScheduledTask, TomorrowIntentions } from '@/types';
import { isToday, parseISO } from 'date-fns';

export type DayPhase = 
  | 'early-morning'  // 5am-8am
  | 'morning'        // 8am-12pm
  | 'midday'         // 12pm-2pm
  | 'afternoon'      // 2pm-5pm
  | 'evening'        // 5pm-9pm
  | 'night'          // 9pm-12am
  | 'sleep-hours';   // 12am-5am

export type SuggestionType = 
  | 'scheduled-now'
  | 'scheduled-soon'
  | 'intention'
  | 'routine'
  | 'overdue'
  | 'next-priority'
  | 'free-time';

export type SuggestionPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface SuggestedAction {
  type: SuggestionType;
  priority: SuggestionPriority;
  message: string;
  description?: string;
  task?: Task;
  timeBlock?: TimeBlock;
  icon: string;
  color: 'red' | 'orange' | 'purple' | 'blue' | 'green' | 'gray' | 'indigo';
}

export function getCurrentPhase(): DayPhase {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 8) return 'early-morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 || hour < 0) return 'night';
  return 'sleep-hours';
}

function isTimeInRange(currentTime: Date, startTime: string, endTime: string): boolean {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function getMinutesUntil(currentTime: Date, startTime: string): number {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const [startHour, startMin] = startTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  return startMinutes - currentMinutes;
}

interface SuggestionContext {
  currentTime: Date;
  phase: DayPhase;
  timeBlocks: TimeBlock[];
  scheduledTasks: ScheduledTask[];
  tasks: Task[];
  intentions?: TomorrowIntentions | null;
  activeTaskId?: string | null;
}

export function getSuggestedNextAction(context: SuggestionContext): SuggestedAction | null {
  const { currentTime, phase, timeBlocks, scheduledTasks, tasks, intentions, activeTaskId } = context;
  const today = new Date().toISOString().split('T')[0];
  
  // If user is already working on something, don't suggest
  if (activeTaskId) {
    return null;
  }

  // 1. URGENT: Check for currently scheduled block
  const currentBlock = timeBlocks.find(block => 
    isTimeInRange(currentTime, block.startTime, block.endTime)
  );
  
  if (currentBlock) {
    // Get tasks scheduled in this block
    const tasksInBlock = scheduledTasks
      .filter(st => st.blockId === currentBlock.id && st.date === today)
      .map(st => tasks.find(t => t.id === st.taskId))
      .filter((t): t is Task => !!t && !t.completed);
    
    if (tasksInBlock.length > 0) {
      return {
        type: 'scheduled-now',
        priority: 'urgent',
        message: `You have "${currentBlock.title}" scheduled right now`,
        description: `Work on: ${tasksInBlock[0].title}`,
        task: tasksInBlock[0],
        timeBlock: currentBlock,
        icon: '⏰',
        color: 'red',
      };
    }
  }

  // 2. HIGH: Block starting within 15 minutes
  const upcomingBlocks = timeBlocks.filter(block => {
    const minutesUntil = getMinutesUntil(currentTime, block.startTime);
    return minutesUntil > 0 && minutesUntil <= 15;
  });
  
  if (upcomingBlocks.length > 0) {
    const nextBlock = upcomingBlocks[0];
    const minutesUntil = getMinutesUntil(currentTime, nextBlock.startTime);
    
    const tasksInBlock = scheduledTasks
      .filter(st => st.blockId === nextBlock.id && st.date === today)
      .map(st => tasks.find(t => t.id === st.taskId))
      .filter((t): t is Task => !!t && !t.completed);
    
    return {
      type: 'scheduled-soon',
      priority: 'high',
      message: `"${nextBlock.title}" starts in ${minutesUntil}m`,
      description: tasksInBlock.length > 0 ? `Prepare for: ${tasksInBlock[0].title}` : undefined,
      task: tasksInBlock[0],
      timeBlock: nextBlock,
      icon: '🔜',
      color: 'orange',
    };
  }

  // 3. HIGH: Uncompleted intention for today
  if (intentions && isToday(parseISO(intentions.date))) {
    const uncompletedIntention = intentions.intentions.find(i => !i.completed);
    if (uncompletedIntention) {
      // Find the linked task
      const intentionTask = tasks.find(t => 
        t.id === uncompletedIntention.taskId || 
        t.title === uncompletedIntention.title
      );
      
      return {
        type: 'intention',
        priority: 'high',
        message: `Work on today's priority`,
        description: uncompletedIntention.title,
        task: intentionTask,
        icon: '⭐',
        color: 'purple',
      };
    }
  }

  // 4. MEDIUM: Phase-appropriate routine suggestions
  if (phase === 'morning' || phase === 'early-morning') {
    return {
      type: 'routine',
      priority: 'medium',
      message: 'Good morning! Start your day right',
      description: 'Check your schedule and intentions',
      icon: '🌅',
      color: 'blue',
    };
  }
  
  if (phase === 'evening') {
    return {
      type: 'routine',
      priority: 'medium',
      message: 'Time for evening review',
      description: 'Reflect on today, plan for tomorrow',
      icon: '🌙',
      color: 'indigo',
    };
  }

  // 5. LOW: Next priority task
  const incompleteTasks = tasks.filter(t => !t.completed);
  if (incompleteTasks.length > 0) {
    // Sort by priority (if exists) or just take first
    const nextTask = incompleteTasks.sort((a, b) => {
      // Could add priority sorting here
      return 0;
    })[0];
    
    return {
      type: 'next-priority',
      priority: 'low',
      message: 'Work on next task',
      description: nextTask.title,
      task: nextTask,
      icon: '📋',
      color: 'blue',
    };
  }

  // 6. FALLBACK: Free time
  const phaseMessages: Record<DayPhase, string> = {
    'early-morning': 'Good morning! Start with your morning routine?',
    'morning': 'Great time for focused work on important tasks',
    'midday': 'Take a break or handle quick admin tasks',
    'afternoon': 'Good time for meetings and collaborative work',
    'evening': 'Wrap up loose ends and plan for tomorrow',
    'night': 'Wind down with light tasks or personal projects',
    'sleep-hours': 'Time to rest! Sleep is productive too 😴',
  };

  return {
    type: 'free-time',
    priority: 'low',
    message: 'All caught up!',
    description: phaseMessages[phase],
    icon: '✨',
    color: 'green',
  };
}
