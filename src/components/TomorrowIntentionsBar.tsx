import { useState, useEffect } from 'react';
import { TomorrowIntentions, TomorrowIntention } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Target, ChevronDown, ChevronUp, Sparkles, X, Play, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO, isSameDay } from 'date-fns';

interface TomorrowIntentionsBarProps {
  intentions: TomorrowIntentions | null;
  onToggleIntention: (intentionId: string) => void;
  onClearIntentions: () => void;
  onOpenDailyReview?: () => void;
  onStartWorkSession?: (taskId: string) => void;
  activeTaskId?: string | null;
  className?: string;
}

export function TomorrowIntentionsBar({
  intentions,
  onToggleIntention,
  onClearIntentions,
  onOpenDailyReview,
  onStartWorkSession,
  activeTaskId,
  className,
}: TomorrowIntentionsBarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Debug logging
  useEffect(() => {
    if (intentions) {
      console.log('[TomorrowIntentionsBar] Intentions received:', {
        date: intentions.date,
        intentionsCount: intentions.intentions.length,
        createdAt: intentions.createdAt,
      });
      
      const intentionsDate = parseISO(intentions.date);
      const today = new Date();
      const isTodayResult = isSameDay(intentionsDate, today);
      
      console.log('[TomorrowIntentionsBar] Date comparison:', {
        intentionsDate: intentionsDate.toISOString(),
        today: today.toISOString(),
        isTodayResult,
        todayFormatted: format(today, 'yyyy-MM-dd'),
        intentionsDateFormatted: intentions.date,
      });
    } else {
      console.log('[TomorrowIntentionsBar] No intentions received');
    }
  }, [intentions]);

  // Check if intentions are valid for display
  const hasValidIntentions = (() => {
    if (!intentions || !intentions.intentions.length) {
      return false;
    }
    
    // Check if these intentions are for today
    // The date in intentions is when they were set FOR, not when they were created
    const intentionsDate = parseISO(intentions.date);
    const today = new Date();
    
    // Use isSameDay for more reliable date comparison (ignores timezone issues)
    if (!isSameDay(intentionsDate, today)) {
      console.log('[TomorrowIntentionsBar] Hiding - intentions date is not today:', {
        intentionsDate: intentions.date,
        today: format(today, 'yyyy-MM-dd'),
      });
      return false;
    }
    
    return true;
  })();

  // If no valid intentions, show the "Set Your Intentions" prompt
  if (!hasValidIntentions) {
    return (
      <div 
        className={cn(
          // Solid background - visible and prominent
          "bg-gradient-to-r from-primary/15 via-primary/10 to-accent/10",
          "border border-primary/30 rounded-xl overflow-hidden",
          "shadow-sm hover:shadow-md transition-all cursor-pointer",
          className
        )}
        onClick={() => onOpenDailyReview?.()}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
            <Moon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-foreground">Set Your Intentions</h3>
            <p className="text-xs text-muted-foreground">
              Open Daily Review to set your top 3 priorities for today
            </p>
          </div>
          <Target className="h-5 w-5 text-primary/60" />
        </div>
      </div>
    );
  }

  // Valid intentions exist - show them
  const completedCount = intentions!.intentions.filter((i) => i.completed).length;
  const totalCount = intentions!.intentions.length;
  const allCompleted = completedCount === totalCount;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div
      className={cn(
        // Solid, visible background - not transparent!
        allCompleted
          ? "bg-gradient-to-r from-green-500/15 via-green-500/10 to-emerald-500/10"
          : "bg-gradient-to-r from-primary/15 via-primary/10 to-accent/10",
        'border rounded-xl overflow-hidden',
        allCompleted ? 'border-green-500/30' : 'border-primary/30',
        'shadow-sm',
        className
      )}
    >
      {/* Header - always visible */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-background/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full",
            allCompleted ? "bg-green-500/20" : "bg-primary/20"
          )}>
            <Target className={cn(
              "h-4 w-4",
              allCompleted ? "text-green-500" : "text-primary"
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">Today's Top 3 Priorities</h3>
              {allCompleted && (
                <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                  <Sparkles className="h-3 w-3" />
                  All done!
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount} of {totalCount} complete
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress bar - mini version */}
          <div className="hidden sm:block w-20 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 ease-out rounded-full',
                allCompleted ? 'bg-green-500' : 'bg-primary'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onClearIntentions();
            }}
            title="Clear intentions"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expandable intention list */}
      {isExpanded && intentions && (
        <div className="px-4 pb-4 space-y-2">
          {intentions.intentions
            .sort((a, b) => a.order - b.order)
            .map((intention, index) => {
              const isActive = activeTaskId && intention.taskId === activeTaskId;
              
              return (
                <div
                  key={intention.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-all',
                    intention.completed
                      ? 'bg-green-500/10'
                      : 'bg-background/80 hover:bg-background',
                    isActive && 'ring-2 ring-primary animate-pulse'
                  )}
                >
                  <span className="text-sm font-bold text-muted-foreground w-5 text-center tabular-nums">
                    {index + 1}.
                  </span>
                  <Checkbox
                    checked={intention.completed}
                    onCheckedChange={() => onToggleIntention(intention.id)}
                    className={cn(
                      'h-5 w-5 transition-all',
                      intention.completed && 'bg-green-500 border-green-500'
                    )}
                  />
                  <span
                    className={cn(
                      'flex-1 text-sm text-foreground transition-all',
                      intention.completed && 'line-through opacity-60'
                    )}
                  >
                    {intention.title}
                  </span>
                  
                  {/* Work button - only show if task is linked and not completed */}
                  {!intention.completed && intention.taskId && onStartWorkSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 px-2 gap-1 text-xs",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-primary/10 hover:text-primary"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartWorkSession(intention.taskId!);
                      }}
                    >
                      <Play className="h-3 w-3" />
                      {isActive ? 'Working' : 'Start'}
                    </Button>
                  )}
                </div>
              );
            })}

          {/* Full progress bar on mobile when expanded */}
          <div className="sm:hidden mt-3">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500 ease-out rounded-full',
                  allCompleted ? 'bg-green-500' : 'bg-primary'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
