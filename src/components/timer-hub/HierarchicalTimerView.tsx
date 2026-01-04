import { useMemo } from 'react';
import { HierarchicalInterval, IntervalStep } from '@/types';
import { Button } from '@/components/ui/button';
import { CircularTimer } from '@/components/CircularTimer';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  SkipForward,
  Square,
  PlusCircle,
  CheckCircle,
  Check,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HierarchicalTimerViewProps {
  interval: HierarchicalInterval;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkipStep: () => void;
  onAddTime: (seconds: number) => void;
  onCompleteEarly: () => void;
}

export function HierarchicalTimerView({
  interval,
  timeRemaining,
  isRunning,
  isPaused,
  onPause,
  onResume,
  onStop,
  onSkipStep,
  onAddTime,
  onCompleteEarly,
}: HierarchicalTimerViewProps) {
  const currentStep = interval.steps[interval.currentStepIndex];
  const completedSteps = interval.steps.filter(s => s.isComplete).length;
  const totalSteps = interval.steps.length;

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (interval.totalDuration === 0) return 0;
    return Math.round((interval.elapsedDuration / interval.totalDuration) * 100);
  }, [interval.elapsedDuration, interval.totalDuration]);

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatStepDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) {
      return `${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m`;
    }
    return `${secs}s`;
  };

  const handleToggle = () => {
    if (isRunning && !isPaused) {
      onPause();
    } else {
      onResume();
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Timer Display */}
      <div className="border-2 rounded-xl p-6 text-center bg-gradient-to-br from-primary/10 to-card border-primary/30 transition-all">
        {/* Parent Interval Name */}
        <div className="text-sm text-muted-foreground mb-1">
          {interval.name}
        </div>

        {/* Current Step Name */}
        <div className="text-lg font-semibold text-primary mb-4 flex items-center justify-center gap-2">
          {currentStep && (
            <>
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: currentStep.color || 'hsl(var(--primary))' }}
              />
              <span className="truncate max-w-xs">{currentStep.name}</span>
            </>
          )}
        </div>

        {/* Circular Timer */}
        <div className="flex justify-center mb-4">
          <CircularTimer
            timeRemaining={timeRemaining}
            totalTime={currentStep?.duration || 0}
            size="xl"
            isPaused={isPaused || !isRunning}
          />
        </div>

        {/* Step Progress Text */}
        <div className="text-muted-foreground font-medium mb-4">
          Step {interval.currentStepIndex + 1} of {totalSteps}
        </div>

        {/* Overall Progress Bar */}
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{formatDuration(interval.elapsedDuration)} elapsed</span>
            <span>{formatDuration(interval.totalDuration - interval.elapsedDuration)} remaining</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button
          onClick={handleToggle}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isRunning && !isPaused ? (
            <>
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Resume
            </>
          )}
        </Button>

        <Button
          onClick={() => onAddTime(60)}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          +1 min
        </Button>

        <Button
          onClick={onCompleteEarly}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Done Early
        </Button>

        <Button
          onClick={onSkipStep}
          variant="outline"
          size="lg"
          disabled={interval.currentStepIndex >= interval.steps.length - 1}
        >
          <SkipForward className="h-5 w-5 mr-2" />
          Skip Step
        </Button>

        <Button
          onClick={onStop}
          variant="destructive"
          size="lg"
        >
          <Square className="h-5 w-5 mr-2" />
          Stop All
        </Button>
      </div>

      {/* Steps Progress List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Steps Progress
        </h4>

        <div className="space-y-1">
          {interval.steps.map((step, index) => {
            const isCompleted = step.isComplete;
            const isCurrent = index === interval.currentStepIndex;
            const isUpcoming = index > interval.currentStepIndex;

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  isCompleted
                    ? 'bg-muted/30 border-muted/50'
                    : isCurrent
                    ? 'bg-primary/20 border-primary shadow-md ring-1 ring-primary/30'
                    : 'bg-card/50 border-border/50'
                )}
              >
                {/* Step Status Indicator */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold transition-all',
                    isCompleted
                      ? 'bg-green-500/20 text-green-500'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground animate-pulse'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Connector line (except for last item) */}
                {index < interval.steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[26px] top-[52px] w-0.5 h-4',
                      isCompleted ? 'bg-green-500/50' : 'bg-border'
                    )}
                    style={{ display: 'none' }} // Hidden for now, can be enabled with relative positioning
                  />
                )}

                {/* Color dot */}
                <div
                  className={cn(
                    'w-3 h-3 rounded-full shrink-0',
                    isCompleted && 'opacity-50'
                  )}
                  style={{ backgroundColor: step.color || 'hsl(var(--primary))' }}
                />

                {/* Step Name */}
                <div className={cn(
                  'flex-1 min-w-0',
                  isCompleted && 'line-through opacity-60'
                )}>
                  <span className="font-medium truncate block">{step.name}</span>
                </div>

                {/* Duration */}
                <div className={cn(
                  'flex items-center gap-1 text-sm shrink-0',
                  isCompleted
                    ? 'text-muted-foreground/60'
                    : isCurrent
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                )}>
                  <Clock className="h-3 w-3" />
                  <span>{formatStepDuration(step.duration)}</span>
                </div>

                {/* Current Step Indicator */}
                {isCurrent && (
                  <div className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                    Current
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Completion summary component shown when all steps are done
interface CompletionSummaryProps {
  interval: HierarchicalInterval;
  actualMinutes: number;
  onDismiss: () => void;
  onRestart?: () => void;
}

export function HierarchicalCompletionSummary({
  interval,
  actualMinutes,
  onDismiss,
  onRestart,
}: CompletionSummaryProps) {
  const estimatedMinutes = Math.round(interval.totalDuration / 60);
  const difference = actualMinutes - estimatedMinutes;
  const percentDiff = estimatedMinutes > 0
    ? Math.round((difference / estimatedMinutes) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-xl animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold">Interval Complete!</h2>
          <p className="text-muted-foreground mt-1">{interval.name}</p>
        </div>

        {/* Time Summary */}
        <div className="bg-muted/30 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Estimated:</span>
            <span className="font-semibold">{estimatedMinutes} min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Actual:</span>
            <span className="font-semibold text-primary">{actualMinutes} min</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="text-muted-foreground">Difference:</span>
            <span className={cn(
              'font-semibold',
              difference > 0 ? 'text-yellow-500' : difference < 0 ? 'text-green-500' : 'text-muted-foreground'
            )}>
              {difference > 0 ? '+' : ''}{difference} min ({percentDiff > 0 ? '+' : ''}{percentDiff}%)
            </span>
          </div>
        </div>

        {/* Steps Breakdown */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Steps Completed:</h4>
          <div className="space-y-1">
            {interval.steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 text-sm">
                <Check className="h-3 w-3 text-green-500" />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: step.color || 'hsl(var(--primary))' }}
                />
                <span className="flex-1 truncate">{step.name}</span>
                <span className="text-muted-foreground">
                  {Math.floor(step.duration / 60)}m
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={onDismiss} variant="outline" className="flex-1">
            Done
          </Button>
          {onRestart && (
            <Button onClick={onRestart} className="flex-1">
              Restart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
