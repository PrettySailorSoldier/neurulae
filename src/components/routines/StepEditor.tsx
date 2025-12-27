import { useState } from 'react';
import { GripVertical, Trash2, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RoutineStep } from '@/types';
import { cn } from '@/lib/utils';

interface StepEditorProps {
  step: Omit<RoutineStep, 'status' | 'actualMinutes'>;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onUpdate: (updates: Partial<RoutineStep>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  dragHandleProps?: any; // For drag-and-drop integration
}

const DURATION_PRESETS = [5, 10, 15, 30];

export function StepEditor({
  step,
  index,
  isFirst,
  isLast,
  hasError,
  errorMessage,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
}: StepEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDurationChange = (delta: number) => {
    const newDuration = Math.max(1, (step.estimatedMinutes || 5) + delta);
    onUpdate({ estimatedMinutes: newDuration });
  };

  const handleDurationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onUpdate({ estimatedMinutes: value });
    }
  };

  const showDurationWarning = step.estimatedMinutes < 2;
  const showDurationSuggestion = step.estimatedMinutes > 60;

  return (
    <div
      className={cn(
        'border rounded-lg p-3 bg-card transition-all',
        hasError && 'border-destructive',
        'hover:shadow-sm'
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <div
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Move buttons (fallback when not using drag-and-drop) */}
        {!dragHandleProps && (
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onMoveUp}
              disabled={isFirst}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onMoveDown}
              disabled={isLast}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Step number */}
        <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center text-xs flex-shrink-0">
          {index + 1}
        </Badge>

        {/* Step name input */}
        <Input
          value={step.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Step name"
          className={cn('flex-1', hasError && 'border-destructive')}
        />

        {/* Duration controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-xs"
            onClick={() => handleDurationChange(-5)}
            disabled={step.estimatedMinutes <= 5}
          >
            -5
          </Button>

          <div className="relative">
            <Input
              type="number"
              min={1}
              value={step.estimatedMinutes || 5}
              onChange={handleDurationInput}
              className={cn(
                'w-14 h-7 text-center text-sm pr-5',
                showDurationWarning && 'border-yellow-500',
                showDurationSuggestion && 'border-blue-500'
              )}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              m
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-xs"
            onClick={() => handleDurationChange(5)}
          >
            +5
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-xs"
            onClick={() => handleDurationChange(10)}
          >
            +10
          </Button>
        </div>

        {/* Expand/collapse notes */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Duration warnings */}
      {showDurationWarning && (
        <div className="flex items-center gap-2 mt-2 ml-10 text-xs text-yellow-600">
          <AlertTriangle className="h-3 w-3" />
          <span>This step seems very short. Consider if you need more time.</span>
        </div>
      )}

      {showDurationSuggestion && (
        <div className="flex items-center gap-2 mt-2 ml-10 text-xs text-blue-600">
          <Clock className="h-3 w-3" />
          <span>This step is over an hour. Consider breaking it into smaller steps.</span>
        </div>
      )}

      {/* Error message */}
      {hasError && errorMessage && (
        <p className="text-xs text-destructive mt-1 ml-10">{errorMessage}</p>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 ml-10 space-y-3 border-t pt-3">
          {/* Notes textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Notes / Instructions</Label>
              <span className="text-xs text-muted-foreground">
                {(step.notes?.length || 0)}/500
              </span>
            </div>
            <Textarea
              value={step.notes || ''}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  onUpdate({ notes: e.target.value });
                }
              }}
              placeholder="Add tips, reminders, or instructions for this step..."
              className="h-20 text-sm resize-none"
              maxLength={500}
            />
          </div>

          {/* Flexible checkbox */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`flexible_${index}`}
                    checked={step.isFlexible}
                    onCheckedChange={(checked) => onUpdate({ isFlexible: !!checked })}
                  />
                  <Label htmlFor={`flexible_${index}`} className="text-sm font-normal cursor-pointer">
                    Flexible step
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Flexible steps can be reordered during routine execution if you need to do things in a different order.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Quick duration presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Quick set:</span>
            {DURATION_PRESETS.map(mins => (
              <Button
                key={mins}
                variant={step.estimatedMinutes === mins ? 'secondary' : 'outline'}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => onUpdate({ estimatedMinutes: mins })}
              >
                {mins}m
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
