import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface HyperfocusState {
  isLikelyHyperfocused: boolean;
  sessionStartTime: string | null;
  lastInteraction: string;
  interactionCount: number;
  consecutiveLongSessions: number;
  lastBreakTime: string | null;
  breaksSkippedToday: number;
  lastResetDate: string;
}

export interface HyperfocusBreak {
  type: 'micro' | 'standard' | 'urgent';
  reason: string;
  duration: number;
  activity: string;
  canDismiss: boolean;
  requiresMovement: boolean;
}

export interface HyperfocusSettings {
  enabled: boolean;
  detectionThreshold: 60 | 90 | 120;
  breakDuration: 2 | 5 | 10;
  multiModal: boolean;
  requireMovement: boolean;
  futureSelfVisualization: boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const getInitialState = (): HyperfocusState => ({
  isLikelyHyperfocused: false,
  sessionStartTime: new Date().toISOString(),
  lastInteraction: new Date().toISOString(),
  interactionCount: 0,
  consecutiveLongSessions: 0,
  lastBreakTime: null,
  breaksSkippedToday: 0,
  lastResetDate: new Date().toDateString(),
});

const DEFAULT_SETTINGS: HyperfocusSettings = {
  enabled: true,
  detectionThreshold: 90,
  breakDuration: 5,
  multiModal: true,
  requireMovement: true,
  futureSelfVisualization: true,
};

// ============================================================================
// Hook
// ============================================================================

export function useHyperfocusDetector() {
  const [state, setState] = useLocalStorage<HyperfocusState>(
    'neurulae-hyperfocus',
    getInitialState()
  );

  const [settings, setSettings] = useLocalStorage<HyperfocusSettings>(
    'neurulae-hyperfocus-settings',
    DEFAULT_SETTINGS
  );

  // Track session duration in minutes
  const [sessionMinutes, setSessionMinutes] = useState(0);

  // Update session duration every minute
  useEffect(() => {
    const updateSessionDuration = () => {
      if (state.sessionStartTime) {
        const minutes = Math.floor(
          (Date.now() - new Date(state.sessionStartTime).getTime()) / 60000
        );
        setSessionMinutes(minutes);
      }
    };

    updateSessionDuration();
    const interval = setInterval(updateSessionDuration, 60000);
    return () => clearInterval(interval);
  }, [state.sessionStartTime]);

  // Check and reset at midnight
  const checkAndResetDaily = useCallback(() => {
    const today = new Date().toDateString();
    if (state.lastResetDate !== today) {
      setState((prev) => ({
        ...prev,
        breaksSkippedToday: 0,
        consecutiveLongSessions: 0,
        lastResetDate: today,
      }));
    }
  }, [state.lastResetDate, setState]);

  // Record user interaction (any click, keyboard, etc)
  const recordInteraction = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastInteraction: new Date().toISOString(),
      interactionCount: prev.interactionCount + 1,
    }));
  }, [setState]);

  // Check if user is likely hyperfocused
  const checkForHyperfocus = useCallback((): HyperfocusBreak | null => {
    checkAndResetDaily();
    
    if (!settings.enabled) return null;

    const minutesSinceInteraction = state.lastInteraction
      ? (Date.now() - new Date(state.lastInteraction).getTime()) / 60000
      : 0;

    const minutesSinceBreak = state.lastBreakTime
      ? (Date.now() - new Date(state.lastBreakTime).getTime()) / 60000
      : sessionMinutes;

    // Hyperfocus indicators:
    // 1. Long session duration
    // 2. Low interaction variance (hasn't moved from screen)
    // 3. Time since last break

    const isLongSession = sessionMinutes >= settings.detectionThreshold;
    const isLowInteraction = minutesSinceInteraction > 15; // 15 min no recorded movement
    const needsBreak = minutesSinceBreak > 60 || sessionMinutes > 45;

    // Determine break urgency
    if (sessionMinutes >= 120) {
      // URGENT: 2+ hours
      return {
        type: 'urgent',
        reason: "You've been locked in for over 2 hours",
        duration: 10,
        activity:
          'Walk outside for 10 minutes. Your eyes and body need this.',
        canDismiss: false,
        requiresMovement: true,
      };
    } else if (isLongSession && isLowInteraction) {
      // LIKELY HYPERFOCUS
      return {
        type: 'standard',
        reason: `You've been deeply focused for ${sessionMinutes} minutes`,
        duration: settings.breakDuration,
        activity:
          'Stand up, walk around, get water. Take 5 minutes away from the screen.',
        canDismiss: true,
        requiresMovement: settings.requireMovement,
      };
    } else if (needsBreak && sessionMinutes >= 45) {
      // PREVENTIVE: Before hyperfocus sets in
      return {
        type: 'micro',
        reason: 'Time for a quick movement break',
        duration: 2,
        activity: 'Stand and stretch for 2 minutes',
        canDismiss: true,
        requiresMovement: false,
      };
    }

    return null;
  }, [settings, state, sessionMinutes, checkAndResetDaily]);

  // Is break needed right now?
  const isBreakNeeded = useMemo(() => {
    return checkForHyperfocus() !== null;
  }, [checkForHyperfocus]);

  // Start break
  const startBreak = useCallback(() => {
    const breakInfo = checkForHyperfocus();
    if (!breakInfo) return;

    // Dispatch event for timer pause
    window.dispatchEvent(
      new CustomEvent('hyperfocus:break-started', {
        detail: { breakInfo },
      })
    );

    setState((prev) => ({
      ...prev,
      lastBreakTime: new Date().toISOString(),
    }));
  }, [checkForHyperfocus, setState]);

  // Complete break
  const completeBreak = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLikelyHyperfocused: false,
      interactionCount: 0,
    }));

    // Resume work session if it was active
    window.dispatchEvent(new CustomEvent('hyperfocus:break-completed'));

    toast.success('✨ Break complete!', {
      description: 'Welcome back - ready to continue?',
    });
  }, [setState]);

  // Skip break (not recommended)
  const skipBreak = useCallback(() => {
    setState((prev) => ({
      ...prev,
      breaksSkippedToday: prev.breaksSkippedToday + 1,
      lastBreakTime: new Date().toISOString(), // Prevent immediate re-suggestion
    }));

    toast.warning('Break skipped', {
      description: "I'll remind you again later",
    });
  }, [setState]);

  // Update settings
  const updateSettings = useCallback(
    (updates: Partial<HyperfocusSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    [setSettings]
  );

  // Track long sessions
  useEffect(() => {
    if (sessionMinutes >= 90) {
      setState((prev) => {
        // Only increment once per session crossing 90 minutes
        if (!prev.isLikelyHyperfocused) {
          return {
            ...prev,
            isLikelyHyperfocused: true,
            consecutiveLongSessions: prev.consecutiveLongSessions + 1,
          };
        }
        return prev;
      });
    }
  }, [sessionMinutes, setState]);

  return {
    state: { ...state, sessionMinutes },
    settings,
    checkForHyperfocus,
    isBreakNeeded,
    recordInteraction,
    startBreak,
    completeBreak,
    skipBreak,
    updateSettings,
  };
}
