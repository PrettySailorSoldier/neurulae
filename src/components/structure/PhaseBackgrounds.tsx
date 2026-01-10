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
    const opacity = isCurrent ? '0.15' : '0.05';
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

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {phaseRegions.map(region => (
        <div
          key={region.name}
          className={cn(
            'absolute left-0 right-0 transition-colors duration-300',
            region.isCurrent && 'ring-1 ring-inset ring-primary/20'
          )}
          style={{
            top: `${region.startPercent}%`,
            height: `${region.heightPercent}%`,
            backgroundColor: getPhaseGradient(region.color, region.isCurrent)
          }}
        >
          {/* Phase label */}
          {showLabels && region.isInWakingHours && (
            <div className={cn(
              'absolute left-1 top-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
              'bg-background/80 backdrop-blur-sm',
              region.isCurrent ? 'text-primary' : 'text-muted-foreground'
            )}>
              {region.label}
            </div>
          )}
          
          {/* Phase divider line */}
          <div className={cn(
            'absolute bottom-0 left-0 right-0 h-px',
            region.isCurrent ? 'bg-primary/30' : 'bg-border/50'
          )} />
        </div>
      ))}
    </div>
  );
}
