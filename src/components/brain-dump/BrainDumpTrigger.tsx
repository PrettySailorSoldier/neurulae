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
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className="brain-dump-header-trigger"
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
