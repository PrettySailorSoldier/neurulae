import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BrainDumpTriggerProps {
  onClick: () => void;
}

export function BrainDumpTrigger({ onClick }: BrainDumpTriggerProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className="brain-dump-header-trigger relative z-10"
          >
            <Zap className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Brain Dump</p>
          <p className="text-xs text-muted-foreground">⌘⇧D</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
