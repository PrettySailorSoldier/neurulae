import { useState, useMemo } from 'react';
import { Clock, Calendar, Search, AlertTriangle, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Routine, ScheduledRoutine, TimeBlock } from '@/types';
import { ROUTINE_CATEGORIES } from '@/data/routinePresets';
import { format, addDays, parse } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleRoutineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routines: Routine[];
  timeBlocks?: TimeBlock[];
  scheduledRoutines?: ScheduledRoutine[];
  onSchedule: (routine: Routine, date: string, startTime: string) => void;
  onScheduleAndStart: (routine: Routine, date: string, startTime: string) => void;
}

export function ScheduleRoutineModal({
  open,
  onOpenChange,
  routines,
  timeBlocks = [],
  scheduledRoutines = [],
  onSchedule,
  onScheduleAndStart,
}: ScheduleRoutineModalProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('09:00');

  // Filter routines
  const filteredRoutines = useMemo(() => {
    return routines.filter(routine => {
      const matchesSearch = routine.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || routine.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [routines, searchQuery, selectedCategory]);

  // Calculate end time
  const endTime = useMemo(() => {
    if (!selectedRoutine || !startTime) return null;
    const [hours, mins] = startTime.split(':').map(Number);
    const totalMins = hours * 60 + mins + selectedRoutine.totalEstimatedMinutes;
    const endHours = Math.floor(totalMins / 60) % 24;
    const endMins = totalMins % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  }, [selectedRoutine, startTime]);

  // Check for conflicts
  const conflicts = useMemo(() => {
    if (!selectedRoutine || !startTime || !endTime) return [];

    const startMins = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMins = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);

    const conflictingBlocks: string[] = [];

    // Check time blocks
    timeBlocks.forEach(block => {
      const blockStartMins = parseInt(block.startTime.split(':')[0]) * 60 + parseInt(block.startTime.split(':')[1]);
      const blockEndMins = parseInt(block.endTime.split(':')[0]) * 60 + parseInt(block.endTime.split(':')[1]);

      if (startMins < blockEndMins && endMins > blockStartMins) {
        conflictingBlocks.push(block.title);
      }
    });

    // Check already scheduled routines for the same date
    scheduledRoutines
      .filter(sr => sr.date === selectedDate)
      .forEach(sr => {
        const srStartMins = parseInt(sr.scheduledStartTime.split(':')[0]) * 60 +
          parseInt(sr.scheduledStartTime.split(':')[1]);
        // Calculate end based on steps
        const srDuration = sr.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
        const srEndMins = srStartMins + srDuration;

        if (startMins < srEndMins && endMins > srStartMins) {
          conflictingBlocks.push(`Another routine`);
        }
      });

    return conflictingBlocks;
  }, [selectedRoutine, startTime, endTime, selectedDate, timeBlocks, scheduledRoutines]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatTimeDisplay = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
  };

  const handleSchedule = () => {
    if (selectedRoutine) {
      onSchedule(selectedRoutine, selectedDate, startTime);
      onOpenChange(false);
      resetForm();
    }
  };

  const handleScheduleAndStart = () => {
    if (selectedRoutine) {
      onScheduleAndStart(selectedRoutine, selectedDate, startTime);
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedRoutine(null);
    setSearchQuery('');
    setStartTime('09:00');
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Pre-fill start time from routine anchor
  const handleSelectRoutine = (routine: Routine) => {
    setSelectedRoutine(routine);
    if (routine.anchorType === 'fixed_start' && routine.anchorTime) {
      setStartTime(routine.anchorTime);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Routine
          </DialogTitle>
          <DialogDescription>
            Add a routine to your Daily Flow schedule
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6">
          {!selectedRoutine ? (
            // Routine selection view
            <div className="flex-1 flex flex-col space-y-4 min-h-0">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search routines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category tabs */}
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  {ROUTINE_CATEGORIES.filter(c => c.id !== 'custom').map(category => (
                    <TabsTrigger key={category.id} value={category.id} className="text-xs gap-1">
                      <span>{category.icon}</span>
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Routine list */}
              <ScrollArea className="flex-1">
                <div className="space-y-2 pb-4">
                  {filteredRoutines.map(routine => {
                    const category = ROUTINE_CATEGORIES.find(c => c.id === routine.category);

                    return (
                      <button
                        key={routine.id}
                        onClick={() => handleSelectRoutine(routine)}
                        className="w-full p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{routine.icon || category?.icon || '📋'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{routine.name}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: `${category?.color}20`,
                                  color: category?.color
                                }}
                              >
                                {category?.label || 'Custom'}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(routine.totalEstimatedMinutes)}
                              </span>
                              <span>{routine.steps.length} steps</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {filteredRoutines.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No routines found</p>
                      <p className="text-sm">Try a different search or category</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            // Time selection view
            <div className="flex-1 space-y-6 py-4">
              {/* Selected routine summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedRoutine.icon || '📋'}</span>
                  <div>
                    <h3 className="font-medium">{selectedRoutine.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(selectedRoutine.totalEstimatedMinutes)} • {selectedRoutine.steps.length} steps
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setSelectedRoutine(null)}
                  >
                    Change
                  </Button>
                </div>
              </div>

              {/* Date selection */}
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedDate === format(new Date(), 'yyyy-MM-dd') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                  >
                    Today
                  </Button>
                  <Button
                    variant={selectedDate === format(addDays(new Date(), 1), 'yyyy-MM-dd') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
                  >
                    Tomorrow
                  </Button>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>

              {/* Time selection */}
              <div className="space-y-2">
                <Label>Start Time</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-32"
                  />
                  {endTime && (
                    <span className="text-sm text-muted-foreground">
                      → Ends at {formatTimeDisplay(endTime)}
                    </span>
                  )}
                </div>
              </div>

              {/* Conflict warning */}
              {conflicts.length > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      Schedule Conflict
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      This overlaps with: {conflicts.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="h-12 bg-muted/50 rounded-lg relative overflow-hidden">
                  {/* Simple timeline visualization */}
                  <div
                    className="absolute h-full bg-primary/20 border-l-2 border-primary"
                    style={{
                      left: `${(parseInt(startTime.split(':')[0]) / 24) * 100}%`,
                      width: `${(selectedRoutine.totalEstimatedMinutes / (24 * 60)) * 100}%`,
                    }}
                  >
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-medium text-primary truncate pr-2">
                      {selectedRoutine.name}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>12 AM</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedRoutine && (
            <>
              <Button
                variant="outline"
                onClick={handleScheduleAndStart}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Add & Start Now
              </Button>
              <Button onClick={handleSchedule}>
                Add to Schedule
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
