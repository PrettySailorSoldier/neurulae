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

// ============ TRANSITION SUPPORT TYPES ============

export interface TransitionInfo {
  fromPhase: DayPhase;
  toPhase: DayPhase;
  minutesUntil: number;
  isApproaching: boolean;  // Within 20 minutes
}

export interface TransitionWarnings {
  at20Minutes: boolean;
  at10Minutes: boolean;
  at5Minutes: boolean;
  at1Minute: boolean;
}

export interface TransitionRitual {
  title: string;
  description: string;
  steps: string[];
  estimatedDuration: number;  // minutes
  category: 'wrap-up' | 'preparation' | 'environment' | 'mindset';
}

export interface EnvironmentHints {
  lighting: string | null;    // "Open blinds" or "Dim overhead lights"
  sound: string | null;        // "Consider quiet background music"
  space: string | null;        // "Clear your desk for evening"
  timing: string | null;       // "Good time for outdoor break"
}

// ============ MAIN CONTEXT TYPES ============

export interface TemporalContext {
  currentTime: string;
  currentDate: Date;
  dayType: 'weekday' | 'weekend';
  dayOfWeek: number;
  dayName: string;
  isWorkDay: boolean;
  currentPhase: DayPhase;
  phaseLabel: string;
  phaseIcon: string;
  phaseColor: string;
  phaseDescription: string;
  isBusinessHours: boolean;
  businessHoursStatus: 'before' | 'during' | 'after' | 'not-applicable';
  isQuietHours: boolean;
  suggestedFocus: SuggestedFocus;
  suggestedActivities: string[];
  minutesIntoPhase: number;
  minutesUntilPhaseChange: number;
  nextPhase: DayPhase | null;
  nextPhaseLabel: string;
  isTransitionTime: boolean;
  isGoodTimeForRoutine: boolean;
  isGoodTimeForDeepWork: boolean;
  // NEW: Transition support
  upcomingTransition: TransitionInfo | null;
  transitionWarnings: TransitionWarnings;
  suggestedTransitionRitual: TransitionRitual | null;
  environmentHints: EnvironmentHints;
}

export interface UserScheduleContext {
  wakeTime: string;
  sleepTime: string;
  workDays: number[];
  workStartTime: string;
  workEndTime: string;
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

// ============ TRANSITION RITUALS ============

const TRANSITION_RITUALS: Record<string, TransitionRitual> = {
  'early-morning-to-morning': {
    title: 'Wake-up routine wrap',
    description: 'Bridge from waking to morning activities',
    steps: [
      'Finish your morning beverage',
      'Review your top 3 priorities',
      'Set up your workspace',
    ],
    estimatedDuration: 5,
    category: 'preparation',
  },
  
  'morning-to-midday': {
    title: 'Morning wrap-up',
    description: 'Transition from focused work to midday break',
    steps: [
      'Save all open work',
      'Write down where you left off',
      'Stand and stretch',
      'Prepare lunch or snack',
    ],
    estimatedDuration: 5,
    category: 'wrap-up',
  },
  
  'midday-to-afternoon': {
    title: 'Afternoon reset',
    description: 'Return from break to afternoon work',
    steps: [
      'Clear desk of lunch items',
      'Review afternoon schedule',
      'Open afternoon tasks/projects',
      'Take 3 deep breaths',
    ],
    estimatedDuration: 3,
    category: 'preparation',
  },
  
  'afternoon-to-evening': {
    title: 'Work shutdown',
    description: 'Close out work day and transition to personal time',
    steps: [
      'Close all work apps and tabs',
      'Write tomorrow\'s first task',
      'Tidy workspace',
      'Change into comfortable clothes',
    ],
    estimatedDuration: 10,
    category: 'wrap-up',
  },
  
  'evening-to-night': {
    title: 'Evening wind-down',
    description: 'Begin transition toward bedtime',
    steps: [
      'Dim overhead lights',
      'Put devices on charging stations',
      'Set out tomorrow\'s essentials',
      'Start bedtime routine',
    ],
    estimatedDuration: 10,
    category: 'mindset',
  },
  
  'night-to-sleep-hours': {
    title: 'Sleep preparation',
    description: 'Final wind-down before bed',
    steps: [
      'All screens off',
      'Complete bedtime hygiene',
      'Set alarm for tomorrow',
      'Get into bed',
    ],
    estimatedDuration: 5,
    category: 'mindset',
  },
};

// ============ HELPER FUNCTIONS ============

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  
  if (startMinutes <= endMinutes) {
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  } else {
    return timeMinutes >= startMinutes || timeMinutes < endMinutes;
  }
}

export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export function getPhaseForTime(time: string, phases: PhaseDefinition[] = DEFAULT_PHASES): PhaseDefinition {
  for (const phase of phases) {
    if (isTimeInRange(time, phase.startTime, phase.endTime)) {
      return phase;
    }
  }
  return phases.find(p => p.name === 'sleep-hours') || phases[0];
}

