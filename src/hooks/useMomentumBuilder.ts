import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface MicroWin {
  id: string;
  action: string;
  category: 'movement' | 'hydration' | 'environment' | 'social' | 'admin';
  durationSeconds: number;
  difficulty: 'trivial' | 'easy';
  completedAt?: string;
}

export interface MomentumState {
  winsToday: number;
  lastWinTime: string | null;
  currentStreak: number;
  longestStreak: number;
  todaysWins: MicroWin[];
  momentumLevel: 'cold' | 'warming' | 'hot' | 'blazing';
  sessionStartTime: string | null;
  consecutiveSessionsToday: number;
  lastResetDate: string;
}

export interface MomentumSuggestion {
  microWin: MicroWin;
  reason: string;
  celebrationMessage: string;
}

// ============================================================================
// Micro-Win Library (all under 2 minutes)
// ============================================================================

const MICRO_WINS: Record<MicroWin['category'], MicroWin[]> = {
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
    {
      id: 'shoulder-rolls',
      action: 'Roll your shoulders 10 times',
      category: 'movement',
      durationSeconds: 20,
      difficulty: 'trivial',
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
    {
      id: 'trash-item',
      action: 'Throw away one piece of trash',
      category: 'environment',
      durationSeconds: 20,
      difficulty: 'trivial',
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
      action: "Check tomorrow's calendar",
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
      action: "Close browser tabs you don't need",
      category: 'admin',
      durationSeconds: 60,
      difficulty: 'easy',
    },
  ],
};

// ============================================================================
// Initial State
// ============================================================================

const getInitialState = (): MomentumState => ({
  winsToday: 0,
  lastWinTime: null,
  currentStreak: 0,
  longestStreak: 0,
  todaysWins: [],
  momentumLevel: 'cold',
  sessionStartTime: null,
  consecutiveSessionsToday: 0,
  lastResetDate: new Date().toDateString(),
});

// ============================================================================
// Hook
// ============================================================================

