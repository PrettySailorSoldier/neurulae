import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StructureSuggestion } from '@/hooks/useStructureAnalysis';

interface GhostSuggestionBlockProps {
  suggestion: StructureSuggestion;
  topPercent: number;
  heightPercent: number;
  onAccept: (suggestion: StructureSuggestion) => void;
  onDismiss: (suggestionId: string) => void;
}

export function GhostSuggestionBlock({
  suggestion,
  topPercent,
  heightPercent,
  onAccept,
  onDismiss
}: GhostSuggestionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Don't show very small blocks
  if (heightPercent < 2) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'absolute left-20 right-4 rounded-lg transition-all duration-200 cursor-pointer',
              'border-2 border-dashed',
              isHovered 
                ? 'border-primary/60 bg-primary/10' 
                : 'border-muted-foreground/20 bg-muted/30',
              'hover:border-primary/60 hover:bg-primary/10'
            )}
            style={{
              top: `${topPercent}%`,
              height: `${Math.max(heightPercent, 3)}%`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onAccept(suggestion)}
          >
            <div className="flex items-center justify-center h-full gap-2 px-2">
              <Plus className={cn(
                'h-4 w-4 transition-colors',
                isHovered ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'text-xs font-medium truncate transition-colors',
                isHovered ? 'text-primary' : 'text-muted-foreground'
              )}>
                {suggestion.title}
              </span>
              
              {/* Dismiss button - only show on hover */}
              {isHovered && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(suggestion.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{suggestion.title}</p>
            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
            <p className="text-xs">
              {suggestion.suggestedTime.start} - {suggestion.suggestedTime.end}
            </p>
            <p className="text-xs text-primary">Click to add this block</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
