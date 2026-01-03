import { useCallback, useMemo } from 'react';
import { useSyncedStorage } from './useSyncedStorage';
import { CheckIn, ND_STORAGE_KEYS } from '@/types';

export function useCheckIns() {
  const [checkIns, setCheckIns] = useSyncedStorage<CheckIn[]>(
    ND_STORAGE_KEYS.CHECK_INS,
    []
  );

  // Add a new check-in
  const addCheckIn = useCallback((
    checkIn: Omit<CheckIn, 'id' | 'completedAt' | 'aiInsights' | 'suggestedAdjustments'>
  ) => {
    const newCheckIn: CheckIn = {
      ...checkIn,
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
    };
    setCheckIns(prev => [...prev, newCheckIn]);
    return newCheckIn;
  }, [setCheckIns]);

  // Update a check-in (e.g., add AI insights)
  const updateCheckIn = useCallback((id: string, updates: Partial<CheckIn>) => {
    setCheckIns(prev =>
      prev.map(checkIn =>
        checkIn.id === id ? { ...checkIn, ...updates } : checkIn
      )
    );
  }, [setCheckIns]);

  // Delete a check-in
  const deleteCheckIn = useCallback((id: string) => {
    setCheckIns(prev => prev.filter(checkIn => checkIn.id !== id));
  }, [setCheckIns]);

  // Get check-ins by type
  const getCheckInsByType = useCallback((type: 'daily' | 'weekly' | 'ad-hoc') => {
    return checkIns.filter(c => c.type === type);
  }, [checkIns]);

  // Get recent check-ins (last 7 days)
  const recentCheckIns = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return checkIns.filter(c => 
      c.completedAt && new Date(c.completedAt) >= sevenDaysAgo
    ).sort((a, b) => 
      new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );
  }, [checkIns]);

  // Get today's check-in if exists
  const todaysCheckIn = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return checkIns.find(c => 
      c.completedAt && c.completedAt.startsWith(today) && c.type === 'daily'
    );
  }, [checkIns]);

  // Check if we should prompt for a check-in
  const shouldPromptDaily = useMemo(() => {
    if (todaysCheckIn) return false;
    
    const hour = new Date().getHours();
    // Prompt in evening (after 6 PM)
    return hour >= 18;
  }, [todaysCheckIn]);

  const shouldPromptWeekly = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Prompt on Sunday
    if (dayOfWeek !== 0) return false;
    
    // Check if we already did one this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    return !checkIns.some(c => 
      c.type === 'weekly' && 
      c.completedAt && 
      new Date(c.completedAt) >= startOfWeek
    );
  }, [checkIns]);

  // Calculate patterns from check-ins
  const patterns = useMemo(() => {
    if (recentCheckIns.length < 3) return null;

    // Average energy
    const energyLevels = recentCheckIns.map(c => c.responses.energyLevel);
    const avgEnergy = energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length;

    // Most common wins
    const winCounts: Record<string, number> = {};
    recentCheckIns.forEach(c => {
      c.responses.whatWorked.forEach(win => {
        winCounts[win] = (winCounts[win] || 0) + 1;
      });
    });
    const topWins = Object.entries(winCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([win]) => win);

    // Most common struggles
    const struggleCounts: Record<string, number> = {};
    recentCheckIns.forEach(c => {
      c.responses.whatDidnt.forEach(struggle => {
        struggleCounts[struggle] = (struggleCounts[struggle] || 0) + 1;
      });
    });
    const topStruggles = Object.entries(struggleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([struggle]) => struggle);

    // Feeling trend
    const feelingScores = recentCheckIns.map(c => {
      switch (c.responses.overallFeeling) {
        case 'great': return 3;
        case 'okay': return 2;
        case 'struggling': return 1;
        default: return 2;
      }
    });
    const avgFeeling = feelingScores.reduce((a, b) => a + b, 0) / feelingScores.length;
    const feelingTrend = avgFeeling >= 2.5 ? 'positive' : avgFeeling >= 1.5 ? 'neutral' : 'negative';

    return {
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      topWins,
      topStruggles,
      feelingTrend,
      checkInCount: recentCheckIns.length,
    };
  }, [recentCheckIns]);

  return {
    checkIns,
    addCheckIn,
    updateCheckIn,
    deleteCheckIn,
    getCheckInsByType,
    recentCheckIns,
    todaysCheckIn,
    shouldPromptDaily,
    shouldPromptWeekly,
    patterns,
  };
}
