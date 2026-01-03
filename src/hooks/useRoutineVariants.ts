import { useCallback, useMemo } from 'react';
import { useSyncedStorage } from './useSyncedStorage';
import { RoutineVariant, ND_STORAGE_KEYS } from '@/types';

export function useRoutineVariants() {
  const [variants, setVariants] = useSyncedStorage<RoutineVariant[]>(
    ND_STORAGE_KEYS.ROUTINE_VARIANTS,
    []
  );

  // Add a new variant
  const addVariant = useCallback((variant: Omit<RoutineVariant, 'id' | 'createdAt'>) => {
    const newVariant: RoutineVariant = {
      ...variant,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setVariants(prev => [...prev, newVariant]);
    return newVariant;
  }, [setVariants]);

  // Update an existing variant
  const updateVariant = useCallback((id: string, updates: Partial<RoutineVariant>) => {
    setVariants(prev =>
      prev.map(variant =>
        variant.id === id ? { ...variant, ...updates } : variant
      )
    );
  }, [setVariants]);

  // Delete a variant
  const deleteVariant = useCallback((id: string) => {
    setVariants(prev => prev.filter(variant => variant.id !== id));
  }, [setVariants]);

  // Get variants for a specific routine
  const getVariantsForRoutine = useCallback((routineId: string) => {
    return variants.filter(variant => variant.parentRoutineId === routineId);
  }, [variants]);

  // Get the best variant based on current energy level
  const getBestVariant = useCallback((
    routineId: string,
    currentEnergyLevel: number
  ): RoutineVariant | null => {
    const routineVariants = variants
      .filter(v => v.parentRoutineId === routineId)
      .sort((a, b) => a.skipThreshold - b.skipThreshold);

    // Find the variant whose skip threshold matches the energy level
    // Lower energy = find variant with matching or higher skip threshold
    for (const variant of routineVariants) {
      if (currentEnergyLevel <= variant.skipThreshold) {
        return variant;
      }
    }

    return null; // No variant needed, use full routine
  }, [variants]);

  // Get all variants grouped by energy level
  const variantsByEnergy = useMemo(() => {
    const grouped: Record<string, RoutineVariant[]> = {
      minimal: [],
      low: [],
      medium: [],
      high: [],
    };

    variants.forEach(variant => {
      if (grouped[variant.energyLevel]) {
        grouped[variant.energyLevel].push(variant);
      }
    });

    return grouped;
  }, [variants]);

  // Check if a routine has variants
  const hasVariants = useCallback((routineId: string) => {
    return variants.some(v => v.parentRoutineId === routineId);
  }, [variants]);

  // Get variant count for a routine
  const getVariantCount = useCallback((routineId: string) => {
    return variants.filter(v => v.parentRoutineId === routineId).length;
  }, [variants]);

  return {
    variants,
    addVariant,
    updateVariant,
    deleteVariant,
    getVariantsForRoutine,
    getBestVariant,
    variantsByEnergy,
    hasVariants,
    getVariantCount,
  };
}
