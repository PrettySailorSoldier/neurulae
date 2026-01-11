import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Moon,
  Sparkles,
  Calendar,
  ArrowRight,
  Link2,
  Plus,
  RefreshCw,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Task, TomorrowIntentions, TomorrowIntention } from '@/types';
import { format, startOfDay, endOfDay, isWithinInterval, addDays } from 'date-fns';
import { findMatchingTasks, TaskMatch } from '@/lib/fuzzyTaskMatch';
import { useDailyReviews, DailyReviewEntry } from '@/hooks/useDailyReviews';
import { cn } from '@/lib/utils';

interface DailyReviewPromptProps {
  tasks: Task[];
  onClose: () => void;
  onAddTask?: (title: string) => void;
  lastReviewDate?: string;
  onSaveReview?: (date: string, notes: string) => void;
  onSaveTomorrowIntentions?: (intentions: TomorrowIntentions) => void;
}

// Priority input with smart task matching
interface PriorityInput {
  text: string;
  linkedTaskId: string | null;
  linkedTaskTitle: string | null;
  matchSuggestions: TaskMatch[];
  showSuggestions: boolean;
}

export function DailyReviewPrompt({
  tasks,
  onClose,
  onAddTask,
  lastReviewDate,
  onSaveReview,
  onSaveTomorrowIntentions,
}: DailyReviewPromptProps) {
  const [step, setStep] = useState<'review' | 'plan' | 'done'>('review');
  const [reviewNotes, setReviewNotes] = useState('');
  const [priorities, setPriorities] = useState<PriorityInput[]>([
    { text: '', linkedTaskId: null, linkedTaskTitle: null, matchSuggestions: [], showSuggestions: false },
    { text: '', linkedTaskId: null, linkedTaskTitle: null, matchSuggestions: [], showSuggestions: false },
    { text: '', linkedTaskId: null, linkedTaskTitle: null, matchSuggestions: [], showSuggestions: false },
  ]);
  
  const { addReview, getCompletionStreak } = useDailyReviews();
  const streak = getCompletionStreak();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrow = addDays(now, 1);

  // Calculate today's stats
  const completedToday = tasks.filter((t) => t.completed);
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const overdueTasks = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    return new Date(t.dueDate) < now;
  });

  // Update match suggestions when priority text changes
  const updatePriorityMatches = useCallback((index: number, text: string) => {
    const matches = text.trim().length >= 2 
      ? findMatchingTasks(text, tasks.filter(t => !t.completed), 0.3)
      : [];
    
    setPriorities(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        text,
        matchSuggestions: matches.slice(0, 3), // Show top 3 matches
        showSuggestions: matches.length > 0 && !updated[index].linkedTaskId,
        // Clear linked task if text doesn't match anymore
        ...(updated[index].linkedTaskId && 
           updated[index].linkedTaskTitle !== text && 
           { linkedTaskId: null, linkedTaskTitle: null }),
      };
      return updated;
    });
  }, [tasks]);

  // Handle linking a priority to an existing task
  const linkToTask = useCallback((priorityIndex: number, task: Task) => {
    setPriorities(prev => {
      const updated = [...prev];
      updated[priorityIndex] = {
        ...updated[priorityIndex],
        text: task.title,
        linkedTaskId: task.id,
        linkedTaskTitle: task.title,
        showSuggestions: false,
        matchSuggestions: [],
      };
      return updated;
    });
  }, []);

  // Handle dismissing suggestions (create new task instead)
  const dismissSuggestions = useCallback((priorityIndex: number) => {
    setPriorities(prev => {
      const updated = [...prev];
      updated[priorityIndex] = {
        ...updated[priorityIndex],
        showSuggestions: false,
      };
      return updated;
    });
  }, []);

  // Clear link from a priority
  const clearLink = useCallback((priorityIndex: number) => {
    setPriorities(prev => {
      const updated = [...prev];
      updated[priorityIndex] = {
        ...updated[priorityIndex],
        linkedTaskId: null,
        linkedTaskTitle: null,
      };
      return updated;
    });
  }, []);

  const handleAddTomorrowTasks = () => {
    const validPriorities = priorities.filter((p) => p.text.trim());

    // Create tomorrow's intentions
    if (onSaveTomorrowIntentions && validPriorities.length > 0) {
      const intentions: TomorrowIntention[] = validPriorities.map((priority, index) => ({
        id: crypto.randomUUID(),
        title: priority.text.trim(),
        taskId: priority.linkedTaskId || undefined,
        completed: false,
        order: index,
      }));

      const tomorrowIntentions: TomorrowIntentions = {
        date: format(tomorrow, 'yyyy-MM-dd'),
        intentions,
        createdAt: new Date().toISOString(),
      };

      onSaveTomorrowIntentions(tomorrowIntentions);
    }

    // Only add NEW tasks (those without linkedTaskId)
    if (onAddTask) {
      validPriorities.forEach((priority) => {
        if (!priority.linkedTaskId) {
          onAddTask(priority.text.trim());
        }
      });
    }

    // Save review to history
    const reviewEntry: Omit<DailyReviewEntry, 'id'> = {
      date: format(now, 'yyyy-MM-dd'),
      reviewedAt: now.toISOString(),
      completedTasks: completedToday.length,
      remainingTasks: incompleteTasks.length,
      overdueTasks: overdueTasks.length,
      carryingForward: incompleteTasks.slice(0, 5).map(t => t.title),
      reflection: reviewNotes,
      tomorrowPriorities: validPriorities.map((priority, index) => ({
        id: crypto.randomUUID(),
        title: priority.text.trim(),
        taskId: priority.linkedTaskId || undefined,
        completed: false,
        order: index,
      })),
    };
    addReview(reviewEntry);

    setStep('done');
  };

  const handleComplete = () => {
    if (onSaveReview) {
      onSaveReview(format(now, 'yyyy-MM-dd'), reviewNotes);
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              <DialogTitle>Daily Review</DialogTitle>
            </div>
            {streak.current > 0 && (
              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3" />
                {streak.current} day streak!
              </Badge>
            )}
          </div>
          <DialogDescription>
            {format(now, 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        {step === 'review' && (
          <div className="space-y-6 py-4">
            {/* Today's Summary */}
            <Card className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 border-muted">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Summary
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-500">
                    {completedToday.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{incompleteTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
                <div className={cn(
                  "p-2 rounded-lg",
                  overdueTasks.length > 0 ? "bg-orange-500/10" : "bg-muted/50"
                )}>
                  <p className={cn(
                    "text-2xl font-bold",
                    overdueTasks.length > 0 ? "text-orange-500" : "text-muted-foreground"
                  )}>
                    {overdueTasks.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </Card>

            {/* Completed Tasks List */}
            {completedToday.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  What you accomplished
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {completedToday.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm p-2 bg-green-500/10 rounded-lg"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {completedToday.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{completedToday.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Incomplete Tasks / Carrying Forward */}
            {incompleteTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Carrying forward
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {incompleteTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-lg"
                    >
                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{task.title}</span>
                      {task.estimatedMinutes && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {task.estimatedMinutes}m
                        </Badge>
                      )}
                    </div>
                  ))}
                  {incompleteTasks.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{incompleteTasks.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Reflection */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Quick reflection (optional)
              </h3>
              <Textarea
                placeholder="How was your day? Any wins or challenges to note?"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 'plan' && (
          <div className="space-y-6 py-4">
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Plan Tomorrow</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Set your top 3 priorities for {format(tomorrow, 'EEEE')}
              </p>
            </Card>

            <div className="space-y-4">
              {priorities.map((priority, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder={`Priority ${index + 1}...`}
                        value={priority.text}
                        onChange={(e) => updatePriorityMatches(index, e.target.value)}
                        onFocus={() => {
                          if (priority.matchSuggestions.length > 0 && !priority.linkedTaskId) {
                            setPriorities(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], showSuggestions: true };
                              return updated;
                            });
                          }
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-sm border rounded-lg bg-background",
                          "focus:outline-none focus:ring-2 focus:ring-primary",
                          priority.linkedTaskId && "border-primary/50 bg-primary/5"
                        )}
                      />
                      {priority.linkedTaskId && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <Badge 
                            variant="secondary" 
                            className="gap-1 bg-primary/20 text-primary text-xs cursor-pointer hover:bg-destructive/20 hover:text-destructive"
                            onClick={() => clearLink(index)}
                          >
                            <Link2 className="h-3 w-3" />
                            Linked
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Smart Match Suggestions */}
                  {priority.showSuggestions && priority.matchSuggestions.length > 0 && (
                    <div className="ml-8 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        Similar tasks found - link to avoid duplicates:
                      </p>
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {priority.matchSuggestions.map((match) => (
                          <button
                            key={match.task.id}
                            onClick={() => linkToTask(index, match.task)}
                            className="w-full flex items-center gap-2 p-2 text-sm bg-muted/50 hover:bg-primary/10 rounded-lg text-left transition-colors group"
                          >
                            <Link2 className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                            <span className="truncate flex-1">{match.task.title}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {Math.round(match.score * 100)}% match
                            </Badge>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => dismissSuggestions(index)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Create new task instead
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">
                {priorities.filter(p => p.linkedTaskId).length > 0 ? (
                  <>
                    <Link2 className="h-3 w-3 inline mr-1" />
                    <strong>{priorities.filter(p => p.linkedTaskId).length}</strong> linked to existing tasks, 
                    <strong> {priorities.filter(p => p.text.trim() && !p.linkedTaskId).length}</strong> will be created new
                  </>
                ) : (
                  "New tasks will be added for priorities without matches"
                )}
              </p>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="py-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Great job today!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get some rest. Tomorrow's a new day.
              </p>
              {streak.current >= 1 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                  <Sparkles className="h-4 w-4" />
                  {streak.current + 1} day review streak!
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'review' && (
            <>
              <Button variant="ghost" onClick={onClose}>
                Skip
              </Button>
              <Button onClick={() => setStep('plan')} className="gap-2">
                Plan Tomorrow
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {step === 'plan' && (
            <>
              <Button variant="ghost" onClick={() => setStep('review')}>
                Back
              </Button>
              <Button onClick={handleAddTomorrowTasks} className="gap-2">
                {priorities.some((t) => t.text.trim()) ? 'Save & Finish' : 'Skip & Finish'}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={handleComplete} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
