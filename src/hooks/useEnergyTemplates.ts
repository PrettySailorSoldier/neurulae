import { useCallback, useMemo } from 'react';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { TimeBlock } from '@/types';
import { format } from 'date-fns';

// ============ TYPES ============

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

// ============ HELPER FUNCTIONS ============

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

function simplifyBlocks(blocks: TimeBlock[], percentage: number): TimeBlock[] {
  if (blocks.length === 0) return [];
  
  // Sort by priority (morning routines first, essential categories)
  const scored = blocks.map(block => ({
    block,
    priority: calculateBlockPriority(block),
  }));
  
  scored.sort((a, b) => b.priority - a.priority);
  
  const keepCount = Math.max(1, Math.ceil(blocks.length * percentage));
  return scored.slice(0, keepCount).map(s => s.block);
}

function calculateAverageLevel(checks: EnergyCheckIn[]): EnergyLevel {
  if (checks.length === 0) return 'average';
  
  const levelValues: Record<EnergyLevel, number> = { low: 1, average: 2, high: 3 };
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
  
  const levelValues: Record<EnergyLevel, number> = { low: 1, average: 2, high: 3 };
  
  const recentAvg = recent.reduce((acc, c) => 
    acc + levelValues[c.selectedLevel], 0) / recent.length;
  const prevAvg = previous.reduce((acc, c) => 
    acc + levelValues[c.selectedLevel], 0) / previous.length;
  
  const diff = recentAvg - prevAvg;
  
  if (diff > 0.3) return 'improving';
  if (diff < -0.3) return 'declining';
  return 'stable';
}

// ============ HOOK ============

export function useEnergyTemplates() {
  const [templates, setTemplates] = useSyncedStorage<EnergyTemplate[]>('neurulae-energy-templates', []);
  const [checkIns, setCheckIns] = useSyncedStorage<EnergyCheckIn[]>('neurulae-energy-checkins', []);
  
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
  
  // Create new energy template from full blocks
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
  
  // Update an existing template
  const updateTemplate = useCallback((
    templateId: string,
    updates: Partial<EnergyTemplate>
  ) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, ...updates } : t
    ));
  }, [setTemplates]);
  
  // Delete a template
  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  }, [setTemplates]);
  
  // Calculate energy patterns from check-in history
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
    updateTemplate,
    deleteTemplate,
  };
}
