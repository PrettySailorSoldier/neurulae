# Phase 3: Active Transition Support & Energy-Based Templates - Complete Implementation

## Context & Background

**App:** Neurulae - Productivity app for AuDHD individuals
**Phase:** 3 of 4 - Building on Phases 1 & 2
**Goal:** Make day phase transitions feel supported (not jarring) and provide flexible routine templates that adapt to daily energy levels

**What's Already Built:**
- Phase 1: Active Work Session (timer/tasks/timeline integration)
- Phase 2: Momentum Builder + Hyperfocus Breaker (computer lock-in solved)

**What's Still Missing:**
- Transitions between day phases feel abrupt
- Templates are one-size-fits-all (no energy adaptation)
- No ritual suggestions to bridge between phases
- All-or-nothing thinking ("I didn't do my full routine = failure")

---

## Research-Backed Problem Analysis

### The Transition Challenge for AuDHD

**Executive Dysfunction:**
- Shifting tasks requires cognitive energy AuDHD brains often lack
- Three dimensions: physical (location), mental (cognitive shift), emotional (feeling states)
- Three stages: leaving current task → moving between → entering new task
- Vulnerable to distraction during the "between" stage

**Research Evidence:**
- Visual cues outperform auditory for most neurodivergent individuals
- Countdown warnings at 20/10/5 minutes help brain prepare (Child Mind Institute)
- Buffer time formula: add 20% of estimated task time
- Transition rituals create bridges between activities

**All-or-Nothing Thinking:**
- Common ADHD pattern: "perfect or nothing"
- If routine isn't followed exactly → shame spiral
- Research shows three-tier approach prevents this
- Having "minimum viable routine" maintains consistency

---

## What You're Building

### System 1: Active Transition Support
**Purpose:** Detect and support phase transitions with countdowns, rituals, and environment cues

**How it works:**
1. Detect upcoming phase transition (morning → midday, work → evening)
2. Show countdown warnings at 20, 10, 5 minutes
3. Suggest transition ritual appropriate to phases
4. Provide environment change hints (lighting, sound)
5. Buffer time automatically added to next block

### System 2: Energy-Based Template System
**Purpose:** Three versions of each routine (ideal/likely/minimum) to prevent all-or-nothing thinking

**How it works:**
1. Morning check-in: "How's your energy today?"
2. User selects: High/Average/Low
3. App loads appropriate template version
4. All three versions are "success" - no shame
5. Patterns tracked to learn user's typical energy

### System 3: Circadian Environment Hints
**Purpose:** Suggest environment changes that support natural rhythms

**How it works:**
1. Morning: "Open blinds, blue-enriched light"
2. Afternoon: "Consider break outside, natural light"
3. Evening: "Dim screens, warm lighting"
4. Not controlling lights (beyond app scope)
5. Just gentle suggestions user can act on

---

## Implementation Part 1: Transition Support System

### Enhance Existing File: `src/lib/temporalContext.ts`

**Add Transition Detection:**

```typescript
// Add to existing TemporalContext interface
export interface TemporalContext {
  // ... existing fields ...
  
  // NEW: Transition support
  upcomingTransition: TransitionInfo | null;
  transitionWarnings: TransitionWarnings;
  suggestedTransitionRitual: TransitionRitual | null;
  environmentHints: EnvironmentHints;
}

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
```

**Transition Ritual Library:**

```typescript
// Add to temporalContext.ts

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
```

**Enhanced Context Calculation:**

