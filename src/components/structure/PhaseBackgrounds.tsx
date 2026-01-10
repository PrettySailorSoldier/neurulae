import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DEFAULT_PHASES, PhaseDefinition, timeToMinutes } from '@/lib/temporalContext';

interface PhaseBackgroundsProps {
  phases?: PhaseDefinition[];
  wakeTime: string;
  sleepTime: string;
  currentPhase: string;
  showLabels?: boolean;
}

export function PhaseBackgrounds({
  phases = DEFAULT_PHASES,
  wakeTime,
  sleepTime,
  currentPhase,
  showLabels = false // Disabled by default - less clutter
}: PhaseBackgroundsProps) {
  const phaseRegions = useMemo(() => {
    const wakeMinutes = timeToMinutes(wakeTime);
    const sleepMinutes = timeToMinutes(sleepTime);
    const totalMinutes = 24 * 60;
    
    return phases.map(phase => {
      const startMinutes = timeToMinutes(phase.startTime);
      const endMinutes = timeToMinutes(phase.endTime);
      
      // Calculate position as percentage of day
      const startPercent = (startMinutes / totalMinutes) * 100;
      const endPercent = endMinutes > startMinutes 
        ? (endMinutes / totalMinutes) * 100
        : 100;
      
      const heightPercent = endPercent - startPercent;
      
      // Determine if this phase is within waking hours
      const isInWakingHours = 
        (startMinutes >= wakeMinutes && startMinutes < sleepMinutes) ||
        (endMinutes > wakeMinutes && endMinutes <= sleepMinutes);
      
      return {
        ...phase,
        startPercent,
        heightPercent,
        isInWakingHours,
        isCurrent: phase.name === currentPhase
      };
    });
  }, [phases, wakeTime, sleepTime, currentPhase]);

  // Subtle, clean gradient - only shows for current phase
  const getPhaseGradient = (color: string, isCurrent: boolean) => {
    if (!isCurrent) return 'transparent';
    
    // Very subtle tint for current phase only
    const colorMap: Record<string, string> = {
      'amber': 'rgba(245, 158, 11, 0.08)',
      'yellow': 'rgba(234, 179, 8, 0.08)',
      'orange': 'rgba(249, 115, 22, 0.08)',
      'blue': 'rgba(59, 130, 246, 0.08)',
      'purple': 'rgba(168, 85, 247, 0.08)',
      'indigo': 'rgba(99, 102, 241, 0.08)',
      'slate': 'rgba(100, 116, 139, 0.05)'
    };
    return colorMap[color] || 'transparent';
  };

  const getPhaseAccentColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'amber': 'rgb(245, 158, 11)',
      'yellow': 'rgb(234, 179, 8)',
      'orange': 'rgb(249, 115, 22)',
      'blue': 'rgb(59, 130, 246)',
      'purple': 'rgb(168, 85, 247)',
      'indigo': 'rgb(99, 102, 241)',
      'slate': 'rgb(100, 116, 139)'
    };
    return colorMap[color] || 'rgb(100, 100, 100)';
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {phaseRegions.map(region => (
        <div
          key={region.name}
          className="absolute left-0 right-0 transition-all duration-500"
          style={{
            top: `${region.startPercent}%`,
            height: `${region.heightPercent}%`,
            backgroundColor: getPhaseGradient(region.color, region.isCurrent),
            // Only show left accent bar for current phase
            borderLeft: region.isCurrent ? `3px solid ${getPhaseAccentColor(region.color)}` : undefined,
          }}
        >
          {/* Minimal current phase indicator - just a thin line at top */}
          {region.isCurrent && (
            <div 
              className="absolute top-0 left-0 right-0 h-px"
              style={{ backgroundColor: getPhaseAccentColor(region.color) }}
            />
          )}
          
          {/* Optional phase label - hidden by default */}
          {showLabels && region.isCurrent && (
            <div className={cn(
              'absolute right-2 top-1 px-1.5 py-0.5 rounded text-[9px] font-medium',
              'bg-background/80 backdrop-blur-sm text-muted-foreground'
            )}>
              {region.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
