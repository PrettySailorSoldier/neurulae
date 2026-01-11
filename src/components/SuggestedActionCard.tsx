/**
 * SuggestedActionCard Component
 * 
 * Displays a smart suggestion for what to do next.
 * Compact, non-intrusive design that can be dismissed.
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Play, Clock, ChevronRight } from 'lucide-react';
import { SuggestedAction } from '@/lib/suggestedActionEngine';
import { Task } from '@/types';

interface SuggestedActionCardProps {
  suggestion: SuggestedAction;
  onStartWork?: (task: Task) => void;
  onDismiss?: () => void;
  onOpenDailyReview?: () => void;
  className?: string;
}

const colorClasses: Record<SuggestedAction['color'], { bg: string; text: string; border: string }> = {
  red: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  green: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
  gray: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30' },
};

export function SuggestedActionCard({
  suggestion,
  onStartWork,
  onDismiss,
  onOpenDailyReview,
  className,
}: SuggestedActionCardProps) {
  const colors = colorClasses[suggestion.color];
  
  const handleAction = () => {
    if (suggestion.task && onStartWork) {
      onStartWork(suggestion.task);
    } else if (suggestion.type === 'routine' && onOpenDailyReview) {
      onOpenDailyReview();
    }
  };

  const canStart = suggestion.task && onStartWork;
  const showReviewButton = suggestion.type === 'routine' && suggestion.color === 'indigo' && onOpenDailyReview;

  return (
    <div 
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-xl border transition-all",
        colors.bg,
        colors.border,
        suggestion.priority === 'urgent' && 'animate-pulse',
        className
      )}
    >
      {/* Icon */}
      <div className={cn(
        "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-lg",
        colors.bg
      )}>
        {suggestion.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", colors.text)}>
          {suggestion.message}
        </p>
        {suggestion.description && (
          <p className="text-xs text-muted-foreground truncate">
            {suggestion.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {canStart && (
          <Button
            size="sm"
            variant="default"
            className={cn("h-8 gap-1", colors.text, colors.bg, "hover:opacity-80")}
            onClick={handleAction}
          >
            <Play className="h-3 w-3 fill-current" />
            Start
          </Button>
        )}
        
        {showReviewButton && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={() => onOpenDailyReview?.()}
          >
            <Clock className="h-3 w-3" />
            Review
          </Button>
        )}

        {!canStart && !showReviewButton && suggestion.type !== 'free-time' && (
          <ChevronRight className={cn("h-4 w-4", colors.text)} />
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