```typescript
// Add to getTemporalContext function

export function getTemporalContext(userContext: UserScheduleContext): TemporalContext {
  // ... existing code ...
  
  // NEW: Detect upcoming transitions
  const upcomingTransition = detectUpcomingTransition(currentPhaseObj, now);
  
  // NEW: Calculate transition warnings
  const transitionWarnings = calculateWarnings(upcomingTransition);
  
  // NEW: Get suggested ritual
  const suggestedTransitionRitual = upcomingTransition 
    ? getTransitionRitual(upcomingTransition.fromPhase, upcomingTransition.toPhase)
    : null;
  
  // NEW: Get environment hints
  const environmentHints = getEnvironmentHints(currentPhaseObj, upcomingTransition);
  
  return {
    // ... existing fields ...
    upcomingTransition,
    transitionWarnings,
    suggestedTransitionRitual,
    environmentHints,
  };
}

function detectUpcomingTransition(
  currentPhase: PhaseDefinition,
  now: Date
): TransitionInfo | null {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
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

function calculateWarnings(transition: TransitionInfo | null): TransitionWarnings {
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

function getEnvironmentHints(
  currentPhase: PhaseDefinition,
  transition: TransitionInfo | null
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
```

---

### New Component: Transition Alert

**New File:** `src/components/structure/TransitionAlert.tsx`

**Purpose:** Show countdown and ritual suggestions for upcoming transitions

```typescript
import { useEffect, useState } from 'react';
import { useStructureAnalysis } from '@/hooks/useStructureAnalysis';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TransitionAlert() {
  const { context } = useStructureAnalysis();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  const { upcomingTransition, transitionWarnings, suggestedTransitionRitual } = context;
  
  // Reset dismissed state when transition changes
  useEffect(() => {
    setDismissed(false);
    setIsExpanded(false);
  }, [upcomingTransition?.fromPhase, upcomingTransition?.toPhase]);
  
  if (!upcomingTransition || dismissed) return null;
  
  // Determine urgency color
  const getUrgencyColor = () => {
    if (transitionWarnings.at1Minute) return 'border-red-500 bg-red-50 dark:bg-red-950';
    if (transitionWarnings.at5Minutes) return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
    if (transitionWarnings.at10Minutes) return 'border-amber-500 bg-amber-50 dark:bg-amber-950';
    return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
  };
  
  const getWarningIcon = () => {
    if (transitionWarnings.at5Minutes || transitionWarnings.at1Minute) {
      return <Clock className="h-4 w-4 animate-pulse" />;
    }
    return <Clock className="h-4 w-4" />;
  };
  
  const formatPhaseName = (phase: string) => {
    return phase.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  return (
    <Alert className={cn('mb-4', getUrgencyColor())}>
      <div className="flex items-start gap-3">
        {getWarningIcon()}
        <div className="flex-1">
          <AlertTitle className="mb-1">
            {formatPhaseName(upcomingTransition.toPhase)} approaching in {upcomingTransition.minutesUntil} min
          </AlertTitle>
          <AlertDescription className="text-sm">
            {transitionWarnings.at5Minutes 
              ? 'Time to start wrapping up'
              : 'Start thinking about transitioning soon'
            }
          </AlertDescription>
          
          {/* Ritual suggestion */}
          {suggestedTransitionRitual && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-auto p-0 text-xs"
              >
                {suggestedTransitionRitual.title}
                {isExpanded ? (
                  <ChevronUp className="ml-1 h-3 w-3" />
                ) : (
                  <ChevronDown className="ml-1 h-3 w-3" />
                )}
              </Button>
              
              {isExpanded && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {suggestedTransitionRitual.description}
                    {' '}({suggestedTransitionRitual.estimatedDuration} min)
                  </p>
                  <ol className="space-y-1 text-xs">
                    {suggestedTransitionRitual.steps.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>
    </Alert>
  );
}
```

---

### New Component: Environment Hints Widget

**New File:** `src/components/structure/EnvironmentHints.tsx`

