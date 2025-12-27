import { useState } from 'react';
import { Play, Pause, SkipForward, X, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Routine, ScheduledRoutine, RoutineStep } from '@/types';
import { cn } from '@/lib/utils';

interface ActiveRoutineBannerProps {
  routine: Routine;
  scheduledRoutine?: ScheduledRoutine;
  currentStep: RoutineStep | null;
  currentStepIndex: number;
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  progress: {
    completedSteps: number;
    skippedSteps: number;
    totalSteps: number;
    percentComplete: number;
    estimatedTimeRemaining: number;
  };
  onResume: () => void;
  onPause: () => void;
  onCompleteStep: () => void;
  onSkipStep: () => void;
  onExit: () => void;
  onExpand: () => void;
}

export function ActiveRoutineBanner({
  routine,
  currentStep,
  currentStepIndex,
  isRunning,
  isPaused,
  elapsedSeconds,
  progress,
  onResume,
  onPause,
  onCompleteStep,
  onSkipStep,
  onExit,
  onExpand,
}: ActiveRoutineBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const stepTimeTarget = currentStep ? currentStep.estimatedMinutes * 60 : 0;
  const stepElapsed = elapsedSeconds;
  const isOvertime = stepElapsed > stepTimeTarget && stepTimeTarget > 0;
  const stepProgress = stepTimeTarget > 0 ? Math.min((stepElapsed / stepTimeTarget) * 100, 100) : 0;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg transition-all duration-300",
        isPaused
          ? "bg-yellow-50 dark:bg-yellow-950/50 border-yellow-300 dark:border-yellow-700"
          : "bg-background border-border"
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Main Banner Row */}
        <div className="px-4 py-2 flex items-center gap-3">
          {/* Routine Icon & Name */}
          <button
            onClick={onExpand}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-xl">{routine.icon || '📋'}</span>
            <div className="text-left">
              <p className="font-medium text-sm leading-tight">{routine.name}</p>
              <p className="text-xs text-muted-foreground">
                Step {currentStepIndex + 1}/{progress.totalSteps}
              </p>
            </div>
          </button>

          {/* Current Step */}
          {currentStep && (
            <div className="flex-1 min-w-0 mx-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{currentStep.name}</span>
                {isOvertime && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    Overtime
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress
                  value={stepProgress}
                  className={cn(
                    "h-1.5 flex-1",
                    isOvertime && "[&>div]:bg-red-500"
                  )}
                />
                <span className={cn(
                  "text-xs font-mono min-w-[50px] text-right",
                  isOvertime && "text-red-500"
                )}>
                  {formatTime(stepElapsed)}
                </span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-1">
            {isPaused ? (
              <Button size="sm" onClick={onResume} className="gap-1">
                <Play className="h-3 w-3" />
                Resume
              </Button>
            ) : (
              <>
                <Button size="icon" variant="ghost" onClick={onPause} className="h-8 w-8">
                  <Pause className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={onCompleteStep} className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Done
                </Button>
                {routine.allowSkipping && (
                  <Button size="icon" variant="ghost" onClick={onSkipStep} className="h-8 w-8">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}

            <CollapsibleTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <Button size="icon" variant="ghost" onClick={onExit} className="h-8 w-8 text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded View */}
        <CollapsibleContent>
          <div className="px-4 pb-3 pt-1 border-t">
            {/* Progress Overview */}
            <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {progress.completedSteps} done
              </span>
              {progress.skippedSteps > 0 && (
                <span>{progress.skippedSteps} skipped</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~{formatDuration(progress.estimatedTimeRemaining)} left
              </span>
              <Progress value={progress.percentComplete} className="flex-1 h-1.5" />
              <span>{Math.round(progress.percentComplete)}%</span>
            </div>

            {/* Step List */}
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {routine.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 text-sm p-1.5 rounded",
                    idx === currentStepIndex && "bg-primary/10 font-medium",
                    step.status === 'completed' && "text-muted-foreground",
                    step.status === 'skipped' && "text-muted-foreground line-through"
                  )}
                >
                  <span className="w-5 text-center text-xs">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : step.status === 'skipped' ? (
                      <SkipForward className="h-3 w-3" />
                    ) : idx === currentStepIndex ? (
                      <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                    ) : (
                      <span className="text-muted-foreground">{idx + 1}</span>
                    )}
                  </span>
                  <span className="flex-1 truncate">{step.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {step.actualMinutes !== undefined
                      ? `${step.actualMinutes}m`
                      : `~${step.estimatedMinutes}m`
                    }
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={onExpand} className="text-xs">
                Open Full View
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
