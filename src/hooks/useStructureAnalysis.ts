import { useMemo, useCallback } from 'react';
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
  context: TemporalContext;
  structuredTimePercent: number;
  unstructuredGaps: TimeGap[];
  patterns: {
    hasConsistentWakeRoutine: boolean;
    hasConsistentWindDown: boolean;
    hasMealAnchors: boolean;
    hasWorkStructure: boolean;
  };
  score: StructureScore;
  suggestions: StructureSuggestion[];
  insights: PatternInsight[];
  status: 'empty' | 'minimal' | 'partial' | 'good' | 'excellent' | 'overloaded';
  statusMessage: string;
  statusEmoji: string;
}

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
): StructureAnalysis {
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
            suggestedActivities: [],
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
    
    // Gap-based suggestions (max 3)
    for (const gap of gaps.slice(0, 3)) {
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

// Re-export types for convenience
export type { TemporalContext, StructureScore, SuggestedFocus };