```typescript
import { useStructureAnalysis } from '@/hooks/useStructureAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Volume2, MapPin, Clock } from 'lucide-react';

export function EnvironmentHints() {
  const { context } = useStructureAnalysis();
  const { environmentHints } = context;
  
  // Only show if at least one hint exists
  const hasHints = Object.values(environmentHints).some(hint => hint !== null);
  if (!hasHints) return null;
  
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Environment Hints
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {environmentHints.lighting && (
          <div className="flex gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs">{environmentHints.lighting}</p>
          </div>
        )}
        
        {environmentHints.sound && (
          <div className="flex gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs">{environmentHints.sound}</p>
          </div>
        )}
        
        {environmentHints.timing && (
          <div className="flex gap-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs">{environmentHints.timing}</p>
          </div>
        )}
        
        {environmentHints.space && (
          <div className="flex gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs">{environmentHints.space}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Implementation Part 2: Energy-Based Templates

### New Hook: `src/hooks/useEnergyTemplates.ts`

**Purpose:** Manage three-tier routine templates (ideal/likely/minimum)

**Interfaces:**

```typescript
export type EnergyLevel = 'high' | 'average' | 'low';

export interface EnergyTemplate {
  id: string;
  name: string;                    // "Morning Routine"
  scheduleType: 'weekday' | 'weekend' | 'everyday';
  
  // Three versions of the same routine
  versions: {
    high: TimeBlock[];             // Full routine
    average: TimeBlock[];          // Simplified (70% of full)
    low: TimeBlock[];              // Essentials only (40% of full)
  };
  
  category: 'morning' | 'work' | 'evening' | 'custom';
  createdAt: string;
  lastUsed?: string;
}

export interface EnergyCheckIn {
  date: string;                    // YYYY-MM-DD
  selectedLevel: EnergyLevel;
  timeOfDay: 'morning' | 'midday' | 'evening';
  appliedTemplate?: string;        // Template ID
}

export interface EnergyPatterns {
  averageLevel: EnergyLevel;       // Most common selection
  morningPattern: EnergyLevel;     // Typical morning energy
  weekdayPattern: EnergyLevel;
  weekendPattern: EnergyLevel;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}
```

**Hook Implementation:**

```typescript
import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format } from 'date-fns';

export function useEnergyTemplates() {
  const [templates, setTemplates] = useLocalStorage<EnergyTemplate[]>('neurulae-energy-templates', []);
  const [checkIns, setCheckIns] = useLocalStorage<EnergyCheckIn[]>('neurulae-energy-checkins', []);
  
  // Get today's check-in
  const todaysCheckIn = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return checkIns.find(c => c.date === today);
  }, [checkIns]);
  
  // Record energy level for today
  const recordEnergyLevel = useCallback((
    level: EnergyLevel,
    timeOfDay: 'morning' | 'midday' | 'evening',
    appliedTemplate?: string
  ) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    setCheckIns(prev => {
      // Remove any existing check-in for today at this time
      const filtered = prev.filter(c => 
        !(c.date === today && c.timeOfDay === timeOfDay)
      );
      
      return [...filtered, {
        date: today,
        selectedLevel: level,
        timeOfDay,
        appliedTemplate,
      }];
    });
  }, [setCheckIns]);
  
  // Get template blocks for selected energy level
  const getTemplateBlocks = useCallback((
    templateId: string,
    energyLevel: EnergyLevel
  ): TimeBlock[] => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return [];
    
    return template.versions[energyLevel] || [];
  }, [templates]);
  
  // Create new energy template
  const createEnergyTemplate = useCallback((
    name: string,
    scheduleType: 'weekday' | 'weekend' | 'everyday',
    category: EnergyTemplate['category'],
    fullBlocks: TimeBlock[]
  ) => {
    const newTemplate: EnergyTemplate = {
      id: crypto.randomUUID(),
      name,
      scheduleType,
      category,
      versions: {
        high: fullBlocks,
        average: simplifyBlocks(fullBlocks, 0.7),    // Keep 70%
        low: simplifyBlocks(fullBlocks, 0.4),        // Keep 40% (essentials)
      },
      createdAt: new Date().toISOString(),
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    return newTemplate;
  }, [setTemplates]);
  
  // Calculate energy patterns
  const energyPatterns = useMemo((): EnergyPatterns => {
    if (checkIns.length === 0) {
      return {
        averageLevel: 'average',
        morningPattern: 'average',
        weekdayPattern: 'average',
        weekendPattern: 'average',
        trend: 'stable',
        lastUpdated: new Date().toISOString(),
      };
    }
    
    // Calculate most common level
    const levelCounts = checkIns.reduce((acc, check) => {
      acc[check.selectedLevel] = (acc[check.selectedLevel] || 0) + 1;
      return acc;
    }, {} as Record<EnergyLevel, number>);
    
    const averageLevel = Object.entries(levelCounts)
      .sort(([, a], [, b]) => b - a)[0][0] as EnergyLevel;
    
    // Morning pattern (last 7 mornings)
    const recentMornings = checkIns
      .filter(c => c.timeOfDay === 'morning')
      .slice(-7);
    const morningPattern = calculateAverageLevel(recentMornings);
    
    // Weekday vs weekend patterns
    const weekdayChecks = checkIns.filter(c => {
      const date = new Date(c.date);
      const day = date.getDay();
      return day >= 1 && day <= 5;
    });
    const weekendChecks = checkIns.filter(c => {
      const date = new Date(c.date);
      const day = date.getDay();
      return day === 0 || day === 6;
    });
    
    const weekdayPattern = calculateAverageLevel(weekdayChecks);
    const weekendPattern = calculateAverageLevel(weekendChecks);
    
    // Trend calculation (last 7 days vs previous 7 days)
    const lastWeek = checkIns.slice(-7);
    const prevWeek = checkIns.slice(-14, -7);
    const trend = calculateTrend(lastWeek, prevWeek);
    
    return {
      averageLevel,
      morningPattern,
      weekdayPattern,
      weekendPattern,
      trend,
      lastUpdated: new Date().toISOString(),
    };
  }, [checkIns]);
  
  return {
    templates,
    checkIns,
    todaysCheckIn,
    energyPatterns,
    recordEnergyLevel,
    getTemplateBlocks,
    createEnergyTemplate,
  };
}

// Helper: Simplify blocks by keeping most important ones
function simplifyBlocks(blocks: TimeBlock[], percentage: number): TimeBlock[] {
  // Sort by priority (morning routines first, essential categories)
  const scored = blocks.map(block => ({
    block,
    priority: calculateBlockPriority(block),
  }));
  
  scored.sort((a, b) => b.priority - a.priority);
  
  const keepCount = Math.ceil(blocks.length * percentage);
  return scored.slice(0, keepCount).map(s => s.block);
}

function calculateBlockPriority(block: TimeBlock): number {
  let priority = 0;
  
  // Morning blocks are high priority
  const hour = parseInt(block.startTime.split(':')[0]);
  if (hour >= 5 && hour <= 9) priority += 10;
  
  // Certain types are essential
  if (block.type === 'main' || block.title?.toLowerCase().includes('essential')) {
    priority += 15;
  }
  
  // Meal times are important
  if (block.title?.toLowerCase().includes('meal') || 
      block.title?.toLowerCase().includes('breakfast') ||
      block.title?.toLowerCase().includes('lunch')) {
    priority += 8;
  }
  
  // Hygiene/health routines essential
  if (block.title?.toLowerCase().includes('hygiene') ||
      block.title?.toLowerCase().includes('medication')) {
    priority += 20;
  }
  
  return priority;
}

function calculateAverageLevel(checks: EnergyCheckIn[]): EnergyLevel {
  if (checks.length === 0) return 'average';
  
  const levelValues = { low: 1, average: 2, high: 3 };
  const sum = checks.reduce((acc, c) => acc + levelValues[c.selectedLevel], 0);
  const avg = sum / checks.length;
  
  if (avg <= 1.4) return 'low';
  if (avg >= 2.6) return 'high';
  return 'average';
}

