import { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Moon,
  Sparkles,
  Calendar,
  ArrowRight,
  X,
} from 'lucide-react';
import { Task, TomorrowIntentions, TomorrowIntention } from '@/types';
import { format, startOfDay, endOfDay, isWithinInterval, addDays } from 'date-fns';

interface DailyReviewPromptProps {
  tasks: Task[];
  onClose: () => void;
  onAddTask?: (title: string) => void;
  lastReviewDate?: string;
  onSaveReview?: (date: string, notes: string) => void;
  onSaveTomorrowIntentions?: (intentions: TomorrowIntentions) => void;
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
  const [tomorrowTasks, setTomorrowTasks] = useState<string[]>(['', '', '']);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrow = addDays(now, 1);

  // Calculate today's stats
  const todaysTasks = tasks.filter((t) => {
    const createdDate = new Date(t.createdAt);
    return isWithinInterval(createdDate, { start: todayStart, end: todayEnd });
  });

  const completedToday = tasks.filter((t) => {
    if (!t.completed) return false;
    // Approximate: check if task exists and is completed
    return t.completed;
  });

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const overdueTasks = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    return new Date(t.dueDate) < now;
  });

  const completionRate =
    todaysTasks.length > 0
      ? (todaysTasks.filter((t) => t.completed).length / todaysTasks.length) * 100
      : 0;

  const handleAddTomorrowTasks = () => {
    const validTasks = tomorrowTasks.filter((t) => t.trim());

    // Create tomorrow's intentions
    if (onSaveTomorrowIntentions && validTasks.length > 0) {
      const intentions: TomorrowIntention[] = validTasks.map((title, index) => ({
        id: crypto.randomUUID(),
        title: title.trim(),
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

    // Also add as regular tasks if callback provided
    if (onAddTask) {
      validTasks.forEach((title) => {
        onAddTask(title.trim());
      });
    }

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            <DialogTitle>Daily Review</DialogTitle>
          </div>
          <DialogDescription>
            {format(now, 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        {step === 'review' && (
          <div className="space-y-6 py-4">
            {/* Today's Summary */}
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Today's Summary
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {completedToday.filter((t) => {
                      const created = new Date(t.createdAt);
                      return isWithinInterval(created, { start: todayStart, end: todayEnd });
                    }).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{incompleteTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">{overdueTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </Card>

            {/* Completed Tasks List */}
            {completedToday.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  What you accomplished
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {completedToday.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm p-2 bg-green-500/10 rounded"
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

            {/* Incomplete Tasks */}
            {incompleteTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Carrying forward
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {incompleteTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded"
                    >
                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{task.title}</span>
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
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Plan Tomorrow</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Set your top 3 priorities for {format(tomorrow, 'EEEE')}
              </p>
            </Card>

            <div className="space-y-3">
              {tomorrowTasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    placeholder={`Priority ${index + 1}...`}
                    value={task}
                    onChange={(e) => {
                      const newTasks = [...tomorrowTasks];
                      newTasks[index] = e.target.value;
                      setTomorrowTasks(newTasks);
                    }}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              These will be added to your task list for tomorrow
            </p>
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
                {tomorrowTasks.some((t) => t.trim()) ? 'Save & Finish' : 'Skip & Finish'}
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
