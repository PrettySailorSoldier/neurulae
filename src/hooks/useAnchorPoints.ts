import { useCallback, useMemo } from 'react';
import { useSyncedStorage } from './useSyncedStorage';
import {
  AnchorPoint,
  NaturalPattern,
  OnboardingFlowState,
  AIPersonality,
  ND_STORAGE_KEYS
} from '@/types';

// Default empty onboarding state
const DEFAULT_ONBOARDING_STATE: OnboardingFlowState = {
  currentStep: 'welcome',
  aiPersonality: 'warm',
  collectedData: {
    naturalPatterns: [],
    anchorPoints: [],
    frictionPoints: [],
    transitionStruggles: [],
    energyPatterns: {
      peakHours: [],
      lowHours: [],
      variability: 'somewhat-variable',
    },
  },
};

export function useAnchorPoints() {
  const [anchorPoints, setAnchorPoints] = useSyncedStorage<AnchorPoint[]>(
    ND_STORAGE_KEYS.ANCHOR_POINTS,
    []
  );

  const [onboardingState, setOnboardingState] = useSyncedStorage<OnboardingFlowState>(
    ND_STORAGE_KEYS.ONBOARDING_FLOW,
    DEFAULT_ONBOARDING_STATE
  );

  const [aiPersonality, setAIPersonality] = useSyncedStorage<AIPersonality>(
    ND_STORAGE_KEYS.AI_PERSONALITY,
    'warm'
  );

  // Add a new anchor point
  const addAnchorPoint = useCallback((anchor: Omit<AnchorPoint, 'id' | 'createdAt'>) => {
    const newAnchor: AnchorPoint = {
      ...anchor,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setAnchorPoints(prev => [...prev, newAnchor]);
    return newAnchor;
  }, [setAnchorPoints]);

  // Update an existing anchor point
  const updateAnchorPoint = useCallback((id: string, updates: Partial<AnchorPoint>) => {
    setAnchorPoints(prev =>
      prev.map(anchor =>
        anchor.id === id ? { ...anchor, ...updates } : anchor
      )
    );
  }, [setAnchorPoints]);

  // Delete an anchor point
  const deleteAnchorPoint = useCallback((id: string) => {
    setAnchorPoints(prev => prev.filter(anchor => anchor.id !== id));
  }, [setAnchorPoints]);

  // Toggle anchor active state
  const toggleAnchorActive = useCallback((id: string) => {
    setAnchorPoints(prev =>
      prev.map(anchor =>
        anchor.id === id ? { ...anchor, isActive: !anchor.isActive } : anchor
      )
    );
  }, [setAnchorPoints]);

  // Link a routine to an anchor
  const linkRoutineToAnchor = useCallback((anchorId: string, routineId: string) => {
    setAnchorPoints(prev =>
      prev.map(anchor =>
        anchor.id === anchorId && !anchor.linkedRoutineIds.includes(routineId)
          ? { ...anchor, linkedRoutineIds: [...anchor.linkedRoutineIds, routineId] }
          : anchor
      )
    );
  }, [setAnchorPoints]);

  // Unlink a routine from an anchor
  const unlinkRoutineFromAnchor = useCallback((anchorId: string, routineId: string) => {
    setAnchorPoints(prev =>
      prev.map(anchor =>
        anchor.id === anchorId
          ? { ...anchor, linkedRoutineIds: anchor.linkedRoutineIds.filter(id => id !== routineId) }
          : anchor
      )
    );
  }, [setAnchorPoints]);

  // Convert a natural pattern to an anchor point
  const convertPatternToAnchor = useCallback((pattern: NaturalPattern, category: AnchorPoint['category']) => {
    const anchor: Omit<AnchorPoint, 'id' | 'createdAt'> = {
      name: pattern.activity,
      triggerType: pattern.typicalTime ? 'time' : 'event',
      triggerTime: pattern.typicalTime,
      triggerEvent: pattern.typicalTime ? undefined : pattern.activity,
      reliability: pattern.reliability === 'always' ? 'rock-solid' : pattern.reliability,
      linkedRoutineIds: [],
      attachmentPosition: 'after',
      category,
      isActive: true,
    };
    return addAnchorPoint(anchor);
  }, [addAnchorPoint]);

  // Get anchors by category
  const getAnchorsByCategory = useCallback((category: AnchorPoint['category']) => {
    return anchorPoints.filter(anchor => anchor.category === category && anchor.isActive);
  }, [anchorPoints]);

  // Get active anchors sorted by time (time-based first, then event-based)
  const activeAnchors = useMemo(() => {
    return anchorPoints
      .filter(anchor => anchor.isActive)
      .sort((a, b) => {
        // Time-based anchors first, sorted by time
        if (a.triggerType === 'time' && b.triggerType === 'time') {
          return (a.triggerTime || '').localeCompare(b.triggerTime || '');
        }
        if (a.triggerType === 'time') return -1;
        if (b.triggerType === 'time') return 1;
        // Event-based anchors by name
        return a.name.localeCompare(b.name);
      });
  }, [anchorPoints]);

  // Get the next upcoming time-based anchor
  const getNextAnchor = useCallback(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const timeAnchors = anchorPoints.filter(
      anchor => anchor.isActive && anchor.triggerType === 'time' && anchor.triggerTime
    );

    // Find the next anchor after current time
    const upcoming = timeAnchors
      .filter(anchor => anchor.triggerTime! > currentTime)
      .sort((a, b) => a.triggerTime!.localeCompare(b.triggerTime!));

    return upcoming[0] || null;
  }, [anchorPoints]);

  // Onboarding flow helpers
  const updateOnboardingStep = useCallback((step: OnboardingFlowState['currentStep']) => {
    setOnboardingState(prev => ({
      ...prev,
      currentStep: step,
      canResumeFrom: step,
    }));
  }, [setOnboardingState]);

  const updateOnboardingData = useCallback((
    data: Partial<OnboardingFlowState['collectedData']>
  ) => {
    setOnboardingState(prev => ({
      ...prev,
      collectedData: {
        ...prev.collectedData,
        ...data,
      },
    }));
  }, [setOnboardingState]);

  const completeOnboarding = useCallback(() => {
    setOnboardingState(prev => ({
      ...prev,
      currentStep: 'complete',
      completedAt: new Date().toISOString(),
    }));
  }, [setOnboardingState]);

  const resetOnboarding = useCallback(() => {
    setOnboardingState(DEFAULT_ONBOARDING_STATE);
  }, [setOnboardingState]);

  const isOnboardingComplete = useMemo(() => {
    return onboardingState.currentStep === 'complete' && !!onboardingState.completedAt;
  }, [onboardingState]);

  return {
    // Anchor points
    anchorPoints,
    activeAnchors,
    addAnchorPoint,
    updateAnchorPoint,
    deleteAnchorPoint,
    toggleAnchorActive,
    linkRoutineToAnchor,
    unlinkRoutineFromAnchor,
    convertPatternToAnchor,
    getAnchorsByCategory,
    getNextAnchor,

    // Onboarding
    onboardingState,
    updateOnboardingStep,
    updateOnboardingData,
    completeOnboarding,
    resetOnboarding,
    isOnboardingComplete,

    // AI Personality
    aiPersonality,
    setAIPersonality,
  };
}
