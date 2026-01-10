import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Plus, 
  Lightbulb, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sunrise,
  Moon,
  UtensilsCrossed,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StructureAnalysis, StructureSuggestion } from '@/hooks/useStructureAnalysis';

interface StructureCoachProps {
  analysis: StructureAnalysis;
  onAcceptSuggestion: (suggestion: StructureSuggestion) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onOpenTemplates: () => void;
  className?: string;
}

export function StructureCoach({
  analysis,
  onAcceptSuggestion,
  onDismissSuggestion,
  onOpenTemplates,
  className
}: StructureCoachProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const visibleSuggestions = analysis.suggestions.filter(s => !dismissedSuggestions.has(s.id));

  const handleDismiss = (id: string) => {
    setDismissedSuggestions(prev => new Set([...prev, id]));
    onDismissSuggestion(id);
  };

  const getStatusColor = (status: StructureAnalysis['status']) => {
    switch (status) {
      case 'empty': return 'text-muted-foreground';
      case 'minimal': return 'text-amber-500';
      case 'partial': return 'text-blue-500';
      case 'good': return 'text-green-500';
      case 'excellent': return 'text-emerald-500';
      case 'overloaded': return 'text-orange-500';
    }
  };

  const getIconForSuggestion = (suggestion: StructureSuggestion) => {
    switch (suggestion.icon) {
      case 'Sunrise': return Sunrise;
      case 'Moon': return Moon;
      case 'UtensilsCrossed': return UtensilsCrossed;
      case 'Briefcase': return Briefcase;
      default: return Plus;
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={cn('border-dashed', className)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Structure Coach
                    <Badge variant="outline" className={cn('text-xs', getStatusColor(analysis.status))}>
                      {analysis.statusEmoji} {analysis.score.overall}%
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{analysis.statusMessage}</p>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Structure Coverage</span>
                <span>{analysis.structuredTimePercent}% of waking hours</span>
              </div>
              <Progress value={analysis.structuredTimePercent} className="h-2" />
            </div>

            {/* Current Phase Info */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{analysis.context.phaseLabel}</span>
                <span className="text-muted-foreground"> · Good for </span>
                <span className="text-primary">{analysis.context.suggestedFocus}</span>
              </span>
              {analysis.context.minutesUntilPhaseChange <= 30 && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {analysis.context.nextPhaseLabel} in {analysis.context.minutesUntilPhaseChange}m
                </Badge>
              )}
            </div>

            {/* Suggestions */}
            {visibleSuggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Suggestions
                </h4>
                <div className="space-y-2">
                  {visibleSuggestions.slice(0, 3).map(suggestion => {
                    const Icon = getIconForSuggestion(suggestion);
                    return (
                      <div
                        key={suggestion.id}
                        className="flex items-center gap-3 p-2 rounded-lg border border-dashed hover:border-primary/50 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="p-1.5 rounded bg-muted">
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.suggestedTime.start} - {suggestion.suggestedTime.end}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => handleDismiss(suggestion.id)}
                          >
                            Skip
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => onAcceptSuggestion(suggestion)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Insights */}
            {analysis.insights.length > 0 && (
              <div className="space-y-2">
                {analysis.insights.slice(0, 2).map((insight, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-lg text-xs',
                      insight.type === 'consistent' && 'bg-green-500/10 text-green-700 dark:text-green-400',
                      insight.type === 'missing' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                      insight.type === 'inconsistent' && 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
                      insight.type === 'opportunity' && 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                    )}
                  >
                    {insight.type === 'consistent' ? (
                      <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{insight.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onOpenTemplates}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Use Template
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
