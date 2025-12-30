import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Task, ScheduledTask } from '@/types';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';

interface CalendarSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  scheduledTasks: ScheduledTask[];
  timeBlocks: Array<{ id: string; title: string }>;
  onScheduleTask: (taskId: string, blockId: string, date: string, estimatedMinutes?: number) => void;
}

export function CalendarScheduler({
  open,
  onOpenChange,
  tasks,
  scheduledTasks,
  timeBlocks,
  onScheduleTask
}: CalendarSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('30');
  const isMobile = useIsMobile();

  const unscheduledTasks = tasks.filter(task => !task.completed);
  
  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduledTasks.filter(st => st.date === dateStr);
  };

  const handleSchedule = () => {
    if (!selectedDate || !selectedTask || !selectedBlock) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const minutes = parseInt(estimatedMinutes) || undefined;
    
    onScheduleTask(selectedTask, selectedBlock, dateStr, minutes);
    
    // Reset form
    setSelectedTask('');
    setSelectedBlock('');
    setEstimatedMinutes('30');
  };

  const tasksOnSelectedDate = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[90vh] overflow-y-auto",
        isMobile ? "w-full max-w-full" : "max-w-4xl"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule Tasks
          </DialogTitle>
          <DialogDescription className="sr-only">Schedule a task to a date and time block</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-xl border bg-card/40 p-1"
              modifiers={{
                scheduled: (date) => getTasksForDate(date).length > 0
              }}
              modifiersStyles={{
                scheduled: {
                  fontWeight: 'bold',
                  textDecoration: 'underline'
                }
              }}
            />
            
            {selectedDate && tasksOnSelectedDate.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">
                  Tasks on {format(selectedDate, 'MMM d, yyyy')}
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {tasksOnSelectedDate.map(st => {
                    const task = tasks.find(t => t.id === st.taskId);
                    return task ? (
                      <div key={st.id} className="text-sm bg-card/50 rounded p-2 border border-border">
                        {task.title}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Scheduling Form */}
          <div className="space-y-4">
            <div>
              <Label>Select Date</Label>
              <div className="text-sm text-muted-foreground mt-1">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'No date selected'}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task">Task</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger id="task">
                  <SelectValue placeholder="Select a task..." />
                </SelectTrigger>
                <SelectContent>
                  {unscheduledTasks.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No unscheduled tasks</div>
                  ) : (
                    unscheduledTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeblock">Time Block</Label>
              <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                <SelectTrigger id="timeblock">
                  <SelectValue placeholder="Select a time block..." />
                </SelectTrigger>
                <SelectContent>
                  {timeBlocks.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Create time blocks in the timeline first
                    </div>
                  ) : (
                    timeBlocks.map(block => (
                      <SelectItem key={block.id} value={block.id}>
                        {block.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="30"
              />
            </div>

            <Button 
              onClick={handleSchedule}
              disabled={!selectedDate || !selectedTask || !selectedBlock}
              className="w-full btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
