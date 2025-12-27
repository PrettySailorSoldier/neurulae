import { useMemo } from 'react';
import { Check, Clock, ChevronDown, ChevronUp, SkipForward, AlertTriangle, PartyPopper } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScheduledRoutine } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface RoutineCompletionSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine: ScheduledRoutine;
  onDone: () => void;
  onAddNotes?: (notes: string) => void;
  onAdjustEstimates?: () => void;
}

const CELEBRATION_MESSAGES = [
  "You crushed it! Great work staying focused.",
  "Another routine in the books. You're building great habits!",
  "Consistency is key, and you just unlocked it!",
  "That's how it's done! Way to follow through.",
  "Your future self is thanking you right now.",
  "Small steps, big progress. Keep it up!",
  "You showed up for yourself today. That matters.",
  "Done is better than perfect, and you did it!",
];

export function RoutineCompletionSummary({
  open,
  onOpenChange,
  routine,
  onDone,
  onAddNotes,
  onAdjustEstimates,
}: RoutineCompletionSummaryProps) {
  const [showStepBreakdown, setShowStepBreakdown] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const stats = useMemo(() => {
    const completedSteps = routine.steps.filter(s => s.status === 'completed');
    const skippedSteps = routine.steps.filter(s => s.status === 'skipped');

    const estimatedTotal = routine.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
    const actualTotal = routine.totalActualMinutes ||
      routine.steps.reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

    const difference = actualTotal - estimatedTotal;
    const differencePercent = Math.abs(Math.round((difference / estimatedTotal) * 100));

    return {
      completedCount: completedSteps.length,
      skippedCount: skippedSteps.length,
      totalCount: routine.steps.length,
      estimatedTotal,
      actualTotal,
      difference,
      differencePercent,
      stepsOverTime: routine.steps.filter(s =>
        s.status === 'completed' &&
        s.actualMinutes &&
        s.actualMinutes > s.estimatedMinutes * 1.2
      ),
    };
  }, [routine]);

  const celebrationMessage = useMemo(() => {
    return CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
  }, []);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDifferenceColor = () => {
    if (stats.difference <= 0) return 'text-green-600';
    if (stats.differencePercent <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifferenceLabel = () => {
    if (stats.difference === 0) return 'Right on time!';
    if (stats.difference < 0) return `${Math.abs(stats.difference)} min under`;
    return `${stats.difference} min over`;
  };

  const handleSaveNotes = () => {
    if (onAddNotes && notes.trim()) {
      onAddNotes(notes.trim());
    }
    setShowNotesInput(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <PartyPopper className="h-6 w-6 text-primary" />
            Routine Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Celebration message */}
          <p className="text-center text-muted-foreground italic">
            "{celebrationMessage}"
          </p>

          {/* Time summary */}
          <div className="grid grid-cols-3 gap-4 text-center p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Estimated</p>
              <p className="text-lg font-semibold">{formatDuration(stats.estimatedTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Actual</p>
              <p className="text-lg font-semibold">{formatDuration(stats.actualTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Difference</p>
              <p className={cn('text-lg font-semibold', getDifferenceColor())}>
                {getDifferenceLabel()}
              </p>
            </div>
          </div>

          {/* Steps summary */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                {stats.completedCount} completed
              </span>
            </div>
            {stats.skippedCount > 0 && (
              <div className="flex items-center gap-2">
                <SkipForward className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {stats.skippedCount} skipped
                </span>
              </div>
            )}
          </div>

          {/* Step breakdown */}
          <Collapsible open={showStepBreakdown} onOpenChange={setShowStepBreakdown}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                Step Breakdown
                {showStepBreakdown ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {routine.steps.map((step, idx) => {
                const overTime = step.actualMinutes && step.actualMinutes > step.estimatedMinutes * 1.2;

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded text-sm',
                      step.status === 'skipped' && 'opacity-50'
                    )}
                  >
                    {step.status === 'completed' ? (
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <SkipForward className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={cn('flex-1', step.status === 'skipped' && 'line-through')}>
                      {step.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {step.estimatedMinutes}m
                      </span>
                      {step.status === 'completed' && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span className={cn(overTime && 'text-yellow-600 font-medium')}>
                            {step.actualMinutes || 0}m
                          </span>
                          {overTime && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* Insights */}
          {stats.stepsOverTime.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg text-sm">
              <p className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                Time Insight
              </p>
              <p className="text-yellow-600 dark:text-yellow-500">
                {stats.stepsOverTime.length === 1 ? (
                  <>"{stats.stepsOverTime[0].name}" took longer than expected.</>
                ) : (
                  <>{stats.stepsOverTime.length} steps took longer than expected.</>
                )}
                {' '}Consider adjusting estimates.
              </p>
            </div>
          )}

          {/* Notes input */}
          {showNotesInput ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did this routine go? Any thoughts to capture?"
                className="h-24"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowNotesInput(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowNotesInput(true)}
            >
              Add Notes
            </Button>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onAdjustEstimates && stats.stepsOverTime.length > 0 && (
            <Button variant="outline" onClick={onAdjustEstimates}>
              Adjust Estimates
            </Button>
          )}
          <Button onClick={onDone} className="gap-2">
            <Check className="h-4 w-4" />
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
