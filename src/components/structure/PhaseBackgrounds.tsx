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
  showLabels = true
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
        : 100; // Handle overnight phases
      
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

  const getPhaseGradient = (color: string, isCurrent: boolean) => {
    // Increased opacity for current phase: 0.15 → 0.25
    const opacity = isCurrent ? '0.25' : '0.05';
    const colorMap: Record<string, string> = {
      'amber': `rgba(245, 158, 11, ${opacity})`,
      'yellow': `rgba(234, 179, 8, ${opacity})`,
      'orange': `rgba(249, 115, 22, ${opacity})`,
      'blue': `rgba(59, 130, 246, ${opacity})`,
      'purple': `rgba(168, 85, 247, ${opacity})`,
      'indigo': `rgba(99, 102, 241, ${opacity})`,
      'slate': `rgba(100, 116, 139, ${opacity})`
    };
    return colorMap[color] || `rgba(100, 100, 100, ${opacity})`;
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
          className={cn(
            'absolute left-0 right-0 transition-all duration-300',
            region.isCurrent && 'ring-1 ring-inset ring-primary/30'
          )}
          style={{
            top: `${region.startPercent}%`,
            height: `${region.heightPercent}%`,
            backgroundColor: getPhaseGradient(region.color, region.isCurrent),
            // Add left border for current phase
            borderLeft: region.isCurrent ? `4px solid ${getPhaseAccentColor(region.color)}` : undefined,
            // Subtle glow for current phase
            boxShadow: region.isCurrent ? `inset 8px 0 16px -8px ${getPhaseAccentColor(region.color)}40` : undefined
          }}
        >
          {/* Phase label - enhanced for current phase */}
          {showLabels && region.isInWakingHours && (
            <div className={cn(
              'absolute left-2 top-1 px-2 py-0.5 rounded text-[10px] font-medium',
              'bg-background/90 backdrop-blur-sm border',
              region.isCurrent 
                ? 'text-primary border-primary/30 shadow-sm' 
                : 'text-muted-foreground border-transparent'
            )}>
              {region.isCurrent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-1.5" />}
              {region.label}
            </div>
          )}
          
          {/* Phase divider line */}
          <div className={cn(
            'absolute bottom-0 left-0 right-0 h-px',
            region.isCurrent ? 'bg-primary/40' : 'bg-border/50'
          )} />
        </div>
      ))}
    </div>
  );
}

