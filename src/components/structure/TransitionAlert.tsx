import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TransitionInfo, 
  TransitionWarnings, 
  TransitionRitual 
} from '@/lib/temporalContext';

interface TransitionAlertProps {
  upcomingTransition: TransitionInfo | null;
  transitionWarnings: TransitionWarnings;
  suggestedTransitionRitual: TransitionRitual | null;
}

export function TransitionAlert({
  upcomingTransition,
  transitionWarnings,
  suggestedTransitionRitual,
}: TransitionAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  // Reset dismissed state when transition changes
  useEffect(() => {
    setDismissed(false);
    setIsExpanded(false);
  }, [upcomingTransition?.fromPhase, upcomingTransition?.toPhase]);
  
  if (!upcomingTransition || dismissed) return null;
  
  // Determine urgency color
  const getUrgencyColor = () => {
    if (transitionWarnings.at1Minute) return 'border-red-500 bg-red-50 dark:bg-red-950/50';
    if (transitionWarnings.at5Minutes) return 'border-orange-500 bg-orange-50 dark:bg-orange-950/50';
    if (transitionWarnings.at10Minutes) return 'border-amber-500 bg-amber-50 dark:bg-amber-950/50';
    return 'border-blue-500 bg-blue-50 dark:bg-blue-950/50';
  };
  
  const getWarningIcon = () => {
    if (transitionWarnings.at5Minutes || transitionWarnings.at1Minute) {
      return <Clock className="h-4 w-4 animate-pulse" />;
    }
    return <Clock className="h-4 w-4" />;
  };
  
  const formatPhaseName = (phase: string) => {
    return phase.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  return (
    <Alert className={cn('mb-4 border-l-4', getUrgencyColor())}>
      <div className="flex items-start gap-3">
        {getWarningIcon()}
        <div className="flex-1">
          <AlertTitle className="mb-1 text-sm font-medium">
            {formatPhaseName(upcomingTransition.toPhase)} approaching in {upcomingTransition.minutesUntil} min
          </AlertTitle>
          <AlertDescription className="text-xs">
            {transitionWarnings.at5Minutes || transitionWarnings.at1Minute
              ? 'Time to start wrapping up'
              : 'Start thinking about transitioning soon'
            }
          </AlertDescription>
          
          {/* Ritual suggestion */}
          {suggestedTransitionRitual && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-auto p-0 text-xs font-medium hover:bg-transparent"
              >
                {suggestedTransitionRitual.title}
                {isExpanded ? (
                  <ChevronUp className="ml-1 h-3 w-3" />
                ) : (
                  <ChevronDown className="ml-1 h-3 w-3" />
                )}
              </Button>
              
              {isExpanded && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {suggestedTransitionRitual.description}
                    {' '}({suggestedTransitionRitual.estimatedDuration} min)
                  </p>
                  <ol className="space-y-1 text-xs ml-4">
                    {suggestedTransitionRitual.steps.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDismissed(true)}
          className="h-6 w-6 rounded-full"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Alert>
  );
}
