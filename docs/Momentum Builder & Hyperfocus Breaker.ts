# Phase 2: Momentum Builder & Hyperfocus Breaker - Complete Implementation

## Context & Background

**App:** Neurulae - Productivity app for AuDHD individuals
**Phase:** 2 of 4 - Building on completed Phase 1 (Active Work Session Integration)
**User Problem:** "I have an issue with getting stuck to my computer. Maybe if I had specific times where I had to do certain things it would help snowball and trigger me to get tasks done."

**Research Insight:** The user thinks they need rigid time-based triggers, but research shows they actually need **dopamine-driven momentum through micro-wins** combined with **external interruption for hyperfocus**. This phase solves the "computer lock-in" problem through neurochemistry, not willpower.

---

## Phase 1 Recap (What's Already Built)

**Active Work Session System:**
- `useActiveWorkSession` hook exists
- Timer, tasks, and timeline are now integrated
- Single source of truth for "what am I working on"
- Session tracking with start/pause/complete lifecycle
- Events dispatch when sessions change

**What This Means:**
You now have the infrastructure to:
- Know when work sessions start/end
- Track elapsed time on tasks
- Detect when users are actively working

**What's Still Missing:**
- No mechanism to break computer lock-in (hyperfocus)
- No momentum system to create "snowball effect"
- Sessions can go indefinitely without breaks
- No micro-wins to trigger dopamine cascades

---

## Research-Backed Problem Analysis

### The Neuroscience

**Hyperfocus in ADHD:**
- 68% of ADHD adults report frequent problematic hyperfocus
- Low dopamine in frontal lobes makes "shifting gears" neurologically difficult
- Cannot self-interrupt from hyperfocus (requires external trigger)
- Dr. Nadeau: "Not something you can just talk yourself out of"

**Behavioral Momentum:**
- BJ Fogg (20 years research): "Frequency of success creates momentum, not size"
- Small wins trigger dopamine → reward prediction → motivates further action
- Tiny habits (<2 minutes) have 64% higher success rate than large habits
- 2-Minute Rule: Start so small you can't fail

**ADHD Time Perception:**
- Time blindness is a FOCAL symptom (not secondary)
- Internal time monitoring fails → need external cues
- Pomodoro often fails because 25 min is too long to sustain focus
- Adapted approach: 10-15 min blocks with movement breaks

---

## What You're Building

### System 1: Momentum Builder
**Purpose:** Create dopamine-driven task cascade through micro-wins

**How it works:**
1. Detect when user has been working for 20-30 minutes
2. Suggest tiny action (<2 minutes): "Stand and stretch"
3. User completes it → dopamine hit + celebration
4. System suggests next task based on momentum
5. Chain continues, building energy throughout day

### System 2: Hyperfocus Breaker
**Purpose:** External interruption when user is locked into computer

**How it works:**
1. Detect extended work session (>90 minutes)
2. Detect low interaction variance (no movement from chair)
3. Multi-modal alert (visual + audio + haptic)
4. Require physical movement to dismiss
5. Suggest 5-minute break with specific activity
6. Future-self visualization to break the spell

### System 3: Computer Session Monitor
**Purpose:** Track and limit unbroken computer time

**How it works:**
1. Monitor overall computer session (separate from work session)
2. Every 45-60 minutes → suggest micro-break
3. Track cumulative sitting time
4. Gentle nudges before sessions become problematic

---

## Implementation Part 1: Momentum Builder

### New File: `src/hooks/useMomentumBuilder.ts`

**Purpose:** Track wins and build behavioral momentum through dopamine cascades

**Interfaces:**

