import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Playbook } from '@/types';
import { Clock, RotateCcw, Play, Flame, Trophy, Sparkles, Star, AlertCircle } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

interface RoutineTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbook: Playbook;
  onUpdatePlaybook: (playbook: Playbook) => void;
  onStartTimer?: (stepTitle: string, minutes: number) => void;
}

export function RoutineTemplate({
  open,
  onOpenChange,
  playbook,
  onUpdatePlaybook,
  onStartTimer
}: RoutineTemplateProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const completedSteps = playbook.steps.filter(s => s.completed).length;
  const essentialSteps = playbook.steps.filter(s => s.flexibility === 'essential');
  const completedEssential = essentialSteps.filter(s => s.completed).length;
  const totalSteps = playbook.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const totalTime = playbook.steps.reduce((sum, step) => sum + (step.estimatedMinutes || 0), 0);

  // Streak calculation
  const currentStreak = playbook.streakData?.currentStreak || 0;
  const longestStreak = playbook.streakData?.longestStreak || 0;

  // Auto-advance to next uncompleted step
  useEffect(() => {
    if (!showAllSteps) {
      const nextIncompleteIndex = playbook.steps.findIndex(s => !s.completed);
      if (nextIncompleteIndex !== -1) {
        setCurrentStepIndex(nextIncompleteIndex);
      }
    }
  }, [playbook.steps, showAllSteps]);

  const handleToggleStep = (stepId: string) => {
    const updatedSteps = playbook.steps.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );

    // Check if all essential steps are complete
    const allEssentialComplete = updatedSteps
      .filter(s => s.flexibility === 'essential')
      .every(s => s.completed);

    // Update streak if routine is completed
    let updatedStreakData = playbook.streakData;
    if (allEssentialComplete) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const lastCompleted = playbook.streakData?.lastCompletedDate;

      if (lastCompleted) {
        const daysSince = differenceInCalendarDays(new Date(today), parseISO(lastCompleted));

        if (daysSince === 1) {
          // Consecutive day - increment streak
          updatedStreakData = {
            currentStreak: (playbook.streakData?.currentStreak || 0) + 1,
            longestStreak: Math.max(
              (playbook.streakData?.longestStreak || 0),
              (playbook.streakData?.currentStreak || 0) + 1
            ),
            lastCompletedDate: today,
            completionHistory: [
              ...(playbook.streakData?.completionHistory || []),
              {
                date: today,
                completed: true,
                skippedOptional: updatedSteps.filter(s => s.flexibility === 'optional' && !s.completed).length
              }
            ]
          };
        } else if (daysSince > 1) {
          // Broke streak
          updatedStreakData = {
            currentStreak: 1,
            longestStreak: playbook.streakData?.longestStreak || 0,
            lastCompletedDate: today,
            completionHistory: [
              ...(playbook.streakData?.completionHistory || []),
              {
                date: today,
                completed: true,
                skippedOptional: updatedSteps.filter(s => s.flexibility === 'optional' && !s.completed).length
              }
            ]
          };
        }
        // If same day, don't update streak
      } else {
        // First completion
        updatedStreakData = {
          currentStreak: 1,
          longestStreak: 1,
          lastCompletedDate: today,
          completionHistory: [{
            date: today,
            completed: true,
            skippedOptional: updatedSteps.filter(s => s.flexibility === 'optional' && !s.completed).length
          }]
        };
      }
    }

    onUpdatePlaybook({
      ...playbook,
      steps: updatedSteps,
      streakData: updatedStreakData
    });
  };

  const handleReset = () => {
    const resetSteps = playbook.steps.map(step => ({ ...step, completed: false }));
    onUpdatePlaybook({ ...playbook, steps: resetSteps });
    setCurrentStepIndex(0);
  };

  const handleStartTimerForStep = (step: typeof playbook.steps[0]) => {
    if (onStartTimer && step.estimatedMinutes) {
      onStartTimer(step.title, step.estimatedMinutes);
      if (step.timerEnabled) {
        // Auto-mark as started
        handleToggleStep(step.id);
      }
    }
  };

  const currentStep = playbook.steps[currentStepIndex];
  const isLastStep = currentStepIndex === playbook.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const getFlexibilityBadge = (flexibility?: 'essential' | 'recommended' | 'optional') => {
    switch (flexibility) {
      case 'essential':
        return <Badge variant="destructive" className="text-xs"><Star className="h-3 w-3 mr-1" />Essential</Badge>;
      case 'recommended':
        return <Badge variant="secondary" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />Recommended</Badge>;
      case 'optional':
        return <Badge variant="outline" className="text-xs">Optional - Can Skip</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="pr-8 flex items-center justify-between">
            <span>{playbook.title}</span>
            <div className="flex items-center gap-2">
              {currentStreak > 0 && (
                <Badge variant="default" className="gap-1 bg-orange-500">
                  <Flame className="h-3 w-3" />
                  {currentStreak} day streak
                </Badge>
              )}
              {longestStreak > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  Best: {longestStreak}
                </Badge>
              )}
            </div>
          </DialogTitle>
          {playbook.description && (
            <p className="text-sm text-muted-foreground">{playbook.description}</p>
          )}
        </DialogHeader>

        {/* Progress Section */}
        <div className="space-y-2 bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Progress</span>
            <span className="text-muted-foreground">
              {completedSteps} of {totalSteps} steps ({completedEssential}/{essentialSteps.length} essential)
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Total time: {formatDuration(totalTime)}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAllSteps(!showAllSteps)}
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2"
              >
                {showAllSteps ? 'Focus Mode' : 'Show All'}
              </Button>
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Step-by-step view OR all steps */}
        {!showAllSteps && currentStep ? (
          <div className="space-y-4">
            {/* Current Step Card */}
            <div className={cn(
              "border-2 rounded-lg p-6 space-y-4",
              currentStep.completed ? "border-green-500/50 bg-green-500/5" : "border-primary"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={currentStep.completed}
                    onCheckedChange={() => handleToggleStep(currentStep.id)}
                    className="mt-1 border-border"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={cn(
                        "text-lg font-semibold",
                        currentStep.completed && "line-through text-muted-foreground"
                      )}>
                        Step {currentStepIndex + 1}: {currentStep.title}
                      </h3>
                      {getFlexibilityBadge(currentStep.flexibility)}
                    </div>

                    {currentStep.estimatedMinutes && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(currentStep.estimatedMinutes)}
                      </div>
                    )}

                    <p className="text-sm">{currentStep.description}</p>

                    {/* Habit Stacking */}
                    {currentStep.habitStack && (
                      <div className="bg-accent/10 rounded-lg p-3 text-sm space-y-1">
                        <div className="font-semibold text-accent flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Habit Stack
                        </div>
                        {currentStep.habitStack.before && (
                          <p className="text-xs">Before: {currentStep.habitStack.before}</p>
                        )}
                        {currentStep.habitStack.after && (
                          <p className="text-xs">After: {currentStep.habitStack.after}</p>
                        )}
                      </div>
                    )}

                    {currentStep.tips && currentStep.tips.length > 0 && (
                      <div className="bg-blue-500/10 rounded-lg p-3 space-y-2">
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">💡 Tips:</div>
                        <ul className="text-xs space-y-1">
                          {currentStep.tips.map((tip, i) => (
                            <li key={i} className="flex gap-2">
                              <span>•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timer button */}
              {onStartTimer && currentStep.estimatedMinutes && !currentStep.completed && (
                <Button
                  onClick={() => handleStartTimerForStep(currentStep)}
                  variant="default"
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Timer for This Step
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                variant="outline"
                disabled={isFirstStep}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentStepIndex + 1} / {totalSteps}
              </span>
              <Button
                onClick={() => setCurrentStepIndex(Math.min(totalSteps - 1, currentStepIndex + 1))}
                variant="outline"
                disabled={isLastStep}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          /* All Steps View */
          <div className="space-y-2">
            {playbook.steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "border rounded-lg p-4",
                  step.completed ? "bg-muted/30 border-muted" : "bg-card border-border"
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={step.completed}
                    onCheckedChange={() => handleToggleStep(step.id)}
                    className="mt-1 border-border"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "font-medium text-sm",
                        step.completed && "line-through text-muted-foreground"
                      )}>
                        {index + 1}. {step.title}
                      </span>
                      {getFlexibilityBadge(step.flexibility)}
                      {step.estimatedMinutes && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(step.estimatedMinutes)}
                        </span>
                      )}
                    </div>

                    {step.habitStack && (
                      <div className="text-xs text-muted-foreground">
                        {step.habitStack.before && <span>Before: {step.habitStack.before} • </span>}
                        {step.habitStack.after && <span>After: {step.habitStack.after}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
