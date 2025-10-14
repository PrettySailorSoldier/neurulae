import { useState } from 'react';
import { usePremium } from '@/contexts/PremiumContext';

interface FeatureLimits {
  playbooks: number;
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

  return {
    checkLimit,
    showUpgradeModal,
    upgradeModalOpen,
    setUpgradeModalOpen,
    blockedFeature,
    canUseCloudSync,
    canUseCustomThemes,
    canUseAIFeatures,
    isPremium,
    isAdmin,
    limits: FREE_LIMITS,
  };
}