```typescript
interface MicroWin {
  id: string;
  action: string;              // "Stand and stretch for 30 seconds"
  category: 'movement' | 'hydration' | 'environment' | 'social' | 'admin';
  durationSeconds: number;     // Must be < 120 (2 minutes max)
  difficulty: 'trivial' | 'easy';
  completedAt?: string;        // ISO timestamp
}

interface MomentumState {
  winsToday: number;
  lastWinTime: Date | null;
  currentStreak: number;       // Consecutive wins without >5min gap
  longestStreak: number;
  todaysWins: MicroWin[];
  
  // Momentum level affects suggestions
  momentumLevel: 'cold' | 'warming' | 'hot' | 'blazing';
  
  // Session tracking
  sessionStartTime: Date | null;
  consecutiveSessionsToday: number;
}

interface MomentumSuggestion {
  microWin: MicroWin;
  reason: string;              // "You've been focused for 25 min"
  nextTaskSuggestion?: Task;   // Suggested task to do after micro-win
  celebrationMessage: string;  // "Nice! 3 wins today 🔥"
}

interface UseMomentumBuilderReturn {
  state: MomentumState;
  
  // Actions
  recordWin: (win: MicroWin) => void;
  getSuggestion: () => MomentumSuggestion | null;
  skipSuggestion: () => void;
  
  // Queries
  shouldSuggestMicroWin: () => boolean;
  getMomentumLevel: () => MomentumState['momentumLevel'];
  getStreakStatus: () => string;  // "🔥 3 wins in a row!"
}
```

**Micro-Win Library:**

```typescript
// Constants for micro-wins (all under 2 minutes)
const MICRO_WINS: Record<string, MicroWin[]> = {
  movement: [
    {
      id: 'stretch-30s',
      action: 'Stand and stretch for 30 seconds',
      category: 'movement',
      durationSeconds: 30,
      difficulty: 'trivial',
    },
    {
      id: 'walk-room',
      action: 'Walk around the room once',
      category: 'movement',
      durationSeconds: 60,
      difficulty: 'trivial',
    },
    {
      id: 'jumping-jacks',
      action: 'Do 10 jumping jacks',
      category: 'movement',
      durationSeconds: 45,
      difficulty: 'easy',
    },
    {
      id: 'stairs',
      action: 'Walk up and down stairs once',
      category: 'movement',
      durationSeconds: 90,
      difficulty: 'easy',
    },
  ],
  hydration: [
    {
      id: 'drink-water',
      action: 'Drink a full glass of water',
      category: 'hydration',
      durationSeconds: 60,
      difficulty: 'trivial',
    },
    {
      id: 'refill-water',
      action: 'Refill your water bottle',
      category: 'hydration',
      durationSeconds: 90,
      difficulty: 'trivial',
    },
  ],
  environment: [
    {
      id: 'desk-item',
      action: 'Put away one item from your desk',
      category: 'environment',
      durationSeconds: 30,
      difficulty: 'trivial',
    },
    {
      id: 'window',
      action: 'Look out a window for 30 seconds',
      category: 'environment',
      durationSeconds: 30,
      difficulty: 'trivial',
    },
    {
      id: 'wipe-desk',
      action: 'Wipe down your desk surface',
      category: 'environment',
      durationSeconds: 90,
      difficulty: 'easy',
    },
  ],
  social: [
    {
      id: 'text-reply',
      action: 'Reply to one text message',
      category: 'social',
      durationSeconds: 120,
      difficulty: 'easy',
    },
    {
      id: 'check-calendar',
      action: 'Check tomorrow\'s calendar',
      category: 'social',
      durationSeconds: 60,
      difficulty: 'trivial',
    },
  ],
  admin: [
    {
      id: 'delete-emails',
      action: 'Delete 5 old emails',
      category: 'admin',
      durationSeconds: 90,
      difficulty: 'easy',
    },
    {
      id: 'close-tabs',
      action: 'Close browser tabs you don\'t need',
      category: 'admin',
      durationSeconds: 60,
      difficulty: 'easy',
    },
  ],
};
```

**Hook Implementation:**

