import { useState, useMemo } from 'react';
import { Clock, Calendar, ChevronDown, ChevronUp, BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoutineCompletionRecord, Routine } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ROUTINE_STORAGE_KEYS } from '@/types';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface RoutineHistoryViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routines: Routine[];
  onAdjustEstimates?: (routineId: string, suggestions: { stepName: string; suggested: number }[]) => void;
}

export function RoutineHistoryView({
  open,
  onOpenChange,
  routines,
  onAdjustEstimates,
}: RoutineHistoryViewProps) {
  const [history] = useLocalStorage<RoutineCompletionRecord[]>(ROUTINE_STORAGE_KEYS.ROUTINE_HISTORY, []);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('all');
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  // Filter history by selected routine
  const filteredHistory = useMemo(() => {
    if (selectedRoutineId === 'all') return history;
    return history.filter(h => h.routineId === selectedRoutineId);
  }, [history, selectedRoutineId]);

  // Calculate statistics per routine
  const routineStats = useMemo(() => {
    const stats: Record<string, {
      totalRuns: number;
      completedRuns: number;
      avgActual: number;
      avgEstimated: number;
      avgDifference: number;
      skippedSteps: Record<string, number>;
      bestTimeOfDay: string;
    }> = {};

    history.forEach(record => {
      if (!stats[record.routineId]) {
        stats[record.routineId] = {
          totalRuns: 0,
          completedRuns: 0,
          avgActual: 0,
          avgEstimated: 0,
          avgDifference: 0,
          skippedSteps: {},
          bestTimeOfDay: 'morning',
        };
      }

      const stat = stats[record.routineId];
      stat.totalRuns++;

      if (record.stepsCompleted === record.stepsCompleted + record.stepsSkipped) {
        stat.completedRuns++;
      }

      stat.avgActual = ((stat.avgActual * (stat.totalRuns - 1)) + record.actualMinutes) / stat.totalRuns;
      stat.avgEstimated = ((stat.avgEstimated * (stat.totalRuns - 1)) + record.estimatedMinutes) / stat.totalRuns;
      stat.avgDifference = stat.avgActual - stat.avgEstimated;

      record.stepBreakdown.forEach(step => {
        if (step.wasSkipped) {
          stat.skippedSteps[step.stepName] = (stat.skippedSteps[step.stepName] || 0) + 1;
        }
      });
    });

    return stats;
  }, [history]);

  // Get insights for a specific routine
  const getInsights = (routineId: string) => {
    const stat = routineStats[routineId];
    if (!stat) return [];

    const insights: string[] = [];

    if (stat.avgDifference > 5) {
      insights.push(`You usually underestimate this routine by ~${Math.round(stat.avgDifference)} minutes`);
    } else if (stat.avgDifference < -5) {
      insights.push(`You usually finish ${Math.abs(Math.round(stat.avgDifference))} minutes faster than estimated`);
    }

    const mostSkipped = Object.entries(stat.skippedSteps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    if (mostSkipped.length > 0 && mostSkipped[0][1] >= 2) {
      insights.push(`Most skipped step: "${mostSkipped[0][0]}" (${mostSkipped[0][1]} times)`);
    }

    return insights;
  };

  // Get step adjustment suggestions
  const getStepSuggestions = (routineId: string) => {
    const records = history.filter(h => h.routineId === routineId);
    if (records.length < 3) return []; // Need enough data

    const stepAverages: Record<string, { total: number; count: number }> = {};

    records.forEach(record => {
      record.stepBreakdown.forEach(step => {
        if (!step.wasSkipped && step.actual > 0) {
          if (!stepAverages[step.stepName]) {
            stepAverages[step.stepName] = { total: 0, count: 0 };
          }
          stepAverages[step.stepName].total += step.actual;
          stepAverages[step.stepName].count++;
        }
      });
    });

    const suggestions: { stepName: string; suggested: number; current?: number }[] = [];

    Object.entries(stepAverages).forEach(([stepName, data]) => {
      const avg = Math.round(data.total / data.count);
      const routine = routines.find(r => r.id === routineId);
      const step = routine?.steps.find(s => s.name === stepName);

      if (step && avg > step.estimatedMinutes * 1.2) {
        suggestions.push({
          stepName,
          suggested: avg,
          current: step.estimatedMinutes,
        });
      }
    });

    return suggestions;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const toggleExpanded = (id: string) => {
    setExpandedRecords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedStats = selectedRoutineId !== 'all' ? routineStats[selectedRoutineId] : null;
  const selectedInsights = selectedRoutineId !== 'all' ? getInsights(selectedRoutineId) : [];
  const selectedSuggestions = selectedRoutineId !== 'all' ? getStepSuggestions(selectedRoutineId) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Routine History
          </DialogTitle>
          <DialogDescription>
            View past routine completions and track patterns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter */}
          <Select value={selectedRoutineId} onValueChange={setSelectedRoutineId}>
            <SelectTrigger>
              <SelectValue placeholder="Select routine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Routines</SelectItem>
              {routines.map(routine => (
                <SelectItem key={routine.id} value={routine.id}>
                  {routine.icon || '📋'} {routine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Statistics */}
          {selectedStats && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Completions</p>
                <p className="text-lg font-semibold">{selectedStats.totalRuns}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Avg. Duration</p>
                <p className="text-lg font-semibold">{formatDuration(selectedStats.avgActual)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">vs Estimate</p>
                <div className="flex items-center justify-center gap-1">
                  {selectedStats.avgDifference > 2 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : selectedStats.avgDifference < -2 ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn(
                    'text-lg font-semibold',
                    selectedStats.avgDifference > 2 && 'text-red-500',
                    selectedStats.avgDifference < -2 && 'text-green-500'
                  )}>
                    {selectedStats.avgDifference > 0 ? '+' : ''}{Math.round(selectedStats.avgDifference)}m
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Insights */}
          {selectedInsights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Insights</h4>
              {selectedInsights.map((insight, idx) => (
                <p key={idx} className="text-sm text-muted-foreground p-2 bg-primary/5 rounded">
                  {insight}
                </p>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {selectedSuggestions.length > 0 && onAdjustEstimates && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">
                Suggested Adjustments
              </h4>
              <div className="space-y-1 text-sm">
                {selectedSuggestions.map((s, idx) => (
                  <p key={idx} className="text-yellow-600 dark:text-yellow-500">
                    Consider increasing "{s.stepName}" from {s.current}m to {s.suggested}m
                  </p>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => onAdjustEstimates(selectedRoutineId, selectedSuggestions)}
              >
                Apply Suggestions
              </Button>
            </div>
          )}
        </div>

        {/* History list */}
        <ScrollArea className="flex-1 mt-4">
          <div className="space-y-2 pr-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No routine history yet</p>
                <p className="text-sm">Complete a routine to see it here</p>
              </div>
            ) : (
              filteredHistory.map(record => {
                const routine = routines.find(r => r.id === record.routineId);
                const isExpanded = expandedRecords.has(record.id);
                const difference = record.actualMinutes - record.estimatedMinutes;

                return (
                  <Collapsible
                    key={record.id}
                    open={isExpanded}
                    onOpenChange={() => toggleExpanded(record.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-3 border rounded-lg hover:bg-muted/50 text-left">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{routine?.icon || '📋'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {routine?.name || 'Unknown Routine'}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {record.stepsCompleted}/{record.stepsCompleted + record.stepsSkipped} steps
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{format(parseISO(record.date), 'MMM d, yyyy')}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(record.actualMinutes)}
                              </span>
                              <span className={cn(
                                difference > 5 && 'text-red-500',
                                difference < -5 && 'text-green-500'
                              )}>
                                ({difference > 0 ? '+' : ''}{difference}m vs est.)
                              </span>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 ml-12 space-y-1">
                      {record.stepBreakdown.map((step, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'flex items-center gap-2 text-sm p-1',
                            step.wasSkipped && 'opacity-50 line-through'
                          )}
                        >
                          <span className="flex-1">{step.stepName}</span>
                          <span className="text-muted-foreground">{step.estimated}m</span>
                          {!step.wasSkipped && (
                            <>
                              <span className="text-muted-foreground">→</span>
                              <span className={cn(
                                step.actual > step.estimated * 1.2 && 'text-yellow-600 font-medium'
                              )}>
                                {step.actual}m
                              </span>
                            </>
                          )}
                          {step.wasSkipped && (
                            <Badge variant="outline" className="text-xs">
                              Skipped
                            </Badge>
                          )}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
