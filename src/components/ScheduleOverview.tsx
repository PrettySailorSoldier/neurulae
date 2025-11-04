import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ScheduleEntry {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category?: string;
  location?: string;
  source?: string;
}

export function ScheduleOverview() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayEntriesDialogOpen, setDayEntriesDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadMonthSchedule();
    }
  }, [user, currentMonth]);

  const loadMonthSchedule = async () => {
    if (!user) return;

    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));

    const { data, error } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time');

    if (error) {
      console.error('Error loading schedule:', error);
      return;
    }

    setScheduleEntries(data || []);
  };

  const getDayEntries = (date: Date): ScheduleEntry[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return scheduleEntries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= dayStart && entryDate <= dayEnd;
    });
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      work: 'hsl(var(--chart-1))',
      class: 'hsl(var(--chart-2))',
      homework: 'hsl(var(--chart-3))',
      personal: 'hsl(var(--chart-4))',
      other: 'hsl(var(--chart-5))',
    };
    return colors[category || 'other'] || colors.other;
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const selectedDayEntries = selectedDate ? getDayEntries(selectedDate) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map(day => {
            const dayEntries = getDayEntries(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  if (dayEntries.length > 0) {
                    setSelectedDate(day);
                    setDayEntriesDialogOpen(true);
                  }
                }}
                className={`
                  aspect-square p-1 rounded-lg border transition-all
                  ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
                  ${isCurrentDay ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                  ${dayEntries.length > 0 ? 'hover:border-primary cursor-pointer' : 'cursor-default'}
                `}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-xs ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayEntries.length > 0 && (
                    <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                      {dayEntries.slice(0, 2).map((entry, idx) => (
                        <div
                          key={idx}
                          className="h-1 rounded-full w-full"
                          style={{ backgroundColor: getCategoryColor(entry.category) }}
                        />
                      ))}
                      {dayEntries.length > 2 && (
                        <span className="text-[10px] text-muted-foreground text-center">
                          +{dayEntries.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Categories:</span>
          {['work', 'class', 'homework', 'personal', 'other'].map(cat => (
            <div key={cat} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getCategoryColor(cat) }}
              />
              <span className="text-xs text-muted-foreground capitalize">{cat}</span>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Day Details Dialog */}
      <Dialog open={dayEntriesDialogOpen} onOpenChange={setDayEntriesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedDayEntries.map(entry => {
              const startTime = new Date(entry.start_time);
              const endTime = new Date(entry.end_time);
              
              return (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-1 h-full rounded-full" 
                        style={{ backgroundColor: getCategoryColor(entry.category) }}
                      />
                      <div className="space-y-1">
                        <h4 className="font-semibold">{entry.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                        </p>
                        {entry.location && (
                          <p className="text-sm text-muted-foreground">📍 {entry.location}</p>
                        )}
                        {entry.description && (
                          <p className="text-sm text-muted-foreground">{entry.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">{entry.category || 'other'}</Badge>
                  </div>
                </Card>
              );
            })}
            {selectedDayEntries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No schedule entries for this day
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
