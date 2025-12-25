import { TrendingUp, TrendingDown, Check, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EstimationComparisonCardProps {
  taskTitle: string;
  estimatedMinutes: number | null;
  actualMinutes: number;
  onDismiss: () => void;
  onStartNext?: () => void;
  nextTaskTitle?: string;
}

export function EstimationComparisonCard({
  taskTitle,
  estimatedMinutes,
  actualMinutes,
  onDismiss,
  onStartNext,
  nextTaskTitle,
}: EstimationComparisonCardProps) {
  const hasEstimate = estimatedMinutes !== null && estimatedMinutes > 0;
  const difference = hasEstimate ? actualMinutes - estimatedMinutes : 0;
  const isOver = difference > 0;
  const isUnder = difference < 0;
  const isAccurate = difference === 0;

  const formatDifference = (diff: number) => {
    const absMinutes = Math.abs(diff);
    if (absMinutes >= 60) {
      const hours = Math.floor(absMinutes / 60);
      const mins = absMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${absMinutes}m`;
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className="border-2 border-primary/30 bg-card/95 backdrop-blur-sm shadow-lg animate-in slide-in-from-bottom-4 duration-300">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="font-semibold truncate max-w-[200px]">{taskTitle}</p>
          </div>
        </div>

        {/* Time comparison */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Estimated</p>
            <p className="text-xl font-bold tabular-nums">
              {hasEstimate ? formatTime(estimatedMinutes) : '—'}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Actual</p>
            <p className="text-xl font-bold tabular-nums">{formatTime(actualMinutes)}</p>
          </div>
        </div>

        {/* Difference indicator */}
        {hasEstimate && (
          <div
            className={cn(
              'flex items-center justify-center gap-2 py-2 px-3 rounded-lg',
              isOver && 'bg-primary/10 text-primary',
              isUnder && 'bg-green-500/10 text-green-500',
              isAccurate && 'bg-accent/10 text-accent-foreground'
            )}
          >
            {isOver && <TrendingUp className="h-4 w-4" />}
            {isUnder && <TrendingDown className="h-4 w-4" />}
            {isAccurate && <Check className="h-4 w-4" />}
            <span className="font-medium">
              {isAccurate && 'Perfect estimation!'}
              {isOver && `+${formatDifference(difference)} over`}
              {isUnder && `${formatDifference(difference)} under`}
            </span>
          </div>
        )}

        {!hasEstimate && (
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-muted/30 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">No estimate set - consider adding one next time!</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDismiss} className="flex-1">
            Dismiss
          </Button>
          {onStartNext && nextTaskTitle && (
            <Button onClick={onStartNext} className="flex-1">
              Start: {nextTaskTitle.length > 15 ? nextTaskTitle.slice(0, 15) + '...' : nextTaskTitle}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
