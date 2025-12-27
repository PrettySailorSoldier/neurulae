import { useState, useEffect } from 'react';
import { Pause, Play, SkipForward, X, RotateCcw, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { ScheduledRoutine, RoutineStep } from '@/types';

interface RoutinePauseScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine: ScheduledRoutine;
  currentStep: RoutineStep;
  currentStepIndex: number;
  elapsedOnStep: number;
  onResume: () => void;
  onResumeNextStep: () => void;
  onExit: () => void;
  onRestart: () => void;
  progress: {
    completedSteps: number;
    totalSteps: number;
    percentComplete: number;
  };
}

export function RoutinePauseScreen({
  open,
  onOpenChange,
  routine,
  currentStep,
  currentStepIndex,
  elapsedOnStep,
  onResume,
  onResumeNextStep,
  onExit,
  onRestart,
  progress,
}: RoutinePauseScreenProps) {
  const [pauseDuration, setPauseDuration] = useState(0);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  // Track how long we've been paused
  useEffect(() => {
    if (open) {
      setPauseDuration(0);
      const interval = setInterval(() => {
        setPauseDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [open]);

  // Show reminder after 5 minutes
  useEffect(() => {
    if (pauseDuration === 300) {
      setShowReminder(true);
    }
  }, [pauseDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatPauseDuration = () => {
    if (pauseDuration < 60) return `${pauseDuration}s`;
    const mins = Math.floor(pauseDuration / 60);
    const secs = pauseDuration % 60;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const hasNextStep = currentStepIndex < routine.steps.length - 1;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onResume(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5" />
              Routine Paused
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Pause duration */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Paused for</p>
              <p className="text-3xl font-mono font-bold text-primary">
                {formatPauseDuration()}
              </p>
            </div>

            {/* Reminder message */}
            {showReminder && (
              <div className="p-3 bg-primary/10 rounded-lg text-center">
                <p className="text-sm font-medium">Still there?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ready to continue when you are!
                </p>
              </div>
            )}

            {/* Current step info */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Currently on</span>
                <span className="text-sm font-medium">
                  Step {currentStepIndex + 1} of {routine.steps.length}
                </span>
              </div>

              <div>
                <h3 className="font-medium">{currentStep.name}</h3>
                {currentStep.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{currentStep.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTime(elapsedOnStep)} elapsed on this step</span>
              </div>
            </div>

            {/* Overall progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall progress</span>
                <span>{progress.percentComplete}%</span>
              </div>
              <Progress value={progress.percentComplete} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {progress.completedSteps} of {progress.totalSteps} steps completed
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2">
            {/* Primary action - Resume */}
            <Button onClick={onResume} className="w-full gap-2">
              <Play className="h-4 w-4" />
              Resume
            </Button>

            {/* Secondary actions */}
            <div className="flex gap-2 w-full">
              {hasNextStep && (
                <Button
                  variant="outline"
                  onClick={onResumeNextStep}
                  className="flex-1 gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Resume at Next Step
                </Button>
              )}

              <Button
                variant="outline"
                onClick={onExit}
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4" />
                Exit Routine
              </Button>
            </div>

            {/* Restart option */}
            <Button
              variant="ghost"
              onClick={() => setShowRestartConfirm(true)}
              className="w-full gap-2 text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Restart Routine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restart confirmation */}
      <AlertDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart Routine?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all your progress and start the routine from the beginning.
              Your completed steps will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowRestartConfirm(false);
                onRestart();
              }}
            >
              Restart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
