import { useState, useEffect } from 'react';
import { usePremium } from '@/contexts/PremiumContext';

interface FeatureLimits {
  playbooks: number;
  stuckSessions: number;
  widgets: {
    reminder: number;
    energy: number;
    messenger: number;
    moodGarden: number;
    parallelUniverse: number;
    soundSignature: number;
  };
}

const FREE_LIMITS: FeatureLimits = {
  playbooks: 3,
  stuckSessions: 2, // 2 free stuck sessions per month
  widgets: {
    reminder: 1,
    energy: 1,
    messenger: 1,
    moodGarden: 1,
    parallelUniverse: 1,
    soundSignature: 1,
  },
};

export function useFeatureLimit() {
  const { isPremium, isAdmin } = usePremium();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState('');
  const [stuckSessionsUsed, setStuckSessionsUsed] = useState(0);

  // Load stuck sessions count on mount
  useEffect(() => {
    const stored = localStorage.getItem('neurulae-stuck-sessions');
    if (stored) {
      const data = JSON.parse(stored);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
      
      // Reset if new month
      if (data.month !== currentMonth) {
        localStorage.setItem('neurulae-stuck-sessions', JSON.stringify({ month: currentMonth, count: 0 }));
        setStuckSessionsUsed(0);
      } else {
        setStuckSessionsUsed(data.count);
      }
    } else {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
      localStorage.setItem('neurulae-stuck-sessions', JSON.stringify({ month: currentMonth, count: 0 }));
    }
  }, []);

  const checkLimit = (type: 'playbooks' | keyof FeatureLimits['widgets'], currentCount: number): boolean => {
    if (isPremium || isAdmin) return true;

    let limit: number;
    if (type === 'playbooks') {
      limit = FREE_LIMITS.playbooks;
    } else {
      limit = FREE_LIMITS.widgets[type];
    }

    return currentCount < limit;
  };

  const showUpgradeModal = (feature: string) => {
    setBlockedFeature(feature);
    setUpgradeModalOpen(true);
  };

  const canUseCloudSync = (): boolean => {
    return isPremium || isAdmin;
  };

  const canUseCustomThemes = (): boolean => {
    return isPremium || isAdmin;
  };

  const canUseAIFeatures = (): boolean => {
    return isPremium || isAdmin;
  };

  const canUseStuckMode = (): boolean => {
    if (isPremium || isAdmin) return true;
    return stuckSessionsUsed < FREE_LIMITS.stuckSessions;
  };

  const incrementStuckSession = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const newCount = stuckSessionsUsed + 1;
    localStorage.setItem('neurulae-stuck-sessions', JSON.stringify({ month: currentMonth, count: newCount }));
    setStuckSessionsUsed(newCount);
  };

  const stuckSessionsRemaining = isPremium || isAdmin ? Infinity : Math.max(0, FREE_LIMITS.stuckSessions - stuckSessionsUsed);

  return {
    checkLimit,
    showUpgradeModal,
    upgradeModalOpen,
    setUpgradeModalOpen,
    blockedFeature,
    canUseCloudSync,
    canUseCustomThemes,
    canUseAIFeatures,
    canUseStuckMode,
    incrementStuckSession,
    stuckSessionsRemaining,
    isPremium,
    isAdmin,
    limits: FREE_LIMITS,
  };
}