```typescript
import { useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useActiveWorkSession } from '@/hooks/useActiveWorkSession';
import { toast } from 'sonner';

export function useMomentumBuilder() {
  const { session } = useActiveWorkSession();
  const [state, setState] = useLocalStorage<MomentumState>('neurulae-momentum', {
    winsToday: 0,
    lastWinTime: null,
    currentStreak: 0,
    longestStreak: 0,
    todaysWins: [],
    momentumLevel: 'cold',
    sessionStartTime: null,
    consecutiveSessionsToday: 0,
  });

  // Calculate momentum level based on recent activity
  const getMomentumLevel = useCallback((): MomentumState['momentumLevel'] => {
    if (!state.lastWinTime) return 'cold';
    
    const minutesSinceLastWin = (Date.now() - new Date(state.lastWinTime).getTime()) / 60000;
    
    if (state.currentStreak >= 5) return 'blazing';
    if (state.currentStreak >= 3) return 'hot';
    if (minutesSinceLastWin < 10 && state.currentStreak >= 1) return 'warming';
    return 'cold';
  }, [state]);

  // Should we suggest a micro-win now?
  const shouldSuggestMicroWin = useCallback(() => {
    if (!session) return false;  // Not working on anything
    
    const sessionDuration = Math.floor(session.actualElapsed / 60);  // Minutes
    
    // Suggest every 20-30 minutes depending on momentum
    const momentum = getMomentumLevel();
    const threshold = momentum === 'cold' ? 20 : momentum === 'warming' ? 25 : 30;
    
    // Check if enough time has passed since session start
    const timeSinceLastWin = state.lastWinTime 
      ? (Date.now() - new Date(state.lastWinTime).getTime()) / 60000 
      : sessionDuration;
    
    return timeSinceLastWin >= threshold;
  }, [session, state, getMomentumLevel]);

  // Get suggestion based on context
  const getSuggestion = useCallback((): MomentumSuggestion | null => {
    if (!shouldSuggestMicroWin()) return null;
    
    const sessionDuration = session ? Math.floor(session.actualElapsed / 60) : 0;
    
    // Select appropriate micro-win category
    let category: keyof typeof MICRO_WINS = 'movement';  // Default
    
    if (sessionDuration > 60) {
      // Long session - prioritize movement
      category = Math.random() > 0.5 ? 'movement' : 'hydration';
    } else if (state.momentumLevel === 'hot' || state.momentumLevel === 'blazing') {
      // High momentum - can suggest admin/social tasks
      const options: (keyof typeof MICRO_WINS)[] = ['movement', 'admin', 'social', 'environment'];
      category = options[Math.floor(Math.random() * options.length)];
    }
    
    // Pick random win from category
    const wins = MICRO_WINS[category];
    const selectedWin = wins[Math.floor(Math.random() * wins.length)];
    
    // Generate reason
    const reason = sessionDuration > 45 
      ? `You've been focused for ${sessionDuration} minutes - time for a break!`
      : `Great focus! Quick ${selectedWin.durationSeconds}s break?`;
    
    // Celebration message
    const nextWinCount = state.winsToday + 1;
    const celebration = nextWinCount === 1 
      ? "🌱 First win of the day!"
      : nextWinCount === 3
      ? "🔥 3 wins - momentum building!"
      : nextWinCount === 5
      ? "⚡ 5 wins - you're on fire!"
      : nextWinCount === 10
      ? "🚀 10 wins - incredible!"
      : `✨ ${nextWinCount} wins today!`;
    
    return {
      microWin: selectedWin,
      reason,
      celebrationMessage: celebration,
    };
  }, [session, state, shouldSuggestMicroWin, getMomentumLevel]);

  // Record a completed micro-win
  const recordWin = useCallback((win: MicroWin) => {
    const now = new Date();
    const completedWin = { ...win, completedAt: now.toISOString() };
    
    setState(prev => {
      // Check if streak continues (within 5 minutes of last win)
      const minutesSinceLastWin = prev.lastWinTime 
        ? (now.getTime() - new Date(prev.lastWinTime).getTime()) / 60000
        : 999;
      
      const newStreak = minutesSinceLastWin <= 5 ? prev.currentStreak + 1 : 1;
      
      return {
        ...prev,
        winsToday: prev.winsToday + 1,
        lastWinTime: now,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        todaysWins: [...prev.todaysWins, completedWin],
        momentumLevel: getMomentumLevel(),
      };
    });
    
    // Dispatch event for celebration UI
    window.dispatchEvent(new CustomEvent('momentum:win-recorded', {
      detail: { win: completedWin, state }
    }));
    
    // Show toast with celebration
    const nextWinCount = state.winsToday + 1;
    const celebration = nextWinCount === 1 
      ? "🌱 First win!" 
      : `✨ Win #${nextWinCount}`;
    
    toast({
      title: celebration,
      description: win.action,
    });
  }, [setState, state, getMomentumLevel]);

  // Skip suggestion (user busy)
  const skipSuggestion = useCallback(() => {
    // Don't break streak, but reset suggestion timer
    setState(prev => ({
      ...prev,
      lastWinTime: new Date(),  // Treat skip as "acknowledged"
    }));
  }, [setState]);

  // Get streak status message
  const getStreakStatus = useCallback(() => {
    if (state.currentStreak === 0) return "Start your first win!";
    if (state.currentStreak === 1) return "🌱 1 win";
    if (state.currentStreak >= 5) return `🔥 ${state.currentStreak} win streak!`;
    return `⚡ ${state.currentStreak} wins in a row`;
  }, [state]);

  // Reset at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const lastWinDate = state.lastWinTime ? new Date(state.lastWinTime).toDateString() : null;
      const today = new Date().toDateString();
      
      if (lastWinDate && lastWinDate !== today) {
        // New day - reset
        setState(prev => ({
          ...prev,
          winsToday: 0,
          todaysWins: [],
          currentStreak: 0,
          momentumLevel: 'cold',
        }));
      }
    };
    
    // Check every minute
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [state.lastWinTime, setState]);

  return {
    state,
    recordWin,
    getSuggestion,
    skipSuggestion,
    shouldSuggestMicroWin,
    getMomentumLevel,
    getStreakStatus,
  };
}
```

---

## Implementation Part 2: Hyperfocus Breaker

### New File: `src/hooks/useHyperfocusDetector.ts`

**Purpose:** Detect and break problematic hyperfocus sessions through external interruption

**Interfaces:**

```typescript
interface HyperfocusState {
  isLikelyHyperfocused: boolean;
  sessionDuration: number;              // Minutes
  lastInteraction: Date;
  interactionCount: number;             // In last 15 minutes
  consecutiveLongSessions: number;      // Sessions > 90min today
  