export function useMomentumBuilder() {
  const [state, setState] = useLocalStorage<MomentumState>(
    'neurulae-momentum',
    getInitialState()
  );

  // Check and reset at midnight
  const checkAndResetDaily = useCallback(() => {
    const today = new Date().toDateString();
    if (state.lastResetDate !== today) {
      setState((prev) => ({
        ...getInitialState(),
        longestStreak: prev.longestStreak, // Preserve all-time record
        lastResetDate: today,
      }));
    }
  }, [state.lastResetDate, setState]);

  // Calculate momentum level based on recent activity
  const getMomentumLevel = useCallback((): MomentumState['momentumLevel'] => {
    checkAndResetDaily();
    
    if (!state.lastWinTime) return 'cold';

    const minutesSinceLastWin =
      (Date.now() - new Date(state.lastWinTime).getTime()) / 60000;

    if (state.currentStreak >= 5) return 'blazing';
    if (state.currentStreak >= 3) return 'hot';
    if (minutesSinceLastWin < 10 && state.currentStreak >= 1) return 'warming';
    return 'cold';
  }, [state.lastWinTime, state.currentStreak, checkAndResetDaily]);

  // Should we suggest a micro-win now?
  const shouldSuggestMicroWin = useCallback(
    (sessionMinutes: number) => {
      checkAndResetDaily();
      
      // Suggest every 20-30 minutes depending on momentum
      const momentum = getMomentumLevel();
      const threshold =
        momentum === 'cold' ? 20 : momentum === 'warming' ? 25 : 30;

      // Check time since last win
      const timeSinceLastWin = state.lastWinTime
        ? (Date.now() - new Date(state.lastWinTime).getTime()) / 60000
        : sessionMinutes;

      return timeSinceLastWin >= threshold;
    },
    [state.lastWinTime, getMomentumLevel, checkAndResetDaily]
  );

  // Get suggestion based on context
  const getSuggestion = useCallback(
    (sessionMinutes: number = 0): MomentumSuggestion | null => {
      checkAndResetDaily();
      
      if (!shouldSuggestMicroWin(sessionMinutes)) return null;

      // Select appropriate micro-win category based on context
      let category: MicroWin['category'] = 'movement'; // Default

      if (sessionMinutes > 60) {
        // Long session - prioritize movement
        category = Math.random() > 0.5 ? 'movement' : 'hydration';
      } else if (
        state.momentumLevel === 'hot' ||
        state.momentumLevel === 'blazing'
      ) {
        // High momentum - can suggest admin/social tasks
        const options: MicroWin['category'][] = [
          'movement',
          'admin',
          'social',
          'environment',
        ];
        category = options[Math.floor(Math.random() * options.length)];
      }

      // Pick random win from category
      const wins = MICRO_WINS[category];
      const selectedWin = wins[Math.floor(Math.random() * wins.length)];

      // Generate reason
      const reason =
        sessionMinutes > 45
          ? `You've been focused for ${sessionMinutes} minutes - time for a break!`
          : `Great focus! Quick ${selectedWin.durationSeconds}s break?`;

      // Celebration message
      const nextWinCount = state.winsToday + 1;
      const celebration =
        nextWinCount === 1
          ? '🌱 First win of the day!'
          : nextWinCount === 3
            ? '🔥 3 wins - momentum building!'
            : nextWinCount === 5
              ? "⚡ 5 wins - you're on fire!"
              : nextWinCount === 10
                ? '🚀 10 wins - incredible!'
                : `✨ ${nextWinCount} wins today!`;

      return {
        microWin: selectedWin,
        reason,
        celebrationMessage: celebration,
      };
    },
    [state, shouldSuggestMicroWin, checkAndResetDaily]
  );

  // Record a completed micro-win
  const recordWin = useCallback(
    (win: MicroWin) => {
      const now = new Date();
      const completedWin = { ...win, completedAt: now.toISOString() };

      setState((prev) => {
        // Check if streak continues (within 5 minutes of last win)
        const minutesSinceLastWin = prev.lastWinTime
          ? (now.getTime() - new Date(prev.lastWinTime).getTime()) / 60000
          : 999;

        const newStreak =
          minutesSinceLastWin <= 5 ? prev.currentStreak + 1 : 1;

        const newState = {
          ...prev,
          winsToday: prev.winsToday + 1,
          lastWinTime: now.toISOString(),
          currentStreak: newStreak,
          longestStreak: Math.max(prev.longestStreak, newStreak),
          todaysWins: [...prev.todaysWins, completedWin],
        };

        // Update momentum level
        if (newStreak >= 5) newState.momentumLevel = 'blazing';
        else if (newStreak >= 3) newState.momentumLevel = 'hot';
        else if (newStreak >= 1) newState.momentumLevel = 'warming';

        return newState;
      });

      // Dispatch event for celebration UI
      window.dispatchEvent(
        new CustomEvent('momentum:win-recorded', {
          detail: { win: completedWin },
        })
      );

      // Show toast with celebration
      const nextWinCount = state.winsToday + 1;
      const celebration =
        nextWinCount === 1 ? '🌱 First win!' : `✨ Win #${nextWinCount}`;

      toast.success(celebration, {
        description: win.action,
      });
    },
    [setState, state.winsToday]
  );

  // Skip suggestion (user busy)
  const skipSuggestion = useCallback(() => {
    // Don't break streak, but reset suggestion timer
    setState((prev) => ({
      ...prev,
      lastWinTime: new Date().toISOString(), // Treat skip as "acknowledged"
    }));
  }, [setState]);

  // Get streak status message
  const getStreakStatus = useCallback(() => {
    if (state.currentStreak === 0) return 'Start your first win!';
    if (state.currentStreak === 1) return '🌱 1 win';
    if (state.currentStreak >= 5) return `🔥 ${state.currentStreak} win streak!`;
    return `⚡ ${state.currentStreak} wins in a row`;
  }, [state.currentStreak]);

  // Memoized return value
  const momentumLevel = useMemo(() => getMomentumLevel(), [getMomentumLevel]);

  return {
    state: { ...state, momentumLevel },
    recordWin,
    getSuggestion,
    skipSuggestion,
    shouldSuggestMicroWin,
    getMomentumLevel,
    getStreakStatus,
  };
}
