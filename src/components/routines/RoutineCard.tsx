import { useState } from 'react';
import { Play, Pencil, Calendar, Trash2, Clock, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Routine } from '@/types';
import { ROUTINE_CATEGORIES } from '@/data/routinePresets';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

interface RoutineCardProps {
  routine: Routine;
  onStart: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onSchedule: (routine: Routine) => void;
  onDelete: (routineId: string) => void;
}

export function RoutineCard({
  routine,
  onStart,
  onEdit,
  onSchedule,
  onDelete,
}: RoutineCardProps) {
  const [expanded, setExpanded] = useState(false);

  const category = ROUTINE_CATEGORIES.find(c => c.id === routine.category);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getRepeatLabel = () => {
    if (!routine.repeatSchedule || routine.repeatSchedule.type === 'none') return null;

    switch (routine.repeatSchedule.type) {
      case 'daily':
        return 'Daily';
      case 'weekdays':
        return 'Weekdays';
      case 'weekends':
        return 'Weekends';
      case 'specific_days':
        const days = routine.repeatSchedule.days || [];
        const shortDays = days.map(d => d.slice(0, 3).charAt(0).toUpperCase() + d.slice(1, 3));
        return shortDays.join(', ');
      default:
        return null;
    }
  };

  const repeatLabel = getRepeatLabel();

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon and content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Category color bar */}
            <div
              className="w-1 h-full min-h-[60px] rounded-full flex-shrink-0"
              style={{ backgroundColor: category?.color || '#607D8B' }}
            />

            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg">{routine.icon || category?.icon || '📋'}</span>
                <h3 className="font-medium truncate">{routine.name}</h3>
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs" style={{
                  backgroundColor: `${category?.color}20`,
                  color: category?.color
                }}>
                  {category?.label || 'Custom'}
                </Badge>

                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(routine.totalEstimatedMinutes)}
                </span>

                <span className="text-xs text-muted-foreground">
                  {routine.steps.length} steps
                </span>

                {repeatLabel && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    {repeatLabel}
                  </span>
                )}
              </div>

              {/* Last used */}
              {routine.lastUsedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last used {formatDistanceToNow(new Date(routine.lastUsedAt), { addSuffix: true })}
                </p>
              )}

              {/* Expandable steps preview */}
              {expanded && routine.steps.length > 0 && (
                <div className="mt-3 space-y-1 border-t pt-2">
                  {routine.steps.slice(0, 5).map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-4 text-right">{idx + 1}.</span>
                      <span className="flex-1 truncate">{step.name}</span>
                      <span>{step.estimatedMinutes}m</span>
                    </div>
                  ))}
                  {routine.steps.length > 5 && (
                    <p className="text-xs text-muted-foreground pl-6">
                      +{routine.steps.length - 5} more steps
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <Button
            size="sm"
            onClick={() => onStart(routine)}
            className="gap-1"
          >
            <Play className="h-3 w-3" />
            Start
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(routine)}
            className="gap-1"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSchedule(routine)}
            className="gap-1"
          >
            <Calendar className="h-3 w-3" />
            Schedule
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-auto text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Routine</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{routine.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(routine.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