function calculateTrend(
  recent: EnergyCheckIn[],
  previous: EnergyCheckIn[]
): 'improving' | 'stable' | 'declining' {
  if (recent.length === 0 || previous.length === 0) return 'stable';
  
  const levelValues = { low: 1, average: 2, high: 3 };
  
  const recentAvg = recent.reduce((acc, c) => 
    acc + levelValues[c.selectedLevel], 0) / recent.length;
  const prevAvg = previous.reduce((acc, c) => 
    acc + levelValues[c.selectedLevel], 0) / previous.length;
  
  const diff = recentAvg - prevAvg;
  
  if (diff > 0.3) return 'improving';
  if (diff < -0.3) return 'declining';
  return 'stable';
}
```

---

### New Component: Morning Energy Check-In

**New File:** `src/components/energy/MorningEnergyCheckIn.tsx`

```typescript
import { useState } from 'react';
import { useEnergyTemplates } from '@/hooks/useEnergyTemplates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Battery, BatteryMedium, BatteryLow } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onEnergySelected: (level: EnergyLevel, blocks: TimeBlock[]) => void;
  templateId: string;  // Which template to apply
}

export function MorningEnergyCheckIn({ open, onClose, onEnergySelected, templateId }: Props) {
  const { recordEnergyLevel, getTemplateBlocks, energyPatterns } = useEnergyTemplates();
  const [hoveredLevel, setHoveredLevel] = useState<EnergyLevel | null>(null);
  
  const handleSelectEnergy = (level: EnergyLevel) => {
    // Record the check-in
    recordEnergyLevel(level, 'morning', templateId);
    
    // Get appropriate template blocks
    const blocks = getTemplateBlocks(templateId, level);
    
    // Apply them
    onEnergySelected(level, blocks);
    
    // Show confirmation
    const messages = {
      high: "Great! Loading your full routine",
      average: "Got it. Loading your standard routine",
      low: "That's okay. Loading just the essentials",
    };
    
    toast({
      title: messages[level],
      description: "All three versions are success - no judgment here",
    });
    
    onClose();
  };
  
  const getDescription = (level: EnergyLevel) => {
    if (hoveredLevel === level) {
      const descriptions = {
        high: "Full routine with all blocks - you're ready for it all",
        average: "Simplified routine - covers the key things without overwhelm",
        low: "Just the essentials - medication, hygiene, breakfast",
      };
      return descriptions[level];
    }
    return '';
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How's your energy this morning?</DialogTitle>
          <DialogDescription>
            This helps us suggest the right routine for today. All versions are success!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-start hover:bg-green-50 dark:hover:bg-green-950"
            onClick={() => handleSelectEnergy('high')}
            onMouseEnter={() => setHoveredLevel('high')}
            onMouseLeave={() => setHoveredLevel(null)}
          >
            <div className="flex items-center gap-2 mb-1">
              <Battery className="h-5 w-5 text-green-600" />
              <span className="font-semibold">High Energy</span>
            </div>
            <p className="text-xs text-left text-muted-foreground">
              {getDescription('high') || "Feeling alert and ready for the full routine"}
            </p>
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-start hover:bg-blue-50 dark:hover:bg-blue-950"
            onClick={() => handleSelectEnergy('average')}
            onMouseEnter={() => setHoveredLevel('average')}
            onMouseLeave={() => setHoveredLevel(null)}
          >
            <div className="flex items-center gap-2 mb-1">
              <BatteryMedium className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Average Energy</span>
            </div>
            <p className="text-xs text-left text-muted-foreground">
              {getDescription('average') || "Standard day - need the simplified version"}
            </p>
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-start hover:bg-amber-50 dark:hover:bg-amber-950"
            onClick={() => handleSelectEnergy('low')}
            onMouseEnter={() => setHoveredLevel('low')}
            onMouseLeave={() => setHoveredLevel(null)}
          >
            <div className="flex items-center gap-2 mb-1">
              <BatteryLow className="h-5 w-5 text-amber-600" />
              <span className="font-semibold">Low Energy</span>
            </div>
            <p className="text-xs text-left text-muted-foreground">
              {getDescription('low') || "Struggling today - just the essentials"}
            </p>
          </Button>
        </div>
        
        {/* Show pattern insights */}
        <div className="text-xs text-muted-foreground text-center border-t pt-3">
          <p>
            Your typical morning energy: <strong>{energyPatterns.morningPattern}</strong>
          </p>
          <p className="mt-1">
            Trend: {energyPatterns.trend === 'improving' ? '📈 Improving' : 
                   energyPatterns.trend === 'declining' ? '📉 Declining' : 
                   '➡️ Stable'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### New Component: Energy Pattern Insights

**New File:** `src/components/energy/EnergyPatternInsights.tsx`

```typescript
import { useEnergyTemplates } from '@/hooks/useEnergyTemplates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Battery } from 'lucide-react';

export function EnergyPatternInsights() {
  const { energyPatterns, checkIns } = useEnergyTemplates();
  
  if (checkIns.length < 3) {
    return (
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Energy Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Track your energy for a few days to see patterns
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const TrendIcon = {
    improving: TrendingUp,
    stable: Minus,
    declining: TrendingDown,
  }[energyPatterns.trend];
  
  const trendColor = {
    improving: 'text-green-600',
    stable: 'text-blue-600',
    declining: 'text-amber-600',
  }[energyPatterns.trend];
  
  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Battery className="h-4 w-4" />
          Your Energy Patterns
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Most common level</p>
          <p className="text-sm font-medium capitalize">{energyPatterns.averageLevel}</p>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground">Typical morning energy</p>
          <p className="text-sm font-medium capitalize">{energyPatterns.morningPattern}</p>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t">
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
          <span className="text-xs">
            Energy trend: <strong className="capitalize">{energyPatterns.trend}</strong>
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>Weekdays: {energyPatterns.weekdayPattern}</p>
          <p>Weekends: {energyPatterns.weekendPattern}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Integration & Testing

### Add to Dashboard

```typescript
import { TransitionAlert } from '@/components/structure/TransitionAlert';
import { EnvironmentHints } from '@/components/structure/EnvironmentHints';
import { MorningEnergyCheckIn } from '@/components/energy/MorningEnergyCheckIn';
import { EnergyPatternInsights } from '@/components/energy/EnergyPatternInsights';

// In dashboard render:
<TransitionAlert />
<EnvironmentHints />
<MorningEnergyCheckIn 
  open={showEnergyCheckIn}
  onClose={() => setShowEnergyCheckIn(false)}
  onEnergySelected={handleApplyEnergyTemplate}
  templateId="morning-routine"
/>
<EnergyPatternInsights />
```

### Settings Integration

Add settings for:
- Enable/disable transition alerts
- Transition warning timing (20/15/10 min)
- Show environment hints
- Auto-suggest energy check-in at morning
- Track energy patterns

---

## Testing Scenarios

### Scenario 1: Transition Support
1. Work during morning phase
2. **At 20 min before midday:**
   - Alert appears: "Midday approaching in 20 min"
   - Shows transition ritual suggestion
3. **At 5 min:**
   - Alert becomes more urgent (orange)
   - Reminder to wrap up
4. **At transition:**
   - Phase changes
   - Environment hints update

### Scenario 2: Energy Check-In
1. Open app in morning
2. Prompted: "How's your energy?"
3. Select "Low Energy"
4. **Expected:**
   - Only essential blocks load
   - No shame messaging
   - Confirmation: "Just the essentials"
   - Pattern tracked

### Scenario 3: Pattern Learning
1. Use energy check-in for 7 days
2. Check Energy Pattern Insights
3. **Expected:**
   - Shows most common level
   - Shows weekday vs weekend patterns
   - Shows trend (improving/stable/declining)
   - Helpful for self-awareness

---

## Success Criteria

✅ Transition alerts appear at 20/10/5 min before phase changes
✅ Ritual suggestions relevant to transition type
✅ Environment hints appropriate to current phase
✅ Energy check-in appears in morning (optional)
✅ Three template versions created from one full routine
✅ Low energy version truly minimal (essentials only)
✅ Patterns tracked and displayed
✅ No shame language anywhere
✅ All features work across light/dark themes
✅ Transitions feel supported, not jarring

This phase makes day structure feel natural and flexible rather than rigid and overwhelming!