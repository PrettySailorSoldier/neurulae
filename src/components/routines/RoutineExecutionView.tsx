import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Check,
  X,
  Clock,
  ChevronRight,
  Plus,
  Maximize2,
  Minimize2,
  List,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RoutineStep, ScheduledRoutine, Routine } from '@/types';
import { useActiveRoutine } from '@/hooks/useActiveRoutine';
import { cn } from '@/lib/utils';

interface RoutineExecutionViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: Routine | ScheduledRoutine;
  onComplete?: (routine: ScheduledRoutine) => void;
}

export function RoutineExecutionView({
  open,
  onOpenChange,
  routine,
  onComplete,
}: RoutineExecutionViewProps) {
  const {
    activeRoutine,
    currentStep,
    currentStepIndex,
    isRunning,
    isPaused,
    elapsedSeconds,
    startRoutine,
    completeStep,
    skipStep,
    extendStep,
    pause,
    resume,
    exitRoutine,
    progress,
  } = useActiveRoutine();

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showStepsList, setShowStepsList] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);

  // Start routine when provided
  useEffect(() => {
    if (open && routine && !activeRoutine) {
      startRoutine(routine);
    }
  }, [open, routine, activeRoutine, startRoutine]);

  // Handle auto-advance
  useEffect(() => {
    if (!activeRoutine || !currentStep) return;

    const stepDurationSeconds = (currentStep.estimatedMinutes || 5) * 60;
    const isStepOvertime = elapsedSeconds >= stepDurationSeconds;

    if (isStepOvertime && activeRoutine && 'autoAdvance' in activeRoutine) {
      // Auto-advance logic would check routine settings
      // For now, we just show the overtime state
    }
  }, [elapsedSeconds, currentStep, activeRoutine]);

  const handleExit = useCallback(() => {
    exitRoutine(true);
    onOpenChange(false);
    if (activeRoutine && onComplete) {
      onComplete(activeRoutine);
    }
  }, [exitRoutine, onOpenChange, activeRoutine, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getStepTimeColor = () => {
    if (!currentStep) return 'text-primary';
    const stepDurationSeconds = (currentStep.estimatedMinutes || 5) * 60;
    const percentComplete = (elapsedSeconds / stepDurationSeconds) * 100;

    if (percentComplete < 50) return 'text-green-500';
    if (percentComplete < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStepProgress = () => {
    if (!currentStep) return 0;
    const stepDurationSeconds = (currentStep.estimatedMinutes || 5) * 60;
    return Math.min((elapsedSeconds / stepDurationSeconds) * 100, 100);
  };

  const nextStep = activeRoutine?.steps[currentStepIndex + 1];

  if (!activeRoutine || !currentStep) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => v ? onOpenChange(v) : setShowExitConfirm(true)}>
        <DialogContent
          className={cn(
            'p-0 gap-0 overflow-hidden',
            isFocusMode ? 'max-w-full h-screen' : 'max-w-2xl'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/50">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                Step {currentStepIndex + 1} of {activeRoutine.steps.length}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {progress.percentComplete}% complete
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStepsList(!showStepsList)}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFocusMode(!isFocusMode)}
              >
                {isFocusMode ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExitConfirm(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-1 min-h-[400px]">
            {/* Steps sidebar */}
            {showStepsList && (
              <div className="w-64 border-r bg-muted/30">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {activeRoutine.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded text-sm',
                          idx === currentStepIndex && 'bg-primary/10 font-medium',
                          step.status === 'completed' && 'text-green-600',
                          step.status === 'skipped' && 'text-muted-foreground line-through'
                        )}
                      >
                        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                          {step.status === 'completed' ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : step.status === 'skipped' ? (
                            <SkipForward className="h-3 w-3" />
                          ) : idx === currentStepIndex ? (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          ) : (
                            <span className="text-xs text-muted-foreground">{idx + 1}</span>
                          )}
                        </div>
                        <span className="flex-1 truncate">{step.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {step.estimatedMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Main step display */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              {/* Timer circle */}
              <div className="relative w-48 h-48 mb-6">
                {/* Background circle */}
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={553}
                    strokeDashoffset={553 - (553 * getStepProgress()) / 100}
                    strokeLinecap="round"
                    className={cn('transition-all duration-1000', getStepTimeColor())}
                  />
                </svg>

                {/* Time display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn('text-4xl font-mono font-bold', getStepTimeColor())}>
                    {formatTime(elapsedSeconds)}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    / {currentStep.estimatedMinutes}:00
                  </span>
                </div>
              </div>

              {/* Current step name */}
              <h2 className="text-2xl font-semibold text-center mb-2">
                {currentStep.name}
              </h2>

              {/* Step notes */}
              {currentStep.notes && (
                <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                  {currentStep.notes}
                </p>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3">
                {isPaused ? (
                  <Button onClick={resume} size="lg" className="gap-2">
                    <Play className="h-5 w-5" />
                    Resume
                  </Button>
                ) : (
                  <Button onClick={pause} variant="outline" size="lg" className="gap-2">
                    <Pause className="h-5 w-5" />
                    Pause
                  </Button>
                )}

                <Button onClick={completeStep} size="lg" className="gap-2">
                  <Check className="h-5 w-5" />
                  Done
                </Button>

                <Button
                  onClick={skipStep}
                  variant="ghost"
                  size="lg"
                  className="gap-2"
                >
                  <SkipForward className="h-5 w-5" />
                  Skip
                </Button>

                <Button
                  onClick={() => extendStep(5)}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Next step preview */}
              {nextStep && (
                <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Up next:</span>
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-medium">{nextStep.name}</span>
                  <span>({nextStep.estimatedMinutes}m)</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="p-4 border-t bg-muted/30">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">
                {progress.completedSteps} of {progress.totalSteps} steps completed
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                ~{progress.estimatedTimeRemaining} min remaining
              </span>
            </div>
            <Progress value={progress.percentComplete} className="h-2" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit confirmation */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Routine?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved. You can resume this routine later or view it in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Routine</AlertDialogCancel>
            <AlertDialogAction onClick={handleExit}>
              Exit & Save Progress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
