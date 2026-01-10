import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Sunrise, ChevronDown, ChevronUp, Sparkles, CheckCircle2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, DayTemplate } from '@/types';
import { DayPhase } from '@/lib/temporalContext';

interface StartMyDayButtonProps {
  currentPhase: DayPhase;
  morningTemplateExists: boolean;
  morningTemplate?: DayTemplate;
  topTasks: Task[];
  dayStarted: boolean;
  onStartDay: () => void;
  onApplyTemplate?: () => void;
  onStartFocusTimer?: (task: Task) => void;
  className?: string;
}

export function StartMyDayButton({
  currentPhase,
  morningTemplateExists,
  morningTemplate,
  topTasks,
  dayStarted,
  onStartDay,
  onApplyTemplate,
  onStartFocusTimer,
  className
}: StartMyDayButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in morning phases, before day has "started"
  const isMorningPhase = currentPhase === 'early-morning' || currentPhase === 'morning';
  
  if (!isMorningPhase || dayStarted) {
    return null;
  }

  const handleStartDay = () => {
    onStartDay();
    // Optionally apply template
    if (morningTemplateExists && onApplyTemplate) {
      onApplyTemplate();
    }
  };

  return (
    <Card className={cn('border-primary/50 bg-gradient-to-r from-primary/5 to-transparent', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Sunrise className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Ready to start your day?</h3>
              <p className="text-sm text-muted-foreground">
                Set up your morning structure
              </p>
            </div>
          </div>
          <Button onClick={handleStartDay} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Start My Day
          </Button>
        </div>
        
        {/* Expandable preview */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors">
            What this does
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <div className="grid gap-2 text-sm">
              {/* Morning template */}
              <div className="flex items-start gap-2">
                <CheckCircle2 className={cn(
                  'h-4 w-4 mt-0.5',
                  morningTemplateExists ? 'text-green-500' : 'text-muted-foreground'
                )} />
                <div>
                  <span className={morningTemplateExists ? '' : 'text-muted-foreground'}>
                    Apply morning routine template
                  </span>
                  {morningTemplateExists && morningTemplate && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {morningTemplate.name}
                    </Badge>
                  )}
                  {!morningTemplateExists && (
                    <span className="text-xs text-muted-foreground ml-1">(not set up)</span>
                  )}
                </div>
              </div>
              
              {/* Top tasks */}
              <div className="flex items-start gap-2">
                <CheckCircle2 className={cn(
                  'h-4 w-4 mt-0.5',
                  topTasks.length > 0 ? 'text-green-500' : 'text-muted-foreground'
                )} />
                <div>
                  <span>Highlight your top priorities</span>
                  {topTasks.length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {topTasks.slice(0, 3).map((task, idx) => (
                        <span key={task.id}>
                          {idx > 0 && ' · '}
                          {task.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Focus timer option */}
              <div className="flex items-start gap-2">
                <Timer className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Optional: Start a 25-minute focus session
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