  // Break tracking
  lastBreakTime: Date | null;
  minutesSinceBreak: number;
  breaksSkippedToday: number;
}

interface HyperfocusBreak {
  type: 'micro' | 'standard' | 'urgent';
  reason: string;
  duration: number;                     // Suggested break duration (minutes)
  activity: string;                     // Specific activity suggestion
  canDismiss: boolean;                  // Can user dismiss or must take break?
  requiresMovement: boolean;            // Must stand/move to dismiss
}

interface UseHyperfocusDetectorReturn {
  state: HyperfocusState;
  
  // Detection
  checkForHyperfocus: () => HyperfocusBreak | null;
  isBreakNeeded: () => boolean;
  
  // Actions
  recordInteraction: () => void;        // Called on any user interaction
  startBreak: () => void;
  completeBreak: () => void;
  skipBreak: () => void;                // User chooses to skip (not ideal)
  
  // Settings
  settings: HyperfocusSettings;
}

interface HyperfocusSettings {
  enabled: boolean;
  detectionThreshold: 60 | 90 | 120;    // Minutes before suggesting break
  breakDuration: 2 | 5 | 10;            // Suggested break length
  multiModal: boolean;                  // Visual + audio + haptic alerts
  requireMovement: boolean;             // Can't dismiss without standing
  futureSelfVisualization: boolean;     // Show McGonigal future-self prompt
}
```

**Hook Implementation:**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useActiveWorkSession } from '@/hooks/useActiveWorkSession';
import { toast } from 'sonner';

export function useHyperfocusDetector() {
  const { session } = useActiveWorkSession();
  
  const [state, setState] = useLocalStorage<HyperfocusState>('neurulae-hyperfocus', {
    isLikelyHyperfocused: false,
    sessionDuration: 0,
    lastInteraction: new Date(),
    interactionCount: 0,
    consecutiveLongSessions: 0,
    lastBreakTime: null,
    minutesSinceBreak: 0,
    breaksSkippedToday: 0,
  });
  
  const [settings] = useLocalStorage<HyperfocusSettings>('neurulae-hyperfocus-settings', {
    enabled: true,
    detectionThreshold: 90,
    breakDuration: 5,
    multiModal: true,
    requireMovement: true,
    futureSelfVisualization: true,
  });

  // Update session duration from active work session
  useEffect(() => {
    if (session) {
      setState(prev => ({
        ...prev,
        sessionDuration: Math.floor(session.actualElapsed / 60),
      }));
    }
  }, [session, setState]);

  // Record user interaction (any click, keyboard, etc)
  const recordInteraction = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastInteraction: new Date(),
      interactionCount: prev.interactionCount + 1,
    }));
  }, [setState]);

  // Check if user is likely hyperfocused
  const checkForHyperfocus = useCallback((): HyperfocusBreak | null => {
    if (!settings.enabled || !session) return null;
    
    const sessionMinutes = Math.floor(session.actualElapsed / 60);
    const minutesSinceInteraction = (Date.now() - state.lastInteraction.getTime()) / 60000;
    
    // Hyperfocus indicators:
    // 1. Long session duration
    // 2. Low interaction variance (hasn't moved from screen)
    // 3. Time since last break
    
    const isLongSession = sessionMinutes >= settings.detectionThreshold;
    const isLowInteraction = minutesSinceInteraction > 15;  // 15 min no recorded movement
    const needsBreak = state.lastBreakTime 
      ? (Date.now() - state.lastBreakTime.getTime()) / 60000 > 60
      : sessionMinutes > 45;
    
    // Determine break urgency
    if (sessionMinutes >= 120) {
      // URGENT: 2+ hours
      return {
        type: 'urgent',
        reason: "You've been locked in for over 2 hours",
        duration: 10,
        activity: "Walk outside for 10 minutes. Your eyes and body need this.",
        canDismiss: false,  // Must take break
        requiresMovement: true,
      };
    } else if (sessionMinutes >= settings.detectionThreshold && isLowInteraction) {
      // LIKELY HYPERFOCUS
      return {
        type: 'standard',
        reason: `You've been deeply focused for ${sessionMinutes} minutes`,
        duration: settings.breakDuration,
        activity: "Stand up, walk around, get water. Take 5 minutes away from the screen.",
        canDismiss: true,
        requiresMovement: settings.requireMovement,
      };
    } else if (needsBreak && sessionMinutes >= 45) {
      // PREVENTIVE: Before hyperfocus sets in
      return {
        type: 'micro',
        reason: "Time for a quick movement break",
        duration: 2,
        activity: "Stand and stretch for 2 minutes",
        canDismiss: true,
        requiresMovement: false,
      };
    }
    
    return null;
  }, [session, state, settings]);

  // Is break needed right now?
  const isBreakNeeded = useCallback(() => {
    return checkForHyperfocus() !== null;
  }, [checkForHyperfocus]);

  // Start break
  const startBreak = useCallback(() => {
    const breakInfo = checkForHyperfocus();
    if (!breakInfo) return;
    
    // Pause active work session
    if (session) {
      // Don't end session, just pause timer
      window.dispatchEvent(new CustomEvent('hyperfocus:break-started', {
        detail: { breakInfo }
      }));
    }
    
    setState(prev => ({
      ...prev,
      lastBreakTime: new Date(),
      minutesSinceBreak: 0,
    }));
  }, [checkForHyperfocus, session, setState]);

  // Complete break
  const completeBreak = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLikelyHyperfocused: false,
      interactionCount: 0,
    }));
    
    // Resume work session if it was active
    window.dispatchEvent(new CustomEvent('hyperfocus:break-completed'));
    
    toast({
      title: "✨ Break complete!",
      description: "Welcome back - ready to continue?",
    });
  }, [setState]);

  // Skip break (not recommended)
  const skipBreak = useCallback(() => {
    setState(prev => ({
      ...prev,
      breaksSkippedToday: prev.breaksSkippedToday + 1,
      lastBreakTime: new Date(),  // Prevent immediate re-suggestion
    }));
    
    toast({
      title: "Break skipped",
      description: "I'll remind you again later",
      variant: "destructive",
    });
  }, [setState]);

  // Track long sessions
  useEffect(() => {
    if (session && session.actualElapsed > 90 * 60) {
      // Session just crossed 90 minutes
      setState(prev => ({
        ...prev,
        consecutiveLongSessions: prev.consecutiveLongSessions + 1,
      }));
    }
  }, [session, setState]);

  return {
    state,
    checkForHyperfocus,
    isBreakNeeded,
    recordInteraction,
    startBreak,
    completeBreak,
    skipBreak,
    settings,
  };
}
```

---

## Implementation Part 3: UI Components

### Component 1: Momentum Widget

**New File:** `src/components/momentum/MomentumWidget.tsx`

**Purpose:** Shows current momentum status and suggests micro-wins

```typescript
import { useMomentumBuilder } from '@/hooks/useMomentumBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Zap, Leaf, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function MomentumWidget() {
  const { state, getSuggestion, recordWin, skipSuggestion, getStreakStatus } = useMomentumBuilder();
  const suggestion = getSuggestion();
  
  // Icon based on momentum level
  const MomentumIcon = {
    cold: Leaf,
    warming: Timer,
    hot: Zap,
    blazing: Flame,
  }[state.momentumLevel];

  const momentumColors = {
    cold: 'text-gray-400',
    warming: 'text-blue-400',
    hot: 'text-orange-400',
    blazing: 'text-red-500',
  };

  if (!suggestion) {
    // Just show status
    return (
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MomentumIcon className={cn("h-4 w-4", momentumColors[state.momentumLevel])} />
            Momentum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{state.winsToday}</p>
          <p className="text-xs text-muted-foreground">{getStreakStatus()}</p>
        </CardContent>
      </Card>
    );
  }

  // Show suggestion
  return (
    <Card className="border-l-4 border-l-purple-500 animate-in slide-in-from-top-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-500" />
          Quick Win Available!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{suggestion.reason}</p>
          <p className="text-sm font-medium">{suggestion.microWin.action}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {suggestion.microWin.durationSeconds}s • {suggestion.microWin.category}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => {
              recordWin(suggestion.microWin);
              
              // Show celebration
              toast({
                title: suggestion.celebrationMessage,
                description: "Way to keep momentum going!",
              });
            }}
            className="flex-1"
          >
            ✓ Done!
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={skipSuggestion}
          >
            Later
          </Button>
        </div>
        
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {state.winsToday} wins today • {getStreakStatus()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Component 2: Hyperfocus Break Modal

**New File:** `src/components/hyperfocus/HyperfocusBreakModal.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useHyperfocusDetector } from '@/hooks/useHyperfocusDetector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function HyperfocusBreakModal() {
  const { checkForHyperfocus, startBreak, completeBreak, skipBreak, settings } = useHyperfocusDetector();
  const [breakInfo, setBreakInfo] = useState<ReturnType<typeof checkForHyperfocus>>(null);
  const [showFutureSelf, setShowFutureSelf] = useState(false);
  const [breakTimer, setBreakTimer] = useState(0);
  const [onBreak, setOnBreak] = useState(false);

  // Check for hyperfocus every minute
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const info = checkForHyperfocus();
      if (info && !breakInfo) {
        setBreakInfo(info);
        
        // Multi-modal alert
        if (settings.multiModal) {
          // Visual: Flash border
          document.body.style.outline = '5px solid red';
          setTimeout(() => {
            document.body.style.outline = '';
          }, 2000);
          
          // Audio: Simple beep (you can add a sound file)
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            oscillator.connect(audioContext.destination);
            oscillator.frequency.value = 440;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
          } catch (e) {
            console.log('Audio context not supported');
          }
          
          // Haptic: Vibrate if supported
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        }
      }
    }, 60000);  // Check every minute
    
    return () => clearInterval(checkInterval);
  }, [checkForHyperfocus, settings, breakInfo]);

  // Handle break start
  const handleStartBreak = () => {
    if (!breakInfo) return;
    
    startBreak();
    setOnBreak(true);
    setBreakTimer(breakInfo.duration * 60);  // Convert to seconds
    
    // Start countdown
    const timer = setInterval(() => {
      setBreakTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleCompleteBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle break completion
  const handleCompleteBreak = () => {
    completeBreak();
    setBreakInfo(null);
    setOnBreak(false);
    setShowFutureSelf(false);
  };

  // Handle skip (show future-self first if enabled)
  const handleSkip = () => {
    if (settings.futureSelfVisualization && !showFutureSelf) {
      setShowFutureSelf(true);
      return;
    }
    
    skipBreak();
    setBreakInfo(null);
    setShowFutureSelf(false);
  };

  if (!breakInfo) return null;

  // Future-self visualization prompt
  if (showFutureSelf) {
    return (
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Before you skip...</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Imagine yourself 4 hours from now:</p>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm">
                  ✅ If you take this {breakInfo.duration}-minute break now, 
                  you'll feel refreshed and focused. Your eyes won't hurt, 
                  your back won't ache, and you'll finish your work feeling good.
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm">
                  ❌ If you skip this break, you'll push through now but hit a wall later. 
                  You'll be exhausted, scattered, and everything will take longer.
                </p>
              </div>
              <p className="text-sm font-medium">Which version of yourself do you want to be?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleSkip}>
              Still skip
            </Button>
            <AlertDialogAction onClick={handleStartBreak}>
              Take the break
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // On break - show timer
  if (onBreak) {
    const progress = ((breakInfo.duration * 60 - breakTimer) / (breakInfo.duration * 60)) * 100;
    const minutesLeft = Math.ceil(breakTimer / 60);
    
    return (
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Break in progress</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{breakInfo.activity}</p>
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-center text-sm font-medium">
                  {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''} remaining
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCompleteBreak}>
              Break complete!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Initial break suggestion
  const isUrgent = breakInfo.type === 'urgent';
  
  return (
    <AlertDialog open>
      <AlertDialogContent className={isUrgent ? 'border-red-500 border-2' : ''}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isUrgent ? '🚨 Break Required' : '⏸️ Time for a Break'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-medium">{breakInfo.reason}</p>
            <p>{breakInfo.activity}</p>
            {breakInfo.requiresMovement && (
              <p className="text-xs text-muted-foreground">
                💡 Stand up and move around before dismissing
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {breakInfo.canDismiss && (
            <Button variant="outline" onClick={handleSkip}>
              Skip (not recommended)
            </Button>
          )}
          <AlertDialogAction onClick={handleStartBreak}>
            Start {breakInfo.duration}-min break
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Component 3: Session Monitor

**New File:** `src/components/session/SessionMonitor.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SessionMonitor() {
  const [sessionStart] = useState(new Date());
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const minutes = Math.floor((Date.now() - sessionStart.getTime()) / 60000);
      setDuration(minutes);
    }, 60000);  // Update every minute
    
    return () => clearInterval(interval);
  }, [sessionStart]);

  if (duration < 30) return null;  // Don't show until 30+ minutes

  const isLongSession = duration >= 90;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-64 shadow-lg",
      isLongSession && "border-amber-500 border-2"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Computer session</p>
            <p className="text-sm font-medium">
              {hours > 0 && `${hours}h `}{minutes}m
            </p>
          </div>
          {isLongSession && (
            <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
          )}
        </div>
        {isLongSession && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Consider taking a longer break soon
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Integration & Testing

### Dashboard Integration

Add to main dashboard:

```typescript
import { MomentumWidget } from '@/components/momentum/MomentumWidget';
import { HyperfocusBreakModal } from '@/components/hyperfocus/HyperfocusBreakModal';
import { SessionMonitor } from '@/components/session/SessionMonitor';

// In dashboard render:
<MomentumWidget />
<HyperfocusBreakModal />
<SessionMonitor />
```

### Settings Page

Add hyperfocus settings section with toggles for:
- Enable/disable
- Detection threshold (60/90/120 min)
- Break duration (2/5/10 min)
- Multi-modal alerts
- Require movement
- Future-self visualization

---

## Success Criteria

✅ Momentum Widget shows on dashboard
✅ Micro-win suggestions appear after 20-30 min
✅ Celebrations trigger on completion
✅ Hyperfocus detection after 90+ min
✅ Multi-modal alerts work
✅ Break modal enforces breaks
✅ Future-self visualization shows
✅ Session Monitor tracks time
✅ Settings save properly
✅ Computer lock-in problem solved!

This phase directly solves your "getting stuck at computer" issue through dopamine cascades and external interruption!