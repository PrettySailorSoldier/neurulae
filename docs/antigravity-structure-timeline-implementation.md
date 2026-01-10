# Interactive Structure-Building Timeline - Complete Implementation Guide

## Project Context

**App Name:** Neurulae  
**Tech Stack:** React 18.3 + TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase  
**Target User:** People with AuDHD and others who benefit from visual structure  
**Goal:** Transform the existing `DailyFlowTimeline` from a passive visual aid into an active structure coach that teaches routine through interaction

---

## Current State Summary

### Existing Components to Enhance
- `src/components/DailyFlowTimeline.tsx` - Main timeline visualization (600+ lines)
- `src/lib/timeUtils.ts` - Time zone calculations, business hours logic
- `src/hooks/useAnchorPoints.ts` - Anchor point management
- `src/hooks/useGlobalTimer.ts` - Global timer state
- `src/types/index.ts` - TypeScript interfaces

### Existing Features Already Implemented
- Weekday/weekend toggle (`scheduleType` state)
- Business hours settings (`TimeZoneSettings.businessHours`)
- Quiet hours settings (`TimeZoneSettings.quietHours`)
- Custom time zones
- Time blocks (main/dedicated types)
- Schedule entries
- NOW indicator
- Drag-and-drop support
- User profile with wake/sleep times, work days, work hours

### Key Storage Keys (localStorage)
- `neurulae-time-blocks` - TimeBlock[]
- `neurulae-schedule-entries` - ScheduleEntry[]
- `neurulae-anchor-points` - AnchorPoint[]
- `neurulae-routines` - Routine[]
- `neurulae-day-templates` - DayTemplate[]
- `neurulae-global-timer` - GlobalTimerState
- `neurulae-time-zone-settings` - TimeZoneSettings

---

## Implementation Overview

This feature adds **5 new systems** that work together:

1. **Temporal Context Engine** - Understands "what kind of time is it"
2. **Structure Analysis** - Analyzes gaps and patterns in the schedule
3. **Structure Coaching UI** - Guides users to build structure
4. **Day Templates** - Weekday/weekend structure presets
5. **Timer ↔ Timeline Integration** - Connects active work to visual schedule

---

## PART 1: Temporal Context Engine

### New File: `src/lib/temporalContext.ts`

```typescript
import { TimeZoneSettings } from '@/types';

// ============ TYPES ============

export type DayPhase = 
  | 'early-morning'  // 5:00 - 7:00
  | 'morning'        // 7:00 - 12:00
  | 'midday'         // 12:00 - 13:00
  | 'afternoon'      // 13:00 - 17:00
  | 'evening'        // 17:00 - 21:00
  | 'night'          // 21:00 - 23:00
  | 'sleep-hours';   // 23:00 - 5:00

export type SuggestedFocus = 
  | 'routine'      // Morning/evening routines
  | 'deep-work'    // Focused work tasks
  | 'admin'        // Calls, emails, appointments
  | 'personal'     // Personal tasks, hobbies
  | 'wind-down'    // Transition to rest
  | 'rest';        // Sleep, breaks

export interface PhaseDefinition {
  name: DayPhase;
  label: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  defaultFocus: SuggestedFocus;
  icon: string;      // Lucide icon name
  color: string;     // Tailwind color class
  description: string;
}

export interface TemporalContext {
  // Current time info
  currentTime: string;           // HH:MM
  currentDate: Date;
  
  // Day classification
  dayType: 'weekday' | 'weekend';
  dayOfWeek: number;             // 0-6
  dayName: string;
  isWorkDay: boolean;            // Based on user's work schedule
  
  // Phase info
  currentPhase: DayPhase;
  phaseLabel: string;
  phaseIcon: string;
  phaseColor: string;
  phaseDescription: string;
  
  // Business hours context
  isBusinessHours: boolean;
  businessHoursStatus: 'before' | 'during' | 'after' | 'not-applicable';
  
  // Quiet hours context
  isQuietHours: boolean;
  
  // Focus suggestions
  suggestedFocus: SuggestedFocus;
  suggestedActivities: string[];
  
  // Timing
  minutesIntoPhase: number;
  minutesUntilPhaseChange: number;
  nextPhase: DayPhase | null;
  nextPhaseLabel: string;
  
  // Structure opportunities
  isTransitionTime: boolean;     // Between major phases
  isGoodTimeForRoutine: boolean;
  isGoodTimeForDeepWork: boolean;
}

export interface UserScheduleContext {
  wakeTime: string;              // HH:MM from user profile
  sleepTime: string;             // HH:MM from user profile
  workDays: number[];            // 0-6 (Sunday = 0)
  workStartTime: string;         // HH:MM
  workEndTime: string;           // HH:MM
  timeZoneSettings: TimeZoneSettings;
}

// ============ DEFAULT PHASES ============

export const DEFAULT_PHASES: PhaseDefinition[] = [
  {
    name: 'early-morning',
    label: 'Early Morning',
    startTime: '05:00',
    endTime: '07:00',
    defaultFocus: 'routine',
    icon: 'Sunrise',
    color: 'amber',
    description: 'Quiet time for morning routines'
  },
  {
    name: 'morning',
    label: 'Morning',
    startTime: '07:00',
    endTime: '12:00',
    defaultFocus: 'deep-work',
    icon: 'Sun',
    color: 'yellow',
    description: 'Peak energy for focused work'
  },
  {
    name: 'midday',
    label: 'Midday',
    startTime: '12:00',
    endTime: '13:00',
    defaultFocus: 'rest',
    icon: 'UtensilsCrossed',
    color: 'orange',
    description: 'Lunch break and recharge'
  },
  {
    name: 'afternoon',
    label: 'Afternoon',
    startTime: '13:00',
    endTime: '17:00',
    defaultFocus: 'deep-work',
    icon: 'Briefcase',
    color: 'blue',
    description: 'Continued work and meetings'
  },
  {
    name: 'evening',
    label: 'Evening',
    startTime: '17:00',
    endTime: '21:00',
    defaultFocus: 'personal',
    icon: 'Home',
    color: 'purple',
    description: 'Personal time and tasks'
  },
  {
    name: 'night',
    label: 'Night',
    startTime: '21:00',
    endTime: '23:00',
    defaultFocus: 'wind-down',
    icon: 'Moon',
    color: 'indigo',
    description: 'Wind down for sleep'
  },
  {
    name: 'sleep-hours',
    label: 'Sleep Hours',
    startTime: '23:00',
    endTime: '05:00',
    defaultFocus: 'rest',
    icon: 'BedDouble',
    color: 'slate',
    description: 'Rest and recovery'
  }
];

// ============ HELPER FUNCTIONS ============

/**
 * Parse time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440; // Handle negative and >24h
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if a time falls within a range (handles overnight ranges)
 */
export function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  
  if (startMinutes <= endMinutes) {
    // Normal range (e.g., 09:00 - 17:00)
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  } else {
    // Overnight range (e.g., 23:00 - 05:00)
    return timeMinutes >= startMinutes || timeMinutes < endMinutes;
  }
}

/**
 * Get current time as HH:MM string
 */
export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Get the phase for a given time
 */
export function getPhaseForTime(time: string, phases: PhaseDefinition[] = DEFAULT_PHASES): PhaseDefinition {
  for (const phase of phases) {
    if (isTimeInRange(time, phase.startTime, phase.endTime)) {
      return phase;
    }
  }
  // Fallback to sleep-hours if no match (shouldn't happen with default phases)
  return phases.find(p => p.name === 'sleep-hours') || phases[0];
}

/**
 * Get the next phase after the current one
 */
export function getNextPhase(currentPhase: DayPhase, phases: PhaseDefinition[] = DEFAULT_PHASES): PhaseDefinition | null {
  const currentIndex = phases.findIndex(p => p.name === currentPhase);
  if (currentIndex === -1) return null;
  
  const nextIndex = (currentIndex + 1) % phases.length;
  return phases[nextIndex];
}

/**
 * Calculate minutes until phase change
 */
export function getMinutesUntilPhaseChange(currentTime: string, currentPhase: PhaseDefinition): number {
  const currentMinutes = timeToMinutes(currentTime);
  const endMinutes = timeToMinutes(currentPhase.endTime);
  
  if (endMinutes > currentMinutes) {
    return endMinutes - currentMinutes;
  } else {
    // Phase ends after midnight
    return (1440 - currentMinutes) + endMinutes;
  }
}

/**
 * Calculate minutes into current phase
 */
export function getMinutesIntoPhase(currentTime: string, currentPhase: PhaseDefinition): number {
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(currentPhase.startTime);
  
  if (currentMinutes >= startMinutes) {
    return currentMinutes - startMinutes;
  } else {
    // Phase started before midnight
    return (1440 - startMinutes) + currentMinutes;
  }
}

/**
 * Get suggested activities based on focus type and day type
 */
export function getSuggestedActivities(
  focus: SuggestedFocus,
  dayType: 'weekday' | 'weekend',
  isWorkDay: boolean
): string[] {
  const activities: Record<SuggestedFocus, { weekday: string[]; weekend: string[] }> = {
    'routine': {
      weekday: ['Morning routine', 'Exercise', 'Meal prep', 'Planning'],
      weekend: ['Leisurely breakfast', 'Self-care', 'Hobbies', 'Errands']
    },
    'deep-work': {
      weekday: ['Important projects', 'Focused tasks', 'Learning', 'Creative work'],
      weekend: ['Personal projects', 'Skill building', 'Side projects', 'Reading']
    },
    'admin': {
      weekday: ['Emails', 'Calls', 'Meetings', 'Appointments', 'Banking'],
      weekend: ['Scheduling', 'Household admin', 'Planning', 'Organizing']
    },
    'personal': {
      weekday: ['Dinner prep', 'Family time', 'Exercise', 'Hobbies'],
      weekend: ['Social activities', 'Hobbies', 'Relaxation', 'Outings']
    },
    'wind-down': {
      weekday: ['Light reading', 'Journaling', 'Tomorrow prep', 'Relaxation'],
      weekend: ['Movies/Shows', 'Light activities', 'Reflection', 'Planning']
    },
    'rest': {
      weekday: ['Sleep', 'Naps', 'Meditation', 'Quiet time'],
      weekend: ['Sleep in', 'Lazy morning', 'Relaxation', 'Recovery']
    }
  };
  
  const activitySet = activities[focus];
  let result = dayType === 'weekday' ? activitySet.weekday : activitySet.weekend;
  
  // Adjust for non-work weekdays
  if (dayType === 'weekday' && !isWorkDay) {
    result = activitySet.weekend; // Treat like weekend
  }
  
  return result;
}

// ============ MAIN CONTEXT FUNCTION ============

/**
 * Get complete temporal context for the current moment
 */
export function getTemporalContext(userContext: UserScheduleContext): TemporalContext {
  const now = new Date();
  const currentTime = getCurrentTime();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Day type
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayType: 'weekday' | 'weekend' = isWeekend ? 'weekend' : 'weekday';
  const isWorkDay = userContext.workDays.includes(dayOfWeek);
  
  // Current phase
  const currentPhaseObj = getPhaseForTime(currentTime);
  const nextPhaseObj = getNextPhase(currentPhaseObj.name);
  
  // Business hours
  const { businessHours, quietHours } = userContext.timeZoneSettings;
  let isBusinessHours = false;
  let businessHoursStatus: 'before' | 'during' | 'after' | 'not-applicable' = 'not-applicable';
  
  if (businessHours.enabled) {
    const businessStart = timeToMinutes(businessHours.startTime);
    const businessEnd = timeToMinutes(businessHours.endTime);
    const currentMinutes = timeToMinutes(currentTime);
    
    // Check weekday-only setting
    const businessApplies = !businessHours.weekdaysOnly || !isWeekend;
    
    if (businessApplies) {
      if (currentMinutes < businessStart) {
        businessHoursStatus = 'before';
      } else if (currentMinutes >= businessStart && currentMinutes < businessEnd) {
        businessHoursStatus = 'during';
        isBusinessHours = true;
      } else {
        businessHoursStatus = 'after';
      }
    }
  }
  
  // Quiet hours
  const isQuietHours = quietHours.enabled && isTimeInRange(currentTime, quietHours.startTime, quietHours.endTime);
  
  // Suggested focus - adjust based on context
  let suggestedFocus = currentPhaseObj.defaultFocus;
  
  // Override suggestions based on business hours
  if (isWorkDay && isBusinessHours) {
    if (suggestedFocus === 'personal' || suggestedFocus === 'routine') {
      suggestedFocus = 'deep-work';
    }
  }
  
  // Override during quiet hours
  if (isQuietHours) {
    suggestedFocus = 'wind-down';
  }
  
  // Get activities
  const suggestedActivities = getSuggestedActivities(suggestedFocus, dayType, isWorkDay);
  
  // Timing calculations
  const minutesIntoPhase = getMinutesIntoPhase(currentTime, currentPhaseObj);
  const minutesUntilPhaseChange = getMinutesUntilPhaseChange(currentTime, currentPhaseObj);
  
  // Transition detection (within 15 minutes of phase change)
  const isTransitionTime = minutesUntilPhaseChange <= 15 || minutesIntoPhase <= 15;
  
  // Good time calculations
  const isGoodTimeForRoutine = currentPhaseObj.name === 'early-morning' || 
                               currentPhaseObj.name === 'night' ||
                               (currentPhaseObj.name === 'evening' && minutesUntilPhaseChange <= 60);
  
  const isGoodTimeForDeepWork = (currentPhaseObj.name === 'morning' || currentPhaseObj.name === 'afternoon') &&
                                 !isQuietHours && 
                                 minutesUntilPhaseChange > 30; // Need at least 30 min left
  
  return {
    currentTime,
    currentDate: now,
    dayType,
    dayOfWeek,
    dayName: dayNames[dayOfWeek],
    isWorkDay,
    currentPhase: currentPhaseObj.name,
    phaseLabel: currentPhaseObj.label,
    phaseIcon: currentPhaseObj.icon,
    phaseColor: currentPhaseObj.color,
    phaseDescription: currentPhaseObj.description,
    isBusinessHours,
    businessHoursStatus,
    isQuietHours,
    suggestedFocus,
    suggestedActivities,
    minutesIntoPhase,
    minutesUntilPhaseChange,
    nextPhase: nextPhaseObj?.name || null,
    nextPhaseLabel: nextPhaseObj?.label || '',
    isTransitionTime,
    isGoodTimeForRoutine,
    isGoodTimeForDeepWork
  };
}

// ============ STRUCTURE SCORING ============

export interface StructureScore {
  overall: number;           // 0-100
  morningStructure: number;  // 0-100
  workStructure: number;     // 0-100
  eveningStructure: number;  // 0-100
  breakdown: {
    hasWakeRoutine: boolean;
    hasWorkBlocks: boolean;
    hasMealBreaks: boolean;
    hasEveningRoutine: boolean;
    hasWindDown: boolean;
    totalBlockedMinutes: number;
    totalAvailableMinutes: number;
  };
}

/**
 * Calculate structure score for a day's schedule
 */
export function calculateStructureScore(
  timeBlocks: Array<{ startTime: string; endTime: string; type?: string }>,
  userContext: UserScheduleContext
): StructureScore {
  const wakeMinutes = timeToMinutes(userContext.wakeTime);
  const sleepMinutes = timeToMinutes(userContext.sleepTime);
  const availableMinutes = sleepMinutes > wakeMinutes 
    ? sleepMinutes - wakeMinutes 
    : (1440 - wakeMinutes) + sleepMinutes;
  
  // Check for key structural elements
  const hasWakeRoutine = timeBlocks.some(b => {
    const start = timeToMinutes(b.startTime);
    return Math.abs(start - wakeMinutes) <= 60; // Within 1 hour of wake time
  });
  
  const hasEveningRoutine = timeBlocks.some(b => {
    const end = timeToMinutes(b.endTime);
    return Math.abs(end - sleepMinutes) <= 120; // Within 2 hours of sleep
  });
  
  const hasWorkBlocks = timeBlocks.some(b => {
    const start = timeToMinutes(b.startTime);
    const workStart = timeToMinutes(userContext.workStartTime);
    const workEnd = timeToMinutes(userContext.workEndTime);
    return start >= workStart && start < workEnd;
  });
  
  // Look for midday breaks
  const middayTime = timeToMinutes('12:00');
  const hasMealBreaks = timeBlocks.some(b => {
    const start = timeToMinutes(b.startTime);
    return Math.abs(start - middayTime) <= 90;
  });
  
  const hasWindDown = timeBlocks.some(b => {
    const start = timeToMinutes(b.startTime);
    const nightStart = timeToMinutes('21:00');
    return start >= nightStart;
  });
  
  // Calculate total blocked time
  let totalBlockedMinutes = 0;
  for (const block of timeBlocks) {
    const start = timeToMinutes(block.startTime);
    const end = timeToMinutes(block.endTime);
    totalBlockedMinutes += end > start ? end - start : (1440 - start) + end;
  }
  
  // Score calculation
  const morningScore = (hasWakeRoutine ? 50 : 0) + (hasWorkBlocks ? 50 : 0);
  const workScore = hasWorkBlocks ? 100 : (totalBlockedMinutes > 120 ? 50 : 0);
  const eveningScore = (hasEveningRoutine ? 40 : 0) + (hasWindDown ? 40 : 0) + (hasMealBreaks ? 20 : 0);
  
  // Coverage score (aim for 40-70% structured time)
  const coveragePercent = (totalBlockedMinutes / availableMinutes) * 100;
  let coverageScore = 0;
  if (coveragePercent >= 30 && coveragePercent <= 80) {
    coverageScore = 100 - Math.abs(55 - coveragePercent); // Peak at 55%
  } else if (coveragePercent < 30) {
    coverageScore = (coveragePercent / 30) * 70;
  } else {
    coverageScore = Math.max(0, 100 - (coveragePercent - 80) * 2);
  }
  
  const overall = Math.round((morningScore * 0.25) + (workScore * 0.25) + (eveningScore * 0.25) + (coverageScore * 0.25));
  
  return {
    overall,
    morningStructure: morningScore,
    workStructure: workScore,
    eveningStructure: eveningScore,
    breakdown: {
      hasWakeRoutine,
      hasWorkBlocks,
      hasMealBreaks,
      hasEveningRoutine,
      hasWindDown,
      totalBlockedMinutes,
      totalAvailableMinutes: availableMinutes
    }
  };
}
```

---

## PART 2: Structure Analysis Hook

### New File: `src/hooks/useStructureAnalysis.ts`

```typescript
import { useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { TimeBlock, ScheduleEntry, TimeZoneSettings } from '@/types';
import { 
  getTemporalContext, 
  calculateStructureScore,
  timeToMinutes,
  minutesToTime,
  DEFAULT_PHASES,
  UserScheduleContext,
  TemporalContext,
  StructureScore,
  SuggestedFocus
} from '@/lib/temporalContext';

// ============ TYPES ============

export interface TimeGap {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  phase: string;
  phaseLabel: string;
  suggestedUse: SuggestedFocus;
  suggestedActivities: string[];
  priority: 'high' | 'medium' | 'low';
  isTransitionGap: boolean;
}

export interface StructureSuggestion {
  id: string;
  type: 'anchor' | 'routine' | 'buffer' | 'transition' | 'deep-work';
  title: string;
  description: string;
  suggestedTime: {
    start: string;
    end: string;
  };
  category: string;
  weekdayOnly: boolean;
  weekendOnly: boolean;
  recurring: boolean;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

export interface PatternInsight {
  type: 'consistent' | 'inconsistent' | 'missing' | 'opportunity';
  area: 'morning' | 'work' | 'evening' | 'overall';
  message: string;
  suggestion?: string;
}

export interface StructureAnalysis {
  // Temporal context
  context: TemporalContext;
  
  // Coverage stats
  structuredTimePercent: number;
  unstructuredGaps: TimeGap[];
  
  // Pattern detection
  patterns: {
    hasConsistentWakeRoutine: boolean;
    hasConsistentWindDown: boolean;
    hasMealAnchors: boolean;
    hasWorkStructure: boolean;
  };
  
  // Scoring
  score: StructureScore;
  
  // Suggestions
  suggestions: StructureSuggestion[];
  insights: PatternInsight[];
  
  // Status
  status: 'empty' | 'minimal' | 'partial' | 'good' | 'excellent' | 'overloaded';
  statusMessage: string;
  statusEmoji: string;
}

// ============ STORAGE KEYS ============

const STRUCTURE_PATTERNS_KEY = 'neurulae-structure-patterns';
const STRUCTURE_HISTORY_KEY = 'neurulae-structure-history';

// ============ HOOK ============

export function useStructureAnalysis(
  timeBlocks: TimeBlock[],
  scheduleEntries: ScheduleEntry[],
  timeZoneSettings: TimeZoneSettings,
  userProfile: {
    wakeTime: string;
    sleepTime: string;
    workDays: string[];
    workStartTime: string;
    workEndTime: string;
  }
) {
  // Convert work days to numbers
  const workDayNumbers = useMemo(() => {
    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    return userProfile.workDays.map(d => dayMap[d]).filter(n => n !== undefined);
  }, [userProfile.workDays]);

  // Build user context
  const userContext: UserScheduleContext = useMemo(() => ({
    wakeTime: userProfile.wakeTime || '07:00',
    sleepTime: userProfile.sleepTime || '23:00',
    workDays: workDayNumbers,
    workStartTime: userProfile.workStartTime || '09:00',
    workEndTime: userProfile.workEndTime || '17:00',
    timeZoneSettings
  }), [userProfile, workDayNumbers, timeZoneSettings]);

  // Get temporal context
  const temporalContext = useMemo(() => getTemporalContext(userContext), [userContext]);

  // Filter blocks for current day type
  const todaysBlocks = useMemo(() => {
    const isWeekend = temporalContext.dayType === 'weekend';
    return timeBlocks.filter(block => 
      block.scheduleType === 'everyday' ||
      (isWeekend && block.scheduleType === 'weekend') ||
      (!isWeekend && block.scheduleType === 'weekday')
    );
  }, [timeBlocks, temporalContext.dayType]);

  // Calculate structure score
  const structureScore = useMemo(() => {
    const blocksForScore = todaysBlocks.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime,
      type: b.type
    }));
    return calculateStructureScore(blocksForScore, userContext);
  }, [todaysBlocks, userContext]);

  // Find gaps in schedule
  const gaps = useMemo((): TimeGap[] => {
    const wakeMinutes = timeToMinutes(userContext.wakeTime);
    const sleepMinutes = timeToMinutes(userContext.sleepTime);
    
    // Sort blocks by start time
    const sortedBlocks = [...todaysBlocks].sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    
    const foundGaps: TimeGap[] = [];
    let currentTime = wakeMinutes;
    
    for (const block of sortedBlocks) {
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      
      // Skip blocks outside waking hours
      if (blockEnd < wakeMinutes || blockStart > sleepMinutes) continue;
      
      // Check for gap before this block
      if (blockStart > currentTime) {
        const gapDuration = blockStart - currentTime;
        
        // Only count gaps >= 30 minutes
        if (gapDuration >= 30) {
          const gapStartTime = minutesToTime(currentTime);
          const phase = DEFAULT_PHASES.find(p => {
            const pStart = timeToMinutes(p.startTime);
            const pEnd = timeToMinutes(p.endTime);
            return currentTime >= pStart && currentTime < pEnd;
          }) || DEFAULT_PHASES[0];
          
          foundGaps.push({
            id: `gap-${currentTime}-${blockStart}`,
            startTime: gapStartTime,
            endTime: minutesToTime(blockStart),
            durationMinutes: gapDuration,
            phase: phase.name,
            phaseLabel: phase.label,
            suggestedUse: phase.defaultFocus,
            suggestedActivities: [], // Will be filled based on context
            priority: gapDuration >= 120 ? 'high' : gapDuration >= 60 ? 'medium' : 'low',
            isTransitionGap: gapDuration <= 30
          });
        }
      }
      
      currentTime = Math.max(currentTime, blockEnd);
    }
    
    // Check for gap after last block until sleep
    if (currentTime < sleepMinutes) {
      const gapDuration = sleepMinutes - currentTime;
      if (gapDuration >= 30) {
        const gapStartTime = minutesToTime(currentTime);
        const phase = DEFAULT_PHASES.find(p => {
          const pStart = timeToMinutes(p.startTime);
          const pEnd = timeToMinutes(p.endTime);
          return currentTime >= pStart && currentTime < pEnd;
        }) || DEFAULT_PHASES[0];
        
        foundGaps.push({
          id: `gap-${currentTime}-${sleepMinutes}`,
          startTime: gapStartTime,
          endTime: minutesToTime(sleepMinutes),
          durationMinutes: gapDuration,
          phase: phase.name,
          phaseLabel: phase.label,
          suggestedUse: phase.defaultFocus,
          suggestedActivities: [],
          priority: gapDuration >= 120 ? 'high' : gapDuration >= 60 ? 'medium' : 'low',
          isTransitionGap: false
        });
      }
    }
    
    return foundGaps;
  }, [todaysBlocks, userContext]);

  // Generate suggestions
  const suggestions = useMemo((): StructureSuggestion[] => {
    const result: StructureSuggestion[] = [];
    const { breakdown } = structureScore;
    
    // Morning routine suggestion
    if (!breakdown.hasWakeRoutine) {
      const wakeTime = userContext.wakeTime;
      const endTime = minutesToTime(timeToMinutes(wakeTime) + 60);
      result.push({
        id: 'suggest-morning-routine',
        type: 'routine',
        title: 'Morning Routine',
        description: 'Start your day with intention',
        suggestedTime: { start: wakeTime, end: endTime },
        category: 'routine',
        weekdayOnly: false,
        weekendOnly: false,
        recurring: true,
        priority: 'high',
        icon: 'Sunrise'
      });
    }
    
    // Work block suggestion
    if (!breakdown.hasWorkBlocks && temporalContext.isWorkDay) {
      result.push({
        id: 'suggest-work-block',
        type: 'deep-work',
        title: 'Focus Work Block',
        description: 'Dedicated time for your most important work',
        suggestedTime: { 
          start: userContext.workStartTime, 
          end: minutesToTime(timeToMinutes(userContext.workStartTime) + 120)
        },
        category: 'work',
        weekdayOnly: true,
        weekendOnly: false,
        recurring: true,
        priority: 'high',
        icon: 'Briefcase'
      });
    }
    
    // Meal break suggestion
    if (!breakdown.hasMealBreaks) {
      result.push({
        id: 'suggest-lunch',
        type: 'buffer',
        title: 'Lunch Break',
        description: 'Rest and refuel',
        suggestedTime: { start: '12:00', end: '13:00' },
        category: 'break',
        weekdayOnly: false,
        weekendOnly: false,
        recurring: true,
        priority: 'medium',
        icon: 'UtensilsCrossed'
      });
    }
    
    // Evening routine suggestion
    if (!breakdown.hasEveningRoutine) {
      const eveningStart = minutesToTime(timeToMinutes(userContext.sleepTime) - 120);
      const eveningEnd = minutesToTime(timeToMinutes(userContext.sleepTime) - 60);
      result.push({
        id: 'suggest-evening-routine',
        type: 'routine',
        title: 'Evening Wind-Down',
        description: 'Transition to rest mode',
        suggestedTime: { start: eveningStart, end: eveningEnd },
        category: 'routine',
        weekdayOnly: false,
        weekendOnly: false,
        recurring: true,
        priority: 'medium',
        icon: 'Moon'
      });
    }
    
    // Gap-based suggestions
    for (const gap of gaps.slice(0, 3)) { // Max 3 gap suggestions
      if (gap.priority === 'high') {
        result.push({
          id: `suggest-fill-${gap.id}`,
          type: 'buffer',
          title: `${gap.phaseLabel} Block`,
          description: `${gap.durationMinutes} minutes available`,
          suggestedTime: { start: gap.startTime, end: gap.endTime },
          category: gap.suggestedUse,
          weekdayOnly: temporalContext.dayType === 'weekday',
          weekendOnly: temporalContext.dayType === 'weekend',
          recurring: false,
          priority: 'low',
          icon: 'Plus'
        });
      }
    }
    
    return result;
  }, [structureScore, gaps, temporalContext, userContext]);

  // Generate insights
  const insights = useMemo((): PatternInsight[] => {
    const result: PatternInsight[] = [];
    const { breakdown } = structureScore;
    
    if (breakdown.hasWakeRoutine && breakdown.hasEveningRoutine) {
      result.push({
        type: 'consistent',
        area: 'overall',
        message: 'Great job maintaining morning and evening routines!',
      });
    }
    
    if (!breakdown.hasWakeRoutine) {
      result.push({
        type: 'missing',
        area: 'morning',
        message: 'No morning routine detected',
        suggestion: 'Adding a morning routine can help start your day with intention'
      });
    }
    
    if (breakdown.totalBlockedMinutes > breakdown.totalAvailableMinutes * 0.8) {
      result.push({
        type: 'inconsistent',
        area: 'overall',
        message: 'Your schedule looks very packed',
        suggestion: 'Consider adding buffer time between blocks for transitions'
      });
    }
    
    if (gaps.length > 5) {
      result.push({
        type: 'opportunity',
        area: 'overall',
        message: `You have ${gaps.length} unstructured periods today`,
        suggestion: 'Some unstructured time is good, but you might benefit from a few anchor points'
      });
    }
    
    return result;
  }, [structureScore, gaps]);

  // Determine status
  const status = useMemo(() => {
    const { overall } = structureScore;
    const blockCount = todaysBlocks.length;
    
    if (blockCount === 0) {
      return {
        status: 'empty' as const,
        message: "Let's build some structure for today",
        emoji: '🌱'
      };
    }
    
    if (overall < 25) {
      return {
        status: 'minimal' as const,
        message: 'A few anchors in place',
        emoji: '🌿'
      };
    }
    
    if (overall < 50) {
      return {
        status: 'partial' as const,
        message: 'Structure taking shape',
        emoji: '🌳'
      };
    }
    
    if (overall < 75) {
      return {
        status: 'good' as const,
        message: 'Good structure today!',
        emoji: '✨'
      };
    }
    
    if (overall <= 90) {
      return {
        status: 'excellent' as const,
        message: 'Excellent structure!',
        emoji: '🌟'
      };
    }
    
    return {
      status: 'overloaded' as const,
      message: 'Schedule looks very full',
      emoji: '⚠️'
    };
  }, [structureScore, todaysBlocks]);

  // Calculate structured time percentage
  const structuredTimePercent = useMemo(() => {
    const { breakdown } = structureScore;
    if (breakdown.totalAvailableMinutes === 0) return 0;
    return Math.round((breakdown.totalBlockedMinutes / breakdown.totalAvailableMinutes) * 100);
  }, [structureScore]);

  return {
    context: temporalContext,
    structuredTimePercent,
    unstructuredGaps: gaps,
    patterns: {
      hasConsistentWakeRoutine: structureScore.breakdown.hasWakeRoutine,
      hasConsistentWindDown: structureScore.breakdown.hasWindDown,
      hasMealAnchors: structureScore.breakdown.hasMealBreaks,
      hasWorkStructure: structureScore.breakdown.hasWorkBlocks
    },
    score: structureScore,
    suggestions,
    insights,
    status: status.status,
    statusMessage: status.message,
    statusEmoji: status.emoji
  };
}
```

---

## PART 3: Structure Coach Component

### New File: `src/components/structure/StructureCoach.tsx`

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Plus, 
  Lightbulb, 
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sunrise,
  Moon,
  Coffee,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StructureAnalysis, StructureSuggestion } from '@/hooks/useStructureAnalysis';

interface StructureCoachProps {
  analysis: StructureAnalysis;
  onAcceptSuggestion: (suggestion: StructureSuggestion) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onOpenTemplates: () => void;
  className?: string;
}

export function StructureCoach({
  analysis,
  onAcceptSuggestion,
  onDismissSuggestion,
  onOpenTemplates,
  className
}: StructureCoachProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const visibleSuggestions = analysis.suggestions.filter(s => !dismissedSuggestions.has(s.id));

  const handleDismiss = (id: string) => {
    setDismissedSuggestions(prev => new Set([...prev, id]));
    onDismissSuggestion(id);
  };

  const getStatusColor = (status: StructureAnalysis['status']) => {
    switch (status) {
      case 'empty': return 'text-muted-foreground';
      case 'minimal': return 'text-amber-500';
      case 'partial': return 'text-blue-500';
      case 'good': return 'text-green-500';
      case 'excellent': return 'text-emerald-500';
      case 'overloaded': return 'text-orange-500';
    }
  };

  const getIconForSuggestion = (suggestion: StructureSuggestion) => {
    switch (suggestion.icon) {
      case 'Sunrise': return Sunrise;
      case 'Moon': return Moon;
      case 'Coffee': return Coffee;
      case 'Briefcase': return Briefcase;
      default: return Plus;
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={cn('border-dashed', className)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Structure Coach
                    <Badge variant="outline" className={cn('text-xs', getStatusColor(analysis.status))}>
                      {analysis.statusEmoji} {analysis.score.overall}%
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{analysis.statusMessage}</p>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Structure Coverage</span>
                <span>{analysis.structuredTimePercent}% of waking hours</span>
              </div>
              <Progress value={analysis.structuredTimePercent} className="h-2" />
            </div>

            {/* Current Phase Info */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{analysis.context.phaseLabel}</span>
                <span className="text-muted-foreground"> · Good for </span>
                <span className="text-primary">{analysis.context.suggestedFocus}</span>
              </span>
              {analysis.context.minutesUntilPhaseChange <= 30 && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {analysis.context.nextPhaseLabel} in {analysis.context.minutesUntilPhaseChange}m
                </Badge>
              )}
            </div>

            {/* Suggestions */}
            {visibleSuggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Suggestions
                </h4>
                <div className="space-y-2">
                  {visibleSuggestions.slice(0, 3).map(suggestion => {
                    const Icon = getIconForSuggestion(suggestion);
                    return (
                      <div
                        key={suggestion.id}
                        className="flex items-center gap-3 p-2 rounded-lg border border-dashed hover:border-primary/50 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="p-1.5 rounded bg-muted">
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.suggestedTime.start} - {suggestion.suggestedTime.end}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => handleDismiss(suggestion.id)}
                          >
                            Skip
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => onAcceptSuggestion(suggestion)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Insights */}
            {analysis.insights.length > 0 && (
              <div className="space-y-2">
                {analysis.insights.slice(0, 2).map((insight, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-lg text-xs',
                      insight.type === 'consistent' && 'bg-green-500/10 text-green-700 dark:text-green-400',
                      insight.type === 'missing' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                      insight.type === 'inconsistent' && 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
                      insight.type === 'opportunity' && 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                    )}
                  >
                    {insight.type === 'consistent' ? (
                      <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{insight.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onOpenTemplates}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Use Template
              </Button>
              {analysis.status === 'good' || analysis.status === 'excellent' ? (
                <Button variant="outline" size="sm" className="flex-1">
                  <Target className="h-3 w-3 mr-1" />
                  Save as Template
                </Button>
              ) : null}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
```

---

## PART 4: Ghost Suggestion Blocks

### New File: `src/components/structure/GhostSuggestionBlock.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StructureSuggestion } from '@/hooks/useStructureAnalysis';

interface GhostSuggestionBlockProps {
  suggestion: StructureSuggestion;
  topPercent: number;
  heightPercent: number;
  onAccept: (suggestion: StructureSuggestion) => void;
  onDismiss: (suggestionId: string) => void;
}

export function GhostSuggestionBlock({
  suggestion,
  topPercent,
  heightPercent,
  onAccept,
  onDismiss
}: GhostSuggestionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Don't show very small blocks
  if (heightPercent < 2) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'absolute left-20 right-4 rounded-lg transition-all duration-200 cursor-pointer',
              'border-2 border-dashed',
              isHovered 
                ? 'border-primary/60 bg-primary/10' 
                : 'border-muted-foreground/20 bg-muted/30',
              'hover:border-primary/60 hover:bg-primary/10'
            )}
            style={{
              top: `${topPercent}%`,
              height: `${Math.max(heightPercent, 3)}%`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onAccept(suggestion)}
          >
            <div className="flex items-center justify-center h-full gap-2 px-2">
              <Plus className={cn(
                'h-4 w-4 transition-colors',
                isHovered ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'text-xs font-medium truncate transition-colors',
                isHovered ? 'text-primary' : 'text-muted-foreground'
              )}>
                {suggestion.title}
              </span>
              
              {/* Dismiss button - only show on hover */}
              {isHovered && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(suggestion.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{suggestion.title}</p>
            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
            <p className="text-xs">
              {suggestion.suggestedTime.start} - {suggestion.suggestedTime.end}
            </p>
            <p className="text-xs text-primary">Click to add this block</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

## PART 5: Phase Background Visualization

### New File: `src/components/structure/PhaseBackgrounds.tsx`

```typescript
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DEFAULT_PHASES, PhaseDefinition, timeToMinutes } from '@/lib/temporalContext';

interface PhaseBackgroundsProps {
  phases?: PhaseDefinition[];
  wakeTime: string;
  sleepTime: string;
  currentPhase: string;
  showLabels?: boolean;
}

export function PhaseBackgrounds({
  phases = DEFAULT_PHASES,
  wakeTime,
  sleepTime,
  currentPhase,
  showLabels = true
}: PhaseBackgroundsProps) {
  const phaseRegions = useMemo(() => {
    const wakeMinutes = timeToMinutes(wakeTime);
    const sleepMinutes = timeToMinutes(sleepTime);
    const totalMinutes = 24 * 60;
    
    return phases.map(phase => {
      const startMinutes = timeToMinutes(phase.startTime);
      const endMinutes = timeToMinutes(phase.endTime);
      
      // Calculate position as percentage of day
      const startPercent = (startMinutes / totalMinutes) * 100;
      const endPercent = endMinutes > startMinutes 
        ? (endMinutes / totalMinutes) * 100
        : 100; // Handle overnight phases
      
      const heightPercent = endPercent - startPercent;
      
      // Determine if this phase is within waking hours
      const isInWakingHours = 
        (startMinutes >= wakeMinutes && startMinutes < sleepMinutes) ||
        (endMinutes > wakeMinutes && endMinutes <= sleepMinutes);
      
      return {
        ...phase,
        startPercent,
        heightPercent,
        isInWakingHours,
        isCurrent: phase.name === currentPhase
      };
    });
  }, [phases, wakeTime, sleepTime, currentPhase]);

  const getPhaseGradient = (color: string, isCurrent: boolean) => {
    const opacity = isCurrent ? '0.15' : '0.05';
    const colorMap: Record<string, string> = {
      'amber': `rgba(245, 158, 11, ${opacity})`,
      'yellow': `rgba(234, 179, 8, ${opacity})`,
      'orange': `rgba(249, 115, 22, ${opacity})`,
      'blue': `rgba(59, 130, 246, ${opacity})`,
      'purple': `rgba(168, 85, 247, ${opacity})`,
      'indigo': `rgba(99, 102, 241, ${opacity})`,
      'slate': `rgba(100, 116, 139, ${opacity})`
    };
    return colorMap[color] || `rgba(100, 100, 100, ${opacity})`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {phaseRegions.map(region => (
        <div
          key={region.name}
          className={cn(
            'absolute left-0 right-0 transition-colors duration-300',
            region.isCurrent && 'ring-1 ring-inset ring-primary/20'
          )}
          style={{
            top: `${region.startPercent}%`,
            height: `${region.heightPercent}%`,
            backgroundColor: getPhaseGradient(region.color, region.isCurrent)
          }}
        >
          {/* Phase label */}
          {showLabels && region.isInWakingHours && (
            <div className={cn(
              'absolute left-1 top-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
              'bg-background/80 backdrop-blur-sm',
              region.isCurrent ? 'text-primary' : 'text-muted-foreground'
            )}>
              {region.label}
            </div>
          )}
          
          {/* Phase divider line */}
          <div className={cn(
            'absolute bottom-0 left-0 right-0 h-px',
            region.isCurrent ? 'bg-primary/30' : 'bg-border/50'
          )} />
        </div>
      ))}
    </div>
  );
}
```

---

## PART 6: Day Template Manager

### New File: `src/components/structure/DayTemplateManager.tsx`

```typescript
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Copy, 
  Trash2, 
  Check, 
  Plus,
  Briefcase,
  Coffee
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TimeBlock, DayTemplate } from '@/types';
import { cn } from '@/lib/utils';

interface DayTemplateManagerProps {
  currentBlocks: TimeBlock[];
  currentDayType: 'weekday' | 'weekend';
  onApplyTemplate: (template: DayTemplate) => void;
  onSaveAsTemplate: (name: string, suggestedFor: 'weekday' | 'weekend' | 'any') => void;
}

export function DayTemplateManager({
  currentBlocks,
  currentDayType,
  onApplyTemplate,
  onSaveAsTemplate
}: DayTemplateManagerProps) {
  const [templates, setTemplates] = useLocalStorage<DayTemplate[]>('neurulae-day-templates', []);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveMode, setIsSaveMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDayType, setNewTemplateDayType] = useState<'weekday' | 'weekend' | 'any'>('any');

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
      t.suggestedFor === 'any' || t.suggestedFor === currentDayType
    );
  }, [templates, currentDayType]);

  const handleSave = () => {
    if (!newTemplateName.trim()) return;
    
    const newTemplate: DayTemplate = {
      id: crypto.randomUUID(),
      name: newTemplateName,
      description: `${currentBlocks.length} time blocks`,
      timeBlocks: currentBlocks.map(b => ({
        startTime: b.startTime,
        endTime: b.endTime,
        type: 'time_block',
        blockName: b.title,
        color: b.color
      })),
      suggestedFor: newTemplateDayType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timesUsed: 0
    };
    
    setTemplates([...templates, newTemplate]);
    onSaveAsTemplate(newTemplateName, newTemplateDayType);
    setNewTemplateName('');
    setIsSaveMode(false);
  };

  const handleDelete = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const handleApply = (template: DayTemplate) => {
    // Update usage count
    setTemplates(templates.map(t => 
      t.id === template.id 
        ? { ...t, timesUsed: t.timesUsed + 1, updatedAt: new Date().toISOString() }
        : t
    ));
    onApplyTemplate(template);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Day Templates</DialogTitle>
          <DialogDescription>
            Save your current schedule as a template or apply a saved template
          </DialogDescription>
        </DialogHeader>

        {isSaveMode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g., Productive Weekday, Relaxed Sunday"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Best for</Label>
              <RadioGroup
                value={newTemplateDayType}
                onValueChange={(v) => setNewTemplateDayType(v as 'weekday' | 'weekend' | 'any')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekday" id="weekday" />
                  <Label htmlFor="weekday" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Weekdays
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekend" id="weekend" />
                  <Label htmlFor="weekend" className="flex items-center gap-2">
                    <Coffee className="h-4 w-4" />
                    Weekends
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any" id="any" />
                  <Label htmlFor="any">Any day</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                This will save your current {currentBlocks.length} time blocks as a reusable template.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsSaveMode(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!newTemplateName.trim()} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Save current as template */}
            {currentBlocks.length > 0 && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsSaveMode(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Save current schedule as template
              </Button>
            )}

            {/* Template list */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No templates yet</p>
                    <p className="text-xs">Save your current schedule to create one</p>
                  </div>
                ) : (
                  filteredTemplates.map(template => (
                    <Card key={template.id} className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {template.timeBlocks.length} blocks · Used {template.timesUsed} times
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {template.suggestedFor !== 'any' && (
                              <Badge variant="outline" className="text-xs">
                                {template.suggestedFor}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2 px-4 border-t flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApply(template)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## PART 7: Timeline Integration Updates

### Modify: `src/components/DailyFlowTimeline.tsx`

Add the following imports at the top:

```typescript
import { useStructureAnalysis } from '@/hooks/useStructureAnalysis';
import { StructureCoach } from '@/components/structure/StructureCoach';
import { GhostSuggestionBlock } from '@/components/structure/GhostSuggestionBlock';
import { PhaseBackgrounds } from '@/components/structure/PhaseBackgrounds';
import { DayTemplateManager } from '@/components/structure/DayTemplateManager';
import { timeToMinutes } from '@/lib/temporalContext';
```

Add new state variables:

```typescript
const [showStructureCoach, setShowStructureCoach] = useState(true);
const [showGhostSuggestions, setShowGhostSuggestions] = useState(true);
const [showPhaseBackgrounds, setShowPhaseBackgrounds] = useState(true);
const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
```

Add the structure analysis hook (after existing state):

```typescript
// Structure Analysis
const structureAnalysis = useStructureAnalysis(
  timeBlocks,
  scheduleEntries,
  timeZoneSettings,
  {
    wakeTime: userProfile?.default_wake_time || '07:00',
    sleepTime: userProfile?.default_sleep_time || '23:00',
    workDays: userProfile?.work_schedule?.map(s => 
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][s.dayOfWeek]
    ) || [],
    workStartTime: userProfile?.work_schedule?.[0]?.startTime || '09:00',
    workEndTime: userProfile?.work_schedule?.[0]?.endTime || '17:00'
  }
);
```

Add handlers for structure coach:

```typescript
const handleAcceptSuggestion = (suggestion: StructureSuggestion) => {
  // Create a new time block from the suggestion
  const newBlock: TimeBlock = {
    id: crypto.randomUUID(),
    title: suggestion.title,
    startTime: suggestion.suggestedTime.start,
    endTime: suggestion.suggestedTime.end,
    type: suggestion.type === 'deep-work' ? 'dedicated' : 'main',
    scheduleType: suggestion.weekdayOnly ? 'weekday' : suggestion.weekendOnly ? 'weekend' : 'everyday',
    createdAt: new Date().toISOString()
  };
  
  setTimeBlocks([...timeBlocks, newBlock]);
  setDismissedSuggestions(prev => new Set([...prev, suggestion.id]));
};

const handleDismissSuggestion = (suggestionId: string) => {
  setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
};

const handleApplyTemplate = (template: DayTemplate) => {
  // Convert template blocks to TimeBlocks
  const newBlocks: TimeBlock[] = template.timeBlocks.map(tb => ({
    id: crypto.randomUUID(),
    title: tb.blockName || 'Untitled Block',
    startTime: tb.startTime,
    endTime: tb.endTime,
    type: tb.type === 'routine' ? 'main' : 'dedicated',
    scheduleType: template.suggestedFor === 'weekday' ? 'weekday' : 
                  template.suggestedFor === 'weekend' ? 'weekend' : 'everyday',
    color: tb.color,
    createdAt: new Date().toISOString()
  }));
  
  // Option: Replace or merge
  setTimeBlocks(newBlocks);
};
```

Add to the timeline view section (inside the timeline container div):

```tsx
{/* Phase Backgrounds - render first, behind everything */}
{showPhaseBackgrounds && (
  <PhaseBackgrounds
    wakeTime={userProfile?.default_wake_time || '07:00'}
    sleepTime={userProfile?.default_sleep_time || '23:00'}
    currentPhase={structureAnalysis.context.currentPhase}
    showLabels={true}
  />
)}

{/* Ghost Suggestion Blocks */}
{showGhostSuggestions && structureAnalysis.suggestions
  .filter(s => !dismissedSuggestions.has(s.id))
  .map(suggestion => {
    const startMinutes = timeToMinutes(suggestion.suggestedTime.start);
    const endMinutes = timeToMinutes(suggestion.suggestedTime.end);
    const topPercent = (startMinutes / (24 * 60)) * 100;
    const heightPercent = ((endMinutes - startMinutes) / (24 * 60)) * 100;
    
    return (
      <GhostSuggestionBlock
        key={suggestion.id}
        suggestion={suggestion}
        topPercent={topPercent}
        heightPercent={heightPercent}
        onAccept={handleAcceptSuggestion}
        onDismiss={handleDismissSuggestion}
      />
    );
  })
}
```

Add Structure Coach below the timeline:

```tsx
{/* Structure Coach - below timeline */}
{showStructureCoach && (
  <StructureCoach
    analysis={structureAnalysis}
    onAcceptSuggestion={handleAcceptSuggestion}
    onDismissSuggestion={handleDismissSuggestion}
    onOpenTemplates={() => {/* Open template dialog */}}
    className="mt-4"
  />
)}
```

Add template manager button to the action buttons section:

```tsx
<DayTemplateManager
  currentBlocks={filteredBlocks}
  currentDayType={scheduleType === 'weekend' ? 'weekend' : 'weekday'}
  onApplyTemplate={handleApplyTemplate}
  onSaveAsTemplate={(name, dayType) => {
    toast({ title: 'Template Saved', description: `"${name}" saved successfully` });
  }}
/>
```

Add toggle buttons for new features:

```tsx
<div className="flex items-center gap-2">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setShowStructureCoach(!showStructureCoach)}
    className={cn(!showStructureCoach && 'opacity-50')}
  >
    <Sparkles className="h-4 w-4" />
  </Button>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setShowPhaseBackgrounds(!showPhaseBackgrounds)}
    className={cn(!showPhaseBackgrounds && 'opacity-50')}
  >
    <Layers className="h-4 w-4" />
  </Button>
</div>
```

---

## PART 8: Timer Integration Enhancements

### Modify: `src/components/DailyFlowTimeline.tsx`

Add connection to global timer state:

```typescript
import { useGlobalTimer } from '@/hooks/useGlobalTimer';

// Inside component
const { state: timerState } = useGlobalTimer();
```

Add active block highlighting in the `renderBlock` function:

```typescript
const isTimerActive = timerState.isRunning && timerState.taskId === block.id;
const isTimerPaused = timerState.isPaused && timerState.taskId === block.id;

// Add to block className
className={cn(
  // ... existing classes
  isTimerActive && 'ring-2 ring-primary ring-offset-2 animate-pulse',
  isTimerPaused && 'ring-2 ring-amber-500 ring-offset-2'
)}
```

Add "Start Timer" action to block context menu or click handler:

```typescript
const handleStartTimerForBlock = (block: TimeBlock) => {
  const durationMinutes = /* calculate from block times */;
  startTimer(durationMinutes * 60, 'focus', { id: block.id, title: block.title });
};
```

---

## PART 9: Settings Integration

### Modify: `src/pages/Settings.tsx`

Add new settings section for Structure features:

```tsx
{/* Structure Settings */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg flex items-center gap-2">
      <Sparkles className="h-5 w-5" />
      Structure Coach
    </CardTitle>
    <CardDescription>
      Configure how the app helps you build daily structure
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <Label>Enable Structure Coach</Label>
        <p className="text-xs text-muted-foreground">Show structure suggestions on timeline</p>
      </div>
      <Switch
        checked={structureSettings.enableCoaching}
        onCheckedChange={(v) => setStructureSettings(s => ({ ...s, enableCoaching: v }))}
      />
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <Label>Show Phase Backgrounds</Label>
        <p className="text-xs text-muted-foreground">Visual day phase indicators</p>
      </div>
      <Switch
        checked={structureSettings.showPhaseBackgrounds}
        onCheckedChange={(v) => setStructureSettings(s => ({ ...s, showPhaseBackgrounds: v }))}
      />
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <Label>Show Ghost Suggestions</Label>
        <p className="text-xs text-muted-foreground">Clickable suggestions for empty time</p>
      </div>
      <Switch
        checked={structureSettings.showGhostSuggestions}
        onCheckedChange={(v) => setStructureSettings(s => ({ ...s, showGhostSuggestions: v }))}
      />
    </div>
    
    <Separator />
    
    <div className="space-y-2">
      <Label>Coaching Intensity</Label>
      <RadioGroup
        value={structureSettings.coachingIntensity}
        onValueChange={(v) => setStructureSettings(s => ({ ...s, coachingIntensity: v }))}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="gentle" id="gentle" />
          <Label htmlFor="gentle">Gentle - Minimal suggestions</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="moderate" id="moderate" />
          <Label htmlFor="moderate">Moderate - Balanced guidance</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="active" id="active" />
          <Label htmlFor="active">Active - Proactive suggestions</Label>
        </div>
      </RadioGroup>
    </div>
  </CardContent>
</Card>
```

---

## PART 10: Types to Add

### Modify: `src/types/index.ts`

Add these new types:

```typescript
// ============ STRUCTURE SETTINGS ============

export interface StructureSettings {
  enableCoaching: boolean;
  coachingIntensity: 'gentle' | 'moderate' | 'active';
  showPhaseBackgrounds: boolean;
  showGhostSuggestions: boolean;
  showStructureScore: boolean;
  autoApplyWeekdayTemplate: boolean;
  autoApplyWeekendTemplate: boolean;
  askBeforeApplyingTemplate: boolean;
  notifyPhaseTransitions: boolean;
  notifyEmptySchedule: boolean;
  trackPatterns: boolean;
}

export const DEFAULT_STRUCTURE_SETTINGS: StructureSettings = {
  enableCoaching: true,
  coachingIntensity: 'moderate',
  showPhaseBackgrounds: true,
  showGhostSuggestions: true,
  showStructureScore: true,
  autoApplyWeekdayTemplate: false,
  autoApplyWeekendTemplate: false,
  askBeforeApplyingTemplate: true,
  notifyPhaseTransitions: false,
  notifyEmptySchedule: false,
  trackPatterns: true
};

// ============ STRUCTURE PATTERNS (for learning) ============

export interface StructurePatternHistory {
  date: string;
  dayType: 'weekday' | 'weekend';
  score: number;
  blockCount: number;
  hadMorningRoutine: boolean;
  hadEveningRoutine: boolean;
  completionRate: number;
}

export interface LearnedStructurePatterns {
  typicalWakeTime: string;
  typicalSleepTime: string;
  averageBlockCount: number;
  preferredBlockDuration: number;
  commonBlockTitles: string[];
  weekdayPattern: {
    morningBlocks: number;
    afternoonBlocks: number;
    eveningBlocks: number;
  };
  weekendPattern: {
    morningBlocks: number;
    afternoonBlocks: number;
    eveningBlocks: number;
  };
  structureTrend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}
```

---

## Implementation Order

Follow this order for the cleanest implementation:

1. **`src/lib/temporalContext.ts`** - Foundation, no dependencies
2. **`src/types/index.ts`** - Add new types
3. **`src/hooks/useStructureAnalysis.ts`** - Uses temporalContext
4. **`src/components/structure/PhaseBackgrounds.tsx`** - Simple visual component
5. **`src/components/structure/GhostSuggestionBlock.tsx`** - Simple visual component
6. **`src/components/structure/StructureCoach.tsx`** - Uses analysis types
7. **`src/components/structure/DayTemplateManager.tsx`** - Uses existing types
8. **`src/components/DailyFlowTimeline.tsx`** - Integrate all components
9. **`src/pages/Settings.tsx`** - Add settings UI

---

## Testing Checklist

After implementation, verify:

- [ ] Phase backgrounds render correctly and highlight current phase
- [ ] Ghost suggestions appear in unstructured gaps
- [ ] Clicking ghost suggestions creates real blocks
- [ ] Structure coach shows correct score and suggestions
- [ ] Suggestions update when blocks are added/removed
- [ ] Templates can be saved and applied
- [ ] Weekday/weekend filtering works correctly
- [ ] Timer integration highlights active blocks
- [ ] Settings toggles enable/disable features correctly
- [ ] Mobile layout remains usable

---

## AuDHD-Friendly Design Notes

Key principles implemented:

1. **Visual clarity** - Phase backgrounds provide at-a-glance understanding
2. **Low friction** - One-click to accept suggestions
3. **No forced flows** - All features are optional and toggleable
4. **Progress celebration** - Structure score celebrates any progress
5. **Gentle guidance** - Suggestions, never requirements
6. **Consistent placement** - Coach always in same location
7. **Reduced overwhelm** - Max 3 suggestions shown at once

---

## Questions for Clarification

Before starting, confirm:

1. Should ghost suggestions only appear during current day's view, or also when viewing weekday/weekend templates?
2. Should the Structure Coach auto-collapse after a certain time?
3. Preferred animation style for phase transitions?
4. Should templates sync to Supabase for cross-device access?
