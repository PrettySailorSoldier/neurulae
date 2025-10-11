import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Playbook } from '@/types';
import { Clock, RotateCcw, Link2, Play } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';

interface PlaybookViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbook: Playbook;
  onUpdatePlaybook: (playbook: Playbook) => void;
  onStartTimer?: (stepTitle: string, minutes: number) => void;
}

export function PlaybookViewer({ open, onOpenChange, playbook, onUpdatePlaybook, onStartTimer }: PlaybookViewerProps) {
  const [openSteps, setOpenSteps] = useState<string[]>([]);

  const completedSteps = playbook.steps.filter(s => s.completed).length;
  const totalSteps = playbook.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const totalTime = playbook.steps.reduce((sum, step) => sum + (step.estimatedMinutes || 0), 0);

  const handleToggleStep = (stepId: string) => {
    const updatedSteps = playbook.steps.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );
    onUpdatePlaybook({ ...playbook, steps: updatedSteps });
  };

  const handleReset = () => {
    const resetSteps = playbook.steps.map(step => ({ ...step, completed: false }));
    onUpdatePlaybook({ ...playbook, steps: resetSteps });
  };

  const handleStartTimerForStep = (step: typeof playbook.steps[0]) => {
    if (onStartTimer && step.estimatedMinutes) {
      onStartTimer(step.title, step.estimatedMinutes);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="pr-8">{playbook.title}</DialogTitle>
          {playbook.description && (
            <p className="text-sm text-muted-foreground">{playbook.description}</p>
          )}
        </DialogHeader>

        {/* Progress Section */}
        <div className="space-y-2 bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Progress</span>
            <span className="text-muted-foreground">
              {completedSteps} of {totalSteps} steps
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Total time: {formatDuration(totalTime)}
            </div>
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

        {/* Steps */}
        <Accordion
          type="multiple"
          value={openSteps}
          onValueChange={setOpenSteps}
          className="space-y-2"
        >
          {playbook.steps.map((step, index) => (
            <AccordionItem
              key={step.id}
              value={step.id}
              className={`border border-border rounded-lg overflow-hidden ${
                step.completed ? 'bg-muted/30' : 'bg-card'
              }`}
            >
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={step.completed}
                    onCheckedChange={() => handleToggleStep(step.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="border-border"
                  />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                      Step {index + 1}: {step.title}
                    </div>
                    {step.estimatedMinutes && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(step.estimatedMinutes)}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  <p className="text-sm">{step.description}</p>
                  
                  {step.tips && step.tips.length > 0 && (
                    <div className="bg-accent/10 rounded-lg p-3 space-y-2">
                      <div className="text-xs font-semibold text-accent">💡 Tips:</div>
                      <ul className="text-xs space-y-1">
                        {step.tips.map((tip, i) => (
                          <li key={i} className="flex gap-2">
                            <span>•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {onStartTimer && step.estimatedMinutes && (
                    <Button
                      onClick={() => handleStartTimerForStep(step)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Play className="h-3 w-3 mr-2" />
                      Start Timer for This Step
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {playbook.linkedTaskIds.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Linked to {playbook.linkedTaskIds.length} task{playbook.linkedTaskIds.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}