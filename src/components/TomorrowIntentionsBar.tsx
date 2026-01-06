import { useState, useEffect } from 'react';
import { TomorrowIntentions, TomorrowIntention } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Target, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO } from 'date-fns';

interface TomorrowIntentionsBarProps {
  intentions: TomorrowIntentions | null;
  onToggleIntention: (intentionId: string) => void;
  onClearIntentions: () => void;
  className?: string;
}

export function TomorrowIntentionsBar({
  intentions,
  onToggleIntention,
  onClearIntentions,
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
      console.log('[TomorrowIntentionsBar] Date comparison:', {
        intentionsDate: intentionsDate.toISOString(),
        today: today.toISOString(),
        isTodayResult: isToday(intentionsDate),
        todayFormatted: format(today, 'yyyy-MM-dd'),
        intentionsDateFormatted: intentions.date,
      });
    } else {
      console.log('[TomorrowIntentionsBar] No intentions received');
    }
  }, [intentions]);

  // Don't render if no intentions or if intentions are not for today
  if (!intentions || !intentions.intentions.length) {
    return null;
  }

  // Check if these intentions are for today
  const intentionsDate = parseISO(intentions.date);
  if (!isToday(intentionsDate)) {
    console.log('[TomorrowIntentionsBar] Hiding - intentions date is not today:', {
      intentionsDate: intentions.date,
      today: format(new Date(), 'yyyy-MM-dd'),
    });
    return null;
  }

  const completedCount = intentions.intentions.filter((i) => i.completed).length;
  const totalCount = intentions.intentions.length;
  const allCompleted = completedCount === totalCount;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent',
        'border border-primary/20 rounded-xl overflow-hidden',
        'backdrop-blur-sm shadow-sm',
        className
      )}
    >
      {/* Header - always visible */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Today's Intentions</h3>
              {allCompleted && (
                <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                  <Sparkles className="h-3 w-3" />
                  Complete!
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount} of {totalCount} complete
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress bar - mini version */}
          <div className="hidden sm:block w-24 h-2 bg-muted rounded-full overflow-hidden">
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
      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {intentions.intentions
            .sort((a, b) => a.order - b.order)
            .map((intention, index) => (
              <div
                key={intention.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-all',
                  intention.completed
                    ? 'bg-green-500/10 text-muted-foreground'
                    : 'bg-background/50 hover:bg-background/80'
                )}
              >
                <span className="text-xs font-medium text-muted-foreground w-5 text-center">
                  {index + 1}.
                </span>
                <Checkbox
                  checked={intention.completed}
                  onCheckedChange={() => onToggleIntention(intention.id)}
                  className={cn(
                    'transition-all',
                    intention.completed && 'bg-green-500 border-green-500'
                  )}
                />
                <span
                  className={cn(
                    'flex-1 text-sm transition-all',
                    intention.completed && 'line-through opacity-60'
                  )}
                >
                  {intention.title}
                </span>
              </div>
            ))}

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
