import { useMemo } from 'react';
import { Clock, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RoutineStep, Routine } from '@/types';
import { cn } from '@/lib/utils';

interface DurationSummaryProps {
  steps: Omit<RoutineStep, 'status' | 'actualMinutes'>[];
  anchorType: Routine['anchorType'];
  anchorTime?: string;
}

export function DurationSummary({ steps, anchorType, anchorTime }: DurationSummaryProps) {
  const { totalMinutes, warnings, longSteps } = useMemo(() => {
    const total = steps.reduce((sum, step) => sum + (step.estimatedMinutes || 0), 0);
    const warnings: string[] = [];
    const longSteps: string[] = [];

    if (total > 180) {
      warnings.push('This routine is over 3 hours. Consider breaking it into smaller blocks.');
    }

    steps.forEach(step => {
      if (step.estimatedMinutes > 60) {
        longSteps.push(step.name || `Step ${step.order + 1}`);
      }
    });

    return { totalMinutes: total, warnings, longSteps };
  }, [steps]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
  };

  const calculateEndTime = () => {
    if (!anchorTime) return null;
    const [hours, minutes] = anchorTime.split(':').map(Number);
    const totalMins = hours * 60 + minutes + totalMinutes;
    const endHours = Math.floor(totalMins / 60) % 24;
    const endMins = totalMins % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  };

  const calculateStartTime = () => {
    if (!anchorTime) return null;
    const [hours, minutes] = anchorTime.split(':').map(Number);
    const totalMins = hours * 60 + minutes - totalMinutes;
    const startHours = Math.floor((totalMins + 1440) / 60) % 24;
    const startMins = ((totalMins % 60) + 60) % 60;
    return `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}`;
  };

  const formatTimeDisplay = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
  };

  const endTime = calculateEndTime();
  const startTime = calculateStartTime();

  // Check if calculated start time is in the past
  const isStartTimeInPast = useMemo(() => {
    if (anchorType !== 'end_by' || !startTime) return false;
    const now = new Date();
    const [hours, mins] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, mins, 0, 0);
    return startDate < now;
  }, [anchorType, startTime]);

  // Generate step proportion bar data
  const stepBarData = useMemo(() => {
    if (totalMinutes === 0) return [];
    return steps.map((step, idx) => ({
      name: step.name || `Step ${idx + 1}`,
      duration: step.estimatedMinutes || 0,
      percentage: ((step.estimatedMinutes || 0) / totalMinutes) * 100,
      color: getStepColor(idx),
    }));
  }, [steps, totalMinutes]);

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      {/* Summary stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatDuration(totalMinutes)}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {steps.length} step{steps.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Time display based on anchor type */}
        {anchorType === 'fixed_start' && anchorTime && endTime && (
          <div className="text-sm text-muted-foreground">
            {formatTimeDisplay(anchorTime)} → {formatTimeDisplay(endTime)}
          </div>
        )}

        {anchorType === 'end_by' && anchorTime && startTime && (
          <div className={cn(
            'text-sm',
            isStartTimeInPast ? 'text-yellow-600' : 'text-muted-foreground'
          )}>
            Start by {formatTimeDisplay(startTime)} → {formatTimeDisplay(anchorTime)}
          </div>
        )}
      </div>

      {/* Time calculation message */}
      {anchorType === 'fixed_start' && anchorTime && endTime && (
        <p className="text-sm text-muted-foreground">
          If you start at {formatTimeDisplay(anchorTime)}, you'll finish by {formatTimeDisplay(endTime)}
        </p>
      )}

      {anchorType === 'end_by' && anchorTime && startTime && (
        <p className={cn(
          'text-sm',
          isStartTimeInPast ? 'text-yellow-600' : 'text-muted-foreground'
        )}>
          To finish by {formatTimeDisplay(anchorTime)}, start by {formatTimeDisplay(startTime)}
          {isStartTimeInPast && (
            <span className="block text-xs mt-1">
              (This start time has already passed today)
            </span>
          )}
        </p>
      )}

      {/* Visual duration bar */}
      {steps.length > 0 && totalMinutes > 0 && (
        <TooltipProvider>
          <div className="h-4 rounded-full overflow-hidden flex">
            {stepBarData.map((step, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div
                    className="h-full transition-all hover:opacity-80 cursor-pointer"
                    style={{
                      width: `${step.percentage}%`,
                      backgroundColor: step.color,
                      minWidth: step.percentage > 0 ? '4px' : '0',
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{step.name}</p>
                  <p className="text-xs text-muted-foreground">{step.duration} min</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((warning, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-yellow-600">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Long steps suggestion */}
      {longSteps.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-blue-600">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            {longSteps.length === 1 ? (
              <>Step "{longSteps[0]}" is over an hour. Consider breaking it into smaller steps.</>
            ) : (
              <>
                {longSteps.length} steps are over an hour ({longSteps.slice(0, 2).join(', ')}
                {longSteps.length > 2 && `, +${longSteps.length - 2} more`}).
                Consider breaking them into smaller steps.
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// Generate a color for each step based on its index
function getStepColor(index: number): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
    '#6366F1', // indigo
    '#84CC16', // lime
  ];
  return colors[index % colors.length];
}
