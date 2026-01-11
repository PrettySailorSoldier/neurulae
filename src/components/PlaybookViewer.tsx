import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Playbook, PlaybookStep } from '@/types';
import { Clock, RotateCcw, Link2, Play, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlaybookViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbook: Playbook;
  onUpdatePlaybook: (playbook: Playbook) => void;
  onStartTimer?: (stepTitle: string, minutes: number) => void;
}

export function PlaybookViewer({ open, onOpenChange, playbook, onUpdatePlaybook, onStartTimer }: PlaybookViewerProps) {
  const [openSteps, setOpenSteps] = useState<string[]>([]);
  const [breakingDownStepId, setBreakingDownStepId] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleAIBreakdown = async (step: PlaybookStep, stepIndex: number) => {
    setBreakingDownStepId(step.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to use AI features.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-playbook', {
        body: {
          goal: `Break down this step into smaller sub-steps: "${step.title}"`,
          details: `Original step description: ${step.description}. Estimated time: ${step.estimatedMinutes || 15} minutes. Create 3-5 smaller, more manageable sub-steps that together accomplish this task. Each sub-step should be very specific and actionable.`,
          category: playbook.category,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.steps && data.steps.length > 0) {
        // Insert the new sub-steps after the current step
        const newSteps = [...playbook.steps];
        const subSteps: PlaybookStep[] = data.steps.map((s: any, i: number) => ({
          id: crypto.randomUUID(),
          title: `  ↳ ${s.title}`,
          description: s.description,
          estimatedMinutes: s.estimatedMinutes || 5,
          completed: false,
          order: stepIndex + i + 1,
          tips: s.tips || [],
        }));

        // Insert sub-steps after the current step
        newSteps.splice(stepIndex + 1, 0, ...subSteps);

        // Update order for all steps
        const reorderedSteps = newSteps.map((s, i) => ({ ...s, order: i }));

        onUpdatePlaybook({ ...playbook, steps: reorderedSteps });
        
        // Auto-expand the step to show sub-steps were added
        setOpenSteps(prev => [...prev, step.id]);

        toast({
          title: "Step broken down!",
          description: `Added ${subSteps.length} sub-steps to help you complete this task.`,
        });
      }
    } catch (error: any) {
      console.error('AI breakdown error:', error);
      toast({
        title: "Breakdown failed",
        description: error.message || "Failed to break down step. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBreakingDownStepId(null);
    }
  };

  const handleGenerateTips = async (step: PlaybookStep, stepIndex: number) => {
    setBreakingDownStepId(step.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to use AI features.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-playbook', {
        body: {
          goal: `Generate helpful tips for completing this task: "${step.title}"`,
          details: `Task description: ${step.description}. Generate 3-5 practical, actionable tips that would help someone with ADHD or autism complete this task successfully. Focus on: overcoming common obstacles, staying focused, and making the task easier.`,
          category: playbook.category,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.steps && data.steps.length > 0) {
        // Extract tips from the generated steps
        const allTips: string[] = [];
        data.steps.forEach((s: any) => {
          if (s.tips) {
            allTips.push(...s.tips);
          }
          // Also use step titles as tips if they're actionable
          if (s.title && !s.title.toLowerCase().includes('step')) {
            allTips.push(s.title);
          }
        });

        // Merge with existing tips, removing duplicates
        const existingTips = step.tips || [];
        const combinedTips = [...new Set([...existingTips, ...allTips.slice(0, 5)])];

        // Update the step with new tips
        const updatedSteps = playbook.steps.map((s, i) =>
          i === stepIndex ? { ...s, tips: combinedTips } : s
        );

        onUpdatePlaybook({ ...playbook, steps: updatedSteps });
        
        // Auto-expand to show tips
        setOpenSteps(prev => [...prev, step.id]);

        toast({
          title: "Tips generated!",
          description: `Added ${allTips.length} helpful tips for this step.`,
        });
      }
    } catch (error: any) {
      console.error('Generate tips error:', error);
      toast({
        title: "Failed to generate tips",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBreakingDownStepId(null);
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
              } ${step.title.startsWith('  ↳') ? 'ml-6 border-l-2 border-l-primary/50' : ''}`}
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
                      {step.title.startsWith('  ↳') ? step.title : `Step ${index + 1}: ${step.title}`}
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
                  
                  {/* Subtasks - Checkable items within a step */}
                                    {(step.subtasks && step.subtasks.length > 0) || (step.tips && step.tips.length > 0) ? (
                    <div className="bg-accent/10 rounded-lg p-3 space-y-2">
                      <div className="text-xs font-semibold text-accent flex items-center gap-1">
                        📋 Subtasks:
                      </div>
                      <div className="space-y-1.5">
                        {/* Render existing subtasks */}
                        {step.subtasks?.map((subtask) => (
                          <label 
                            key={subtask.id} 
                            className="flex items-start gap-2 cursor-pointer hover:bg-accent/5 rounded p-1 -m-1"
                          >
                            <Checkbox
                              checked={subtask.completed}
                              onCheckedChange={() => {
                                const updatedSteps = playbook.steps.map((s, i) =>
                                  i === index
                                    ? {
                                        ...s,
                                        subtasks: s.subtasks?.map((st) =>
                                          st.id === subtask.id
                                            ? { ...st, completed: !st.completed }
                                            : st
                                        ),
                                      }
                                    : s
                                );
                                onUpdatePlaybook({ ...playbook, steps: updatedSteps });
                              }}
                              className="mt-0.5 border-border"
                            />
                            <span className={`text-xs ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {subtask.title}
                            </span>
                          </label>
                        ))}
                        {/* Render tips as checkable items if no subtasks exist */}
                        {(!step.subtasks || step.subtasks.length === 0) && step.tips?.map((tip, tipIndex) => (
                          <label 
                            key={tipIndex} 
                            className="flex items-start gap-2 cursor-pointer hover:bg-accent/5 rounded p-1 -m-1"
                          >
                            <Checkbox
                              checked={false}
                              onCheckedChange={() => {
                                // Convert tips to subtasks on first interaction
                                const newSubtasks = step.tips?.map((t, i) => ({
                                  id: crypto.randomUUID(),
                                  title: t,
                                  completed: i === tipIndex, // Mark this one as complete
                                })) || [];
                                const updatedSteps = playbook.steps.map((s, i) =>
                                  i === index
                                    ? { ...s, subtasks: newSubtasks, tips: [] }
                                    : s
                                );
                                onUpdatePlaybook({ ...playbook, steps: updatedSteps });
                              }}
                              className="mt-0.5 border-border"
                            />
                            <span className="text-xs">{tip}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {onStartTimer && step.estimatedMinutes && (
                      <Button
                        onClick={() => handleStartTimerForStep(step)}
                        variant="outline"
                        size="sm"
                      >
                        <Play className="h-3 w-3 mr-2" />
                        Start Timer
                      </Button>
                    )}
                    
                    {/* AI Breakdown Button */}
                    <Button
                      onClick={() => handleAIBreakdown(step, index)}
                      variant="outline"
                      size="sm"
                      disabled={breakingDownStepId === step.id}
                      className="text-primary border-primary/50 hover:bg-primary/10"
                    >
                      {breakingDownStepId === step.id ? (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-2" />
                      )}
                      Break Down
                    </Button>

                    {/* Generate Tips Button */}
                    <Button
                      onClick={() => handleGenerateTips(step, index)}
                      variant="ghost"
                      size="sm"
                      disabled={breakingDownStepId === step.id}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {breakingDownStepId === step.id ? (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-2" />
                      )}
                      Get Tips
                    </Button>
                  </div>
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