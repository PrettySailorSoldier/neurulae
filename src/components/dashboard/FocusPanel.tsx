import { useState } from 'react';
import { Task, TomorrowIntentions, TomorrowIntention } from '@/types';
import { Target, Plus, ChevronRight, Check, Play, Clock, Sparkles, Moon, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO, isSameDay } from 'date-fns';

interface FocusPanelProps {
  /** All tasks for filtering */
  tasks: Task[];
  /** Tomorrow's intentions (priority tasks) from Daily Review */
  intentions: TomorrowIntentions | null;
  /** Toggle intention completion */
  onToggleIntention: (intentionId: string) => void;
  /** Add a new task */
  onAddTask: (title: string, estimatedMinutes?: number) => void;
  /** Open daily review modal */
  onOpenDailyReview: () => void;
  /** Toggle task completion */
  onToggleComplete: (id: string) => void;
  /** Start work session on a task */
  onStartWorkSession?: (task: Task) => void;
  /** Open the full task library (mobile only) */
  onOpenLibrary?: () => void;
  /** Total task count for "Browse All Tasks" button */
  totalTaskCount: number;
  /** Whether we're on mobile */
  isMobile?: boolean;
  /** Currently active task ID from timer */
  activeTaskId?: string | null;
  /** User's name for greeting */
  userName?: string;
  /** Extra classes */
  className?: string;
}

// Get current greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// Get formatted date
const getFormattedDate = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
  return now.toLocaleDateString('en-US', options);
};

export function FocusPanel({
  tasks,
  intentions,
  onToggleIntention,
  onAddTask,
  onOpenDailyReview,
  onToggleComplete,
  onStartWorkSession,
  onOpenLibrary,
  totalTaskCount,
  isMobile = false,
  activeTaskId,
  userName = 'User',
  className,
}: FocusPanelProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // Check if intentions are valid for today
  const hasValidIntentions = intentions && 
    intentions.intentions.length > 0 && 
    isSameDay(parseISO(intentions.date), new Date());

  // Get priority task IDs from intentions
  const priorityTaskIds = hasValidIntentions 
    ? intentions!.intentions.map(i => i.taskId).filter(Boolean) as string[]
    : [];

  // Get priority tasks (from intentions, max 3)
  const priorityTasks = hasValidIntentions 
    ? intentions!.intentions.slice(0, 3)
    : [];

  // Get tasks due today (not in priorities)
  const todayString = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks.filter(t => 
    t.dueDate === todayString && 
    !priorityTaskIds.includes(t.id) &&
    !t.completed
  );

  // Calculate completion stats
  const completedPriorities = priorityTasks.filter(p => p.completed).length;
  const allPrioritiesComplete = priorityTasks.length > 0 && completedPriorities === priorityTasks.length;

  const handleQuickAdd = () => {
    if (quickAddTitle.trim()) {
      onAddTask(quickAddTitle.trim());
      setQuickAddTitle('');
      setQuickAddOpen(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      "bg-card text-card-foreground",
      isMobile ? "w-full" : "w-[400px] min-w-[350px] max-w-[450px] border-r border-border",
      className
    )}>
      {/* Header with greeting */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 backdrop-blur-sm border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {getFormattedDate()}
            </span>
          </span>
        </div>
        <h2 className="text-foreground tracking-tight text-2xl font-bold leading-tight">
          {getGreeting()}, <span className="text-muted-foreground">{userName}</span>
        </h2>
      </div>

      {/* Priority Tasks Section */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6">
        {/* Today's Priorities Card */}
        <div className={cn(
          "p-4 rounded-2xl border overflow-hidden transition-all",
          allPrioritiesComplete 
            ? "bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border-green-500/30" 
            : "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                allPrioritiesComplete ? "bg-green-500/20" : "bg-primary/20"
              )}>
                <Target className={cn(
                  "h-4 w-4",
                  allPrioritiesComplete ? "text-green-500" : "text-primary"
                )} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Today's Focus</h3>
                <p className="text-[10px] text-muted-foreground">
                  {hasValidIntentions 
                    ? `${completedPriorities}/${priorityTasks.length} complete`
                    : 'Set your priorities'}
                </p>
              </div>
            </div>
            {allPrioritiesComplete && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3" />
                Done!
              </span>
            )}
          </div>

          {/* Priority Items */}
          {hasValidIntentions ? (
            <div className="space-y-2">
              {priorityTasks.map((intention, index) => {
                const isActive = activeTaskId && intention.taskId === activeTaskId;
                
                return (
                  <div 
                    key={intention.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer group",
                      intention.completed 
                        ? "bg-green-500/10" 
                        : "bg-background/60 hover:bg-background/90",
                      isActive && "ring-2 ring-primary animate-pulse bg-primary/10"
                    )}
                    onClick={() => onToggleIntention(intention.id)}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">
                      {index + 1}.
                    </span>
                    <Checkbox
                      checked={intention.completed}
                      onCheckedChange={() => onToggleIntention(intention.id)}
                      className={cn(
                        "h-4 w-4 transition-all",
                        intention.completed && "bg-green-500 border-green-500",
                        !intention.completed && "group-hover:border-primary"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={cn(
                      "flex-1 text-sm transition-all",
                      intention.completed && "line-through text-muted-foreground",
                      !intention.completed && "text-foreground",
                      isActive && "font-semibold text-primary"
                    )}>
                      {intention.title}
                    </span>
                    {/* Start work button */}
                    {!intention.completed && intention.taskId && onStartWorkSession && !isActive && (
                      <button
                        className="opacity-0 group-hover:opacity-100 bg-primary/10 rounded-full p-1.5 text-primary hover:bg-primary/20 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          const task = tasks.find(t => t.id === intention.taskId);
                          if (task) onStartWorkSession(task);
                        }}
                      >
                        <Play className="h-3 w-3 fill-current" />
                      </button>
                    )}
                    {isActive && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-full">
                        <Play className="h-2 w-2 fill-current" />
                        Working
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div 
              className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-all"
              onClick={onOpenDailyReview}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Moon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground">Set Your Intentions</h4>
                  <p className="text-xs text-muted-foreground">
                    Open Daily Review to set your top 3 priorities
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-primary/50" />
              </div>
            </div>
          )}
        </div>

        {/* Tasks Due Today (not in priorities) */}
        {todayTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground">Also Due Today</h3>
              <span className="text-xs text-muted-foreground">({todayTasks.length})</span>
            </div>
            <div className="space-y-2">
              {todayTasks.slice(0, 5).map(task => (
                <div 
                  key={task.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onToggleComplete(task.id)}
                    className="h-4 w-4"
                  />
                  <span className="flex-1 text-sm text-foreground truncate">{task.title}</span>
                  {task.estimatedMinutes && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {task.estimatedMinutes}m
                    </span>
                  )}
                  {onStartWorkSession && (
                    <button
                      className="opacity-0 group-hover:opacity-100 bg-primary/10 rounded-full p-1.5 text-primary hover:bg-primary/20 transition-all"
                      onClick={() => onStartWorkSession(task)}
                    >
                      <Play className="h-3 w-3 fill-current" />
                    </button>
                  )}
                </div>
              ))}
              {todayTasks.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{todayTasks.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Add */}
        <div className="space-y-2">
          {quickAddOpen ? (
            <div className="flex gap-2">
              <Input
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickAdd();
                  if (e.key === 'Escape') {
                    setQuickAddOpen(false);
                    setQuickAddTitle('');
                  }
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleQuickAdd}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setQuickAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Quick Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Mobile: Browse All Tasks Button */}
      {isMobile && onOpenLibrary && (
        <div className="p-4 border-t border-border">
          <Button
            variant="secondary"
            className="w-full justify-between gap-2"
            onClick={onOpenLibrary}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Browse All Tasks</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>({totalTaskCount})</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}
