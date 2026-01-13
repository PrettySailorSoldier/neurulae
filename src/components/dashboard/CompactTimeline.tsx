import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  getCurrentDayPhase, 
  calculateDayProgress, 
  getPhasePositions,
  formatCurrentTime,
  getScheduleTypeLabel,
  DayPhase 
} from '@/lib/timeHelpers';

interface CompactTimelineProps {
  /** Extra classes */
  className?: string;
}

export function CompactTimeline({ className }: CompactTimelineProps) {
  const [currentPhase, setCurrentPhase] = useState<DayPhase>(getCurrentDayPhase());
  const [progress, setProgress] = useState(calculateDayProgress());
  const [currentTime, setCurrentTime] = useState(formatCurrentTime());
  const [scheduleType, setScheduleType] = useState(getScheduleTypeLabel());
  
  // Update time-based values every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentPhase(getCurrentDayPhase());
      setProgress(calculateDayProgress());
      setCurrentTime(formatCurrentTime());
      setScheduleType(getScheduleTypeLabel());
    };
    
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);
  
  const phases = getPhasePositions();

  return (
    <Card className={cn("bg-card/50 border-border", className)}>
      <CardContent className="py-4">
        <div className="space-y-3">
          {/* Phase labels */}
          <div className="flex items-center justify-between text-sm">
            <span className={cn(
              "font-medium transition-colors",
              currentPhase === 'morning' ? "text-primary" : "text-muted-foreground"
            )}>
              Morning
            </span>
            <span className={cn(
              "font-medium transition-colors",
              currentPhase === 'afternoon' ? "text-primary" : "text-muted-foreground"
            )}>
              Afternoon
            </span>
            <span className={cn(
              "font-medium transition-colors",
              currentPhase === 'evening' ? "text-primary" : "text-muted-foreground"
            )}>
              Evening
            </span>
          </div>
          
          {/* Progress bar with phase markers */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            {/* Phase dividers */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-border/50 z-10"
              style={{ left: `${phases.morningEnd}%` }}
            />
            <div 
              className="absolute top-0 bottom-0 w-px bg-border/50 z-10"
              style={{ left: `${phases.afternoonEnd}%` }}
            />
            
            {/* Progress fill */}
            <div 
              className="absolute h-full bg-primary transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
            
            {/* Current position indicator */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm z-20 transition-all duration-1000"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          
          {/* Current time and schedule type */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{currentTime}</span>
            <span>•</span>
            <span>{scheduleType}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