export function getNextPhase(currentPhase: DayPhase, phases: PhaseDefinition[] = DEFAULT_PHASES): PhaseDefinition | null {
  const currentIndex = phases.findIndex(p => p.name === currentPhase);
  if (currentIndex === -1) return null;
  const nextIndex = (currentIndex + 1) % phases.length;
  return phases[nextIndex];
}

export function getMinutesUntilPhaseChange(currentTime: string, currentPhase: PhaseDefinition): number {
  const currentMinutes = timeToMinutes(currentTime);
  const endMinutes = timeToMinutes(currentPhase.endTime);
  
  if (endMinutes > currentMinutes) {
    return endMinutes - currentMinutes;
  } else {
    return (1440 - currentMinutes) + endMinutes;
  }
}

export function getMinutesIntoPhase(currentTime: string, currentPhase: PhaseDefinition): number {
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(currentPhase.startTime);
  
  if (currentMinutes >= startMinutes) {
    return currentMinutes - startMinutes;
  } else {
    return (1440 - startMinutes) + currentMinutes;
  }
}

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
  
  if (dayType === 'weekday' && !isWorkDay) {
    result = activitySet.weekend;
  }
  
  return result;
}

// ============ TRANSITION DETECTION FUNCTIONS ============

function detectUpcomingTransition(
  currentPhase: PhaseDefinition,
  currentTime: string
): TransitionInfo | null {
  const currentMinutes = timeToMinutes(currentTime);
  const phaseEndMinutes = timeToMinutes(currentPhase.endTime);
  
  let minutesUntilTransition = phaseEndMinutes - currentMinutes;
  if (minutesUntilTransition < 0) {
    minutesUntilTransition += 1440; // Next day
  }
  
  if (minutesUntilTransition > 20) return null;  // Not approaching
  
  // Find next phase
  const currentIndex = DEFAULT_PHASES.findIndex(p => p.name === currentPhase.name);
  const nextPhase = DEFAULT_PHASES[(currentIndex + 1) % DEFAULT_PHASES.length];
  
  return {
    fromPhase: currentPhase.name,
    toPhase: nextPhase.name,
    minutesUntil: minutesUntilTransition,
    isApproaching: minutesUntilTransition <= 20,
  };
}

function calculateTransitionWarnings(transition: TransitionInfo | null): TransitionWarnings {
  if (!transition) {
    return {
      at20Minutes: false,
      at10Minutes: false,
      at5Minutes: false,
      at1Minute: false,
    };
  }
  
  return {
    at20Minutes: transition.minutesUntil <= 20 && transition.minutesUntil > 10,
    at10Minutes: transition.minutesUntil <= 10 && transition.minutesUntil > 5,
    at5Minutes: transition.minutesUntil <= 5 && transition.minutesUntil > 1,
    at1Minute: transition.minutesUntil <= 1,
  };
}

function getTransitionRitual(
  fromPhase: DayPhase,
  toPhase: DayPhase
): TransitionRitual | null {
  const key = `${fromPhase}-to-${toPhase}`;
  return TRANSITION_RITUALS[key] || null;
}

function getEnvironmentHintsForPhase(
  currentPhase: PhaseDefinition,
  _transition: TransitionInfo | null
): EnvironmentHints {
  const hints: EnvironmentHints = {
    lighting: null,
    sound: null,
    space: null,
    timing: null,
  };
  
  // Lighting hints based on phase
  switch (currentPhase.name) {
    case 'early-morning':
      hints.lighting = 'Open blinds and turn on bright lights to help wake up';
      break;
    case 'morning':
      hints.lighting = 'Natural or bright light supports focus and alertness';
      break;
    case 'evening':
      hints.lighting = 'Consider dimming overhead lights - warm light helps wind down';
      break;
    case 'night':
      hints.lighting = 'Dim all lights - signals your body it\'s time to rest';
      break;
  }
  
  // Sound hints
  if (currentPhase.name === 'morning' || currentPhase.name === 'afternoon') {
    hints.sound = 'Focus music or ambient sound can help with concentration';
  } else if (currentPhase.name === 'evening' || currentPhase.name === 'night') {
    hints.sound = 'Quiet or nature sounds support relaxation';
  }
  
  // Timing hints for outdoor breaks
  if (currentPhase.name === 'midday' || currentPhase.name === 'afternoon') {
    hints.timing = 'Good time for a walk outside - daylight supports alertness';
  }
  
  return hints;
}

// ============ MAIN CONTEXT FUNCTION ============

