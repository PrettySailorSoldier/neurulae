import { useState } from 'react';
import { Task, TomorrowIntentions, TomorrowIntention } from '@/types';
import { Target, Play, Check, ChevronDown, ChevronRight, Sparkles, Moon, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { format, isSameDay, parseISO } from 'date-fns';
import { getTimeOfDayGreeting } from '@/lib/timeHelpers';

interface HeroFocusCardProps {
  /** Current priority task to focus on */
  currentTask: TomorrowIntention | null;
  /** All tasks (for looking up task details) */
  tasks: Task[];
  /** Remaining priority tasks (after current) */
  remainingTasks: TomorrowIntention[];
  /** User's display name */
  userName: string;
  /** Start timer/focus session on a task */
  onStartTimer: (task: Task) => void;
  /** Mark task as complete */
  onCompleteTask: (intentionId: string) => void;
  /** Move to next task */
  onNextTask: () => void;
  /** Edit a task */
  onEditTask?: (task: Task) => void;
  /** Open daily review to set priorities */
  onOpenDailyReview: () => void;
  /** Currently active task ID from timer */
  activeTaskId?: string | null;
  /** Extra classes */
  className?: string;
}

export function HeroFocusCard({
  currentTask,
  tasks,
  remainingTasks,
  userName,
  onStartTimer,
  onCompleteTask,
  onNextTask,
  onEditTask,
  onOpenDailyReview,
  activeTaskId,
  className,
}: HeroFocusCardProps) {
  const [remainingExpanded, setRemainingExpanded] = useState(true);
  
  const today = format(new Date(), 'EEEE, MMMM d');
  const greeting = getTimeOfDayGreeting();
  
  // Check if current task is the active one
  const isCurrentActive = currentTask && activeTaskId && currentTask.taskId === activeTaskId;
  
  // Get the actual Task object for the current intention (for starting timer)
  const currentTaskObject = currentTask?.taskId 
    ? tasks.find(t => t.id === currentTask.taskId) 
    : null;

  return (
    <Card className={cn(
      "border-2 border-primary/20",
      "bg-gradient-to-br from-card to-card/80",
      className
    )}>
      {/* Greeting Header */}
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting}, <span className="text-muted-foreground">{userName}</span>
          </h1>
          <span className="text-sm text-muted-foreground">
            {today}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Priority - THE HERO ELEMENT */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-muted-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Focus Right Now
          </h2>
          
          {currentTask && !currentTask.completed ? (
            <div className={cn(
              "p-6 rounded-xl border-2 transition-all",
              isCurrentActive 
                ? "border-primary bg-primary/10 ring-2 ring-primary/50" 
                : "border-primary/50 bg-primary/5 hover:bg-primary/10"
            )}>
              <div className="flex items-start gap-4">
                <Checkbox 
                  checked={currentTask.completed}
                  onCheckedChange={() => onCompleteTask(currentTask.id)}
                  className="mt-1 h-5 w-5"
                />
                <div className="flex-1 space-y-4">
                  <h3 className={cn(
                    "text-xl font-semibold text-foreground",
                    isCurrentActive && "text-primary"
                  )}>
                    {currentTask.title}
                  </h3>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {currentTaskObject && (
                      <Button 
                        size="lg"
                        onClick={() => onStartTimer(currentTaskObject)}
                        className="gap-2"
                        disabled={isCurrentActive}
                      >
                        <Play className="h-4 w-4" />
                        {isCurrentActive ? 'Working...' : 'Start 25min Focus'}
                      </Button>
                    )}
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => onCompleteTask(currentTask.id)}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Mark Complete
                    </Button>
                    {currentTaskObject && onEditTask && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEditTask(currentTaskObject)}
                        title="Edit task"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {isCurrentActive && (
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    Timer running - stay focused!
                  </div>
                </div>
              )}
            </div>
          ) : currentTask?.completed ? (
            // Current task is done, show celebration
            <div className="p-6 rounded-xl border-2 border-green-500/50 bg-green-500/10 text-center">
              <Sparkles className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-600 font-medium">Task complete! Great work!</p>
              {remainingTasks.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={onNextTask}
                  className="mt-3 gap-2"
                >
                  Move to next task
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            // No priorities set
            <div 
              className="p-6 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-all"
              onClick={onOpenDailyReview}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Moon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Set Your Focus</h3>
                  <p className="text-sm text-muted-foreground">
                    Open Daily Review to choose your top priorities for today
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-primary/50" />
              </div>
            </div>
          )}
        </div>

        {/* Remaining Tasks - Collapsible */}
        {remainingTasks.length > 0 && (
          <Collapsible 
            open={remainingExpanded} 
            onOpenChange={setRemainingExpanded}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg transition-colors group">
              <span className="text-sm font-medium text-muted-foreground">
                Next Up ({remainingTasks.length} more)
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                remainingExpanded && "rotate-180"
              )} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 mt-2">
              {remainingTasks.map((task, idx) => (
                <div 
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    task.completed 
                      ? "bg-green-500/10" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <Checkbox 
                    checked={task.completed}
                    onCheckedChange={() => onCompleteTask(task.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-xs font-medium text-muted-foreground w-12">
                    {idx === 0 ? 'Next:' : 'Then:'}
                  </span>
                  <span className={cn(
                    "flex-1 text-sm",
                    task.completed && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* All priorities complete celebration */}
        {currentTask?.completed && remainingTasks.every(t => t.completed) && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/30 text-center">
            <Sparkles className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-green-600 font-semibold">All priorities complete! 🎉</p>
            <p className="text-sm text-muted-foreground mt-1">
              Amazing work today. Check your task library for more or take a well-deserved break.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
