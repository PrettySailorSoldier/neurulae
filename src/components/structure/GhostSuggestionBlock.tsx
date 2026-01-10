import { useState } from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
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
              'absolute left-20 right-4 rounded transition-all duration-200 cursor-pointer',
              'border border-dashed',
              isHovered 
                ? 'border-primary/40 bg-primary/5' 
                : 'border-transparent bg-transparent',
              'hover:border-primary/40 hover:bg-primary/5',
              'opacity-0 hover:opacity-100' // Only visible on hover
            )}
            style={{
              top: `${topPercent}%`,
              height: `${Math.max(heightPercent, 3)}%`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onAccept(suggestion)}
          >
            <div className="flex items-center justify-center h-full gap-1.5 px-2">
              <Plus className="h-3 w-3 text-primary/60" />
              <span className="text-[10px] font-medium text-primary/60 truncate">
                {suggestion.title}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-sm">{suggestion.title}</p>
            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
            <p className="text-xs">
              {suggestion.suggestedTime.start} - {suggestion.suggestedTime.end}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