export function getTemporalContext(userContext: UserScheduleContext): TemporalContext {
  const now = new Date();
  const currentTime = getCurrentTime();
  const dayOfWeek = now.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayType: 'weekday' | 'weekend' = isWeekend ? 'weekend' : 'weekday';
  const isWorkDay = userContext.workDays.includes(dayOfWeek);
  
  const currentPhaseObj = getPhaseForTime(currentTime);
  const nextPhaseObj = getNextPhase(currentPhaseObj.name);
  
  const { businessHours, quietHours } = userContext.timeZoneSettings;
  let isBusinessHours = false;
  let businessHoursStatus: 'before' | 'during' | 'after' | 'not-applicable' = 'not-applicable';
  
  if (businessHours.enabled) {
    const businessStart = timeToMinutes(businessHours.startTime);
    const businessEnd = timeToMinutes(businessHours.endTime);
    const currentMinutes = timeToMinutes(currentTime);
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
  
  const isQuietHours = quietHours.enabled && isTimeInRange(currentTime, quietHours.startTime, quietHours.endTime);
  
  let suggestedFocus = currentPhaseObj.defaultFocus;
  
  if (isWorkDay && isBusinessHours) {
    if (suggestedFocus === 'personal' || suggestedFocus === 'routine') {
      suggestedFocus = 'deep-work';
    }
  }
  
  if (isQuietHours) {
    suggestedFocus = 'wind-down';
  }
  
  const suggestedActivities = getSuggestedActivities(suggestedFocus, dayType, isWorkDay);
  const minutesIntoPhase = getMinutesIntoPhase(currentTime, currentPhaseObj);
  const minutesUntilPhaseChange = getMinutesUntilPhaseChange(currentTime, currentPhaseObj);
  const isTransitionTime = minutesUntilPhaseChange <= 15 || minutesIntoPhase <= 15;
  
  const isGoodTimeForRoutine = currentPhaseObj.name === 'early-morning' || 
                               currentPhaseObj.name === 'night' ||
                               (currentPhaseObj.name === 'evening' && minutesUntilPhaseChange <= 60);
  
  const isGoodTimeForDeepWork = (currentPhaseObj.name === 'morning' || currentPhaseObj.name === 'afternoon') &&
                                 !isQuietHours && 
                                 minutesUntilPhaseChange > 30;
  
  // NEW: Transition support calculations
  const upcomingTransition = detectUpcomingTransition(currentPhaseObj, currentTime);
  const transitionWarnings = calculateTransitionWarnings(upcomingTransition);
  const suggestedTransitionRitual = upcomingTransition 
    ? getTransitionRitual(upcomingTransition.fromPhase, upcomingTransition.toPhase)
    : null;
  const environmentHints = getEnvironmentHintsForPhase(currentPhaseObj, upcomingTransition);
  
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
    isGoodTimeForDeepWork,
    // NEW: Transition support
    upcomingTransition,
    transitionWarnings,
    suggestedTransitionRitual,
    environmentHints,
  };
}

// ============ STRUCTURE SCORING ============

export interface StructureScore {
  overall: number;
  morningStructure: number;
  workStructure: number;
  eveningStructure: number;
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

export function calculateStructureScore(
  timeBlocks: Array<{ startTime: string; endTime: string; type?: string }>,
  userContext: UserScheduleContext
): StructureScore {
  const wakeMinutes = timeToMinutes(userContext.wakeTime);
  const sleepMinutes = timeToMinutes(userContext.sleepTime);
  const availableMinutes = sleepMinutes > wakeMinutes 
    ? sleepMinutes - wakeMinutes 
    : (1440 - wakeMinutes) + sleepMinutes;
  
  const hasWakeRoutine = timeBlocks.some(b => {
    const start = timeToMinutes(b.startTime);
    return Math.abs(start - wakeMinutes) <= 60;
  });
  
  const hasEveningRoutine = timeBlocks.some(b => {
    const end = timeToMinutes(b.endTime);
    return Math.abs(end - sleepMinutes) <= 120;
  });
  
  const hasWorkBlocks = timeBlocks.some(b => {
    const start = timeToMinutes(b.startTime);
    const workStart = timeToMinutes(userContext.workStartTime);
    const workEnd = timeToMinutes(userContext.workEndTime);
    return start >= workStart && start < workEnd;
  });
  
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
  
  let totalBlockedMinutes = 0;
  for (const block of timeBlocks) {
    const start = timeToMinutes(block.startTime);
    const end = timeToMinutes(block.endTime);
    totalBlockedMinutes += end > start ? end - start : (1440 - start) + end;
  }
  
  const morningScore = (hasWakeRoutine ? 50 : 0) + (hasWorkBlocks ? 50 : 0);
  const workScore = hasWorkBlocks ? 100 : (totalBlockedMinutes > 120 ? 50 : 0);
  const eveningScore = (hasEveningRoutine ? 40 : 0) + (hasWindDown ? 40 : 0) + (hasMealBreaks ? 20 : 0);
  
  const coveragePercent = (totalBlockedMinutes / availableMinutes) * 100;
  let coverageScore = 0;
  if (coveragePercent >= 30 && coveragePercent <= 80) {
    coverageScore = 100 - Math.abs(55 - coveragePercent);
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
