import { useState, useEffect, useMemo } from 'react';
import { TimeBlock, ScheduledTask, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { TimeBlockEditor } from './TimeBlockEditor';
import { Plus, Trash2, Clock, Moon, Briefcase, Sun, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  timeToPercentage,
  getCurrentTimePercentage,
  getCurrentTime,
  isTimeInRange,
  timeToMinutes,
  getComputedTimeZones,
  isTaskAvailableInTimeZone,
  formatTimeDisplay,
  type TimeZoneConfig
} from '@/lib/timeUtils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useTimeZoneSettings } from '@/hooks/useTimeZoneSettings';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { TimeZoneSettingsDialog } from './TimeZoneSettingsDialog';

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

interface DailyFlowTimelineProps {
  timeBlocks: TimeBlock[];
  scheduledTasks: ScheduledTask[];
  tasks: Task[];
  onAddTimeBlock: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onUpdateTimeBlock: (id: string, block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onDeleteTimeBlock: (id: string) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

export function DailyFlowTimeline({
  timeBlocks,
  scheduledTasks,
  tasks,
  onAddTimeBlock,
  onUpdateTimeBlock,
  onDeleteTimeBlock,
  onAddTask,
}: DailyFlowTimelineProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings: timeZoneSettings, setSettings: setTimeZoneSettings, updateQuietHours, updateBusinessHours } = useTimeZoneSettings();

  const [currentTimePercentage, setCurrentTimePercentage] = useState(getCurrentTimePercentage());
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState(formatTimeDisplay(getCurrentTime()));
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isTimeBlockEditorOpen, setIsTimeBlockEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>();
  const [scheduleType, setScheduleType] = useState<'weekday' | 'weekend'>(() => {
    const day = new Date().getDay();
    return (day === 0 || day === 6) ? 'weekend' : 'weekday';
  });
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [clearScheduleDialogOpen, setClearScheduleDialogOpen] = useState(false);
  const [showTimeZoneSettings, setShowTimeZoneSettings] = useState(false);
  const [showAvailableTasks, setShowAvailableTasks] = useState(true);

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTimePercentage(getCurrentTimePercentage());
      setCurrentTimeDisplay(formatTimeDisplay(getCurrentTime()));
    };

    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      loadScheduleEntries();
    }
  }, [user]);

  // Compute time zones based on settings
  const timeZoneConfig: TimeZoneConfig = useMemo(() => ({
    quietHours: timeZoneSettings.quietHours,
    businessHours: timeZoneSettings.businessHours,
    customZones: timeZoneSettings.customZones,
  }), [timeZoneSettings]);

  const computedZones = useMemo(() =>
    getComputedTimeZones(timeZoneConfig),
    [timeZoneConfig]
  );

  // Categorize tasks by availability
  const { availableTasks, unavailableTasks } = useMemo(() => {
    const incomplete = tasks.filter(t => !t.completed);
    const available: Task[] = [];
    const unavailable: { task: Task; reason: string }[] = [];

    for (const task of incomplete) {
      const result = isTaskAvailableInTimeZone(task, timeZoneConfig);
      if (result.available) {
        available.push(task);
      } else {
        unavailable.push({ task, reason: result.reason || 'Not available now' });
      }
    }

    return { availableTasks: available, unavailableTasks: unavailable };
  }, [tasks, timeZoneConfig]);

  const loadScheduleEntries = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('schedule_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setScheduleEntries(data || []);
    } catch (error) {
      console.error('Error loading schedule entries:', error);
    }
  };

  const handleClearSchedule = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: deletedEntries, error } = await supabase
        .from('schedule_entries')
        .delete()
        .eq('user_id', user.id)
        .gte('start_time', today.toISOString())
        .select();

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      await loadScheduleEntries();

      toast({
        title: "Schedule Cleared",
        description: `Removed ${deletedEntries?.length || 0} schedule entries from today onwards.`,
      });
    } catch (error) {
      console.error('Error clearing schedule:', error);
      toast({
        title: "Error",
        description: "Failed to clear schedule entries.",
        variant: "destructive",
      });
    } finally {
      setClearScheduleDialogOpen(false);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
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

  const groupOverlappingEntries = (entries: ScheduleEntry[]) => {
    const groups: ScheduleEntry[][] = [];

    entries.forEach(entry => {
      const entryStart = new Date(entry.start_time).getTime();
      const entryEnd = new Date(entry.end_time).getTime();

      let addedToGroup = false;
      for (const group of groups) {
        const hasOverlap = group.some(e => {
          const eStart = new Date(e.start_time).getTime();
          const eEnd = new Date(e.end_time).getTime();
          return (entryStart < eEnd && entryEnd > eStart);
        });

        if (hasOverlap) {
          group.push(entry);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        groups.push([entry]);
      }
    });

    return groups;
  };

  const dedupeEntries = (entries: ScheduleEntry[]) => {
    const seen = new Set<string>();
    return entries.filter((e) => {
      const key = `${e.title}|${e.start_time}|${e.end_time}|${e.location || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const renderScheduleEntry = (entry: ScheduleEntry, groupIndex: number, totalInGroup: number) => {
    const startDate = new Date(entry.start_time);
    const endDate = new Date(entry.end_time);

    const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

    const topPercentage = timeToPercentage(startTime);
    const bottomPercentage = timeToPercentage(endTime);
    const height = bottomPercentage - topPercentage;

    const color = getCategoryColor(entry.category);

    return (
      <div
        key={entry.id}
        className="absolute border rounded-md p-2 overflow-hidden pointer-events-none shadow-sm"
        style={{
          top: `${topPercentage}%`,
          height: `${height}%`,
          left: `${80 + groupIndex * 12}px`,
          width: `calc(100% - ${80 + groupIndex * 12}px - 8px)`,
          backgroundColor: `${color}30`,
          borderColor: color,
          zIndex: 5 + groupIndex,
        }}
      >
        <div className="space-y-0.5">
          <h4 className="font-semibold text-sm leading-tight truncate whitespace-nowrap">{entry.title}</h4>
          <p className="text-[11px] text-muted-foreground">
            {formatTime(startDate)} - {formatTime(endDate)}
          </p>
          {entry.location && (
            <p className="text-[11px] text-muted-foreground truncate">{entry.location}</p>
          )}
        </div>
      </div>
    );
  };

  const renderBlock = (block: TimeBlock, isActive: boolean) => {
    const topPercentage = timeToPercentage(block.startTime);
    const bottomPercentage = timeToPercentage(block.endTime);
    const height = bottomPercentage - topPercentage;

    return (
      <div
        key={block.id}
        className={`absolute border rounded-lg p-1.5 cursor-pointer transition-all hover:shadow-lg ${
          isActive ? 'bg-primary/20 border-primary ring-2 ring-primary/50' : 'bg-card/80 border-border'
        }`}
        style={{
          top: `${topPercentage}%`,
          height: `${height}%`,
          left: '80px',
          right: '8px',
          backgroundColor: block.color ? `${block.color}20` : undefined,
          borderColor: block.color || undefined,
          zIndex: 3,
        }}
        onClick={() => {
          setEditingBlock(block);
          setIsTimeBlockEditorOpen(true);
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-xs truncate">{block.title}</h4>
            <p className="text-[10px] text-muted-foreground">
              {block.startTime} - {block.endTime}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render a time zone background region
  const renderTimeZone = (zone: { id: string; name: string; startPercentage: number; heightPercentage: number; color: string; isActive: boolean }) => {
    const getZoneIcon = (name: string) => {
      if (name.toLowerCase().includes('quiet')) return <Moon className="h-3 w-3" />;
      if (name.toLowerCase().includes('business')) return <Briefcase className="h-3 w-3" />;
      return <Sun className="h-3 w-3" />;
    };

    return (
      <div
        key={zone.id}
        className={cn(
          "absolute left-0 right-0 transition-all duration-300",
          zone.isActive && "ring-1 ring-inset ring-primary/30"
        )}
        style={{
          top: `${zone.startPercentage}%`,
          height: `${zone.heightPercentage}%`,
          backgroundColor: zone.color,
          zIndex: 1,
        }}
      >
        {/* Zone label on the right edge */}
        <div
          className={cn(
            "absolute right-1 top-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            zone.isActive
              ? "bg-primary/20 text-primary"
              : "bg-background/60 text-muted-foreground"
          )}
        >
          {getZoneIcon(zone.name)}
          <span className="hidden sm:inline">{zone.name}</span>
        </div>
      </div>
    );
  };

  const filteredBlocks = timeBlocks.filter(block => {
    if (block.scheduleType === 'everyday') return true;
    if (block.scheduleType === 'weekday') return scheduleType === 'weekday';
    if (block.scheduleType === 'weekend') return scheduleType === 'weekend';
    return true;
  });

  const currentTime = getCurrentTime();

  const filteredEntries = categoryFilter
    ? scheduleEntries.filter(e => e.category === categoryFilter)
    : scheduleEntries;

  const categoryCounts = scheduleEntries.reduce((acc, entry) => {
    const cat = entry.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get current active zone for display
  const activeZone = computedZones.find(z => z.isActive);

  return (
    <section className="space-y-4">
      {/* Dialogs */}
      <AlertDialog open={clearScheduleDialogOpen} onOpenChange={setClearScheduleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Schedule Entries?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all schedule entries from today onwards. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearSchedule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Block Editor */}
      <TimeBlockEditor
        open={isTimeBlockEditorOpen}
        onOpenChange={setIsTimeBlockEditorOpen}
        block={editingBlock}
        onSave={(blockData) => {
          if (editingBlock) {
            onUpdateTimeBlock(editingBlock.id, blockData);
          } else {
            onAddTimeBlock(blockData);
          }
          setIsTimeBlockEditorOpen(false);
          setEditingBlock(undefined);
        }}
        onDelete={editingBlock ? () => {
          onDeleteTimeBlock(editingBlock.id);
          setIsTimeBlockEditorOpen(false);
          setEditingBlock(undefined);
        } : undefined}
      />

      {/* Time Zone Settings Dialog */}
      <TimeZoneSettingsDialog
        open={showTimeZoneSettings}
        onOpenChange={setShowTimeZoneSettings}
        settings={timeZoneSettings}
        onSave={setTimeZoneSettings}
      />

      {/* Header with Current Time Display */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Daily Flow</h3>
          </div>
          {/* Current time and zone indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">{currentTimeDisplay}</span>
            {activeZone && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {activeZone.name}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScheduleType('weekday')}
            className={scheduleType === 'weekday' ? 'bg-accent' : ''}
          >
            Weekday
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScheduleType('weekend')}
            className={scheduleType === 'weekend' ? 'bg-accent' : ''}
          >
            Weekend
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingBlock(undefined);
              setIsTimeBlockEditorOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Time Block
          </Button>
          {scheduleEntries.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearScheduleDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Schedule
            </Button>
          )}
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'timeline' | 'list')}>
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Timeline View (3/4 width on large screens) */}
        <div className={cn("space-y-3", viewMode === 'timeline' ? 'lg:col-span-3' : 'lg:col-span-4')}>
          {viewMode === 'timeline' ? (
            <div className="relative h-[600px] bg-card/50 border border-border rounded-lg overflow-hidden">
              {/* Time Zone Background Regions */}
              {computedZones.map(zone => renderTimeZone(zone))}

              {/* Hour markers */}
              <div className="absolute left-0 top-0 bottom-0 w-16 text-xs text-muted-foreground z-10 bg-gradient-to-r from-background/80 to-transparent">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-2 flex items-center"
                    style={{ top: `${(i / 24) * 100}%`, transform: 'translateY(-50%)' }}
                  >
                    <span className={cn(
                      "font-mono",
                      Math.floor(currentTimePercentage / (100/24)) === i && "text-primary font-bold"
                    )}>
                      {i.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Time Blocks */}
              {filteredBlocks.map(block =>
                renderBlock(block, isTimeInRange(currentTime, block.startTime, block.endTime))
              )}

              {/* Schedule Entries */}
              {groupOverlappingEntries(dedupeEntries(filteredEntries)).map(group =>
                group.map((entry, idx) => renderScheduleEntry(entry, idx, group.length))
              )}

              {/* NOW Indicator - Full Width, Prominent */}
              <div
                className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{ top: `${currentTimePercentage}%` }}
              >
                {/* Glow effect */}
                <div className="absolute inset-x-0 -top-1 h-2 bg-gradient-to-b from-primary/30 to-transparent" />
                <div className="absolute inset-x-0 -bottom-1 h-2 bg-gradient-to-t from-primary/30 to-transparent" />

                {/* Main line */}
                <div className="h-0.5 bg-primary shadow-[0_0_8px_2px] shadow-primary/50" />

                {/* Time label */}
                <div className="absolute left-16 -top-3 flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
                  <span className="text-xs font-bold text-primary bg-background/90 px-2 py-0.5 rounded-full border border-primary/30">
                    NOW
                  </span>
                </div>
              </div>

              {/* Empty state */}
              {filteredEntries.length === 0 && filteredBlocks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-5">
                  <p className="text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-lg">
                    Add time blocks to visualize your day
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {dedupeEntries(filteredEntries).map((entry) => {
                const startDate = new Date(entry.start_time);
                const endDate = new Date(entry.end_time);
                const color = getCategoryColor(entry.category);

                return (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-1 h-full min-h-[40px] rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <div className="space-y-1">
                          <h4 className="font-semibold">{entry.title}</h4>
                          {entry.location && (
                            <p className="text-sm font-medium text-primary">{entry.location}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {formatTime(startDate)} - {formatTime(endDate)}
                          </p>
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
              {filteredEntries.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground">No schedule entries found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Task Availability Panel (1/4 width on large screens, only in timeline view) */}
        {viewMode === 'timeline' && (
          <div className="space-y-3">
            <Collapsible open={showAvailableTasks} onOpenChange={setShowAvailableTasks}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-semibold text-sm">Available Now</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {availableTasks.length}
                    </Badge>
                  </div>
                  {showAvailableTasks ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {availableTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No tasks available right now
                  </p>
                ) : (
                  availableTasks.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      className="p-2 rounded-md bg-green-500/10 border border-green-500/20 text-xs"
                    >
                      <p className="font-medium truncate">{task.title}</p>
                      {task.taskType && (
                        <Badge variant="outline" className="text-[9px] mt-1">
                          {task.taskType}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
                {availableTasks.length > 5 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    +{availableTasks.length - 5} more
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Unavailable Tasks */}
            {unavailableTasks.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-2">
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <span className="font-semibold text-sm text-muted-foreground">Not Now</span>
                  <Badge variant="outline" className="text-[10px]">
                    {unavailableTasks.length}
                  </Badge>
                </div>
                {unavailableTasks.slice(0, 3).map(({ task, reason }) => (
                  <div
                    key={task.id}
                    className="p-2 rounded-md bg-muted/30 border border-border text-xs opacity-60"
                  >
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground">{reason}</p>
                  </div>
                ))}
                {unavailableTasks.length > 3 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    +{unavailableTasks.length - 3} more
                  </p>
                )}
              </div>
            )}

            {/* Quick Settings */}
            <Card className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground">Time Zone Settings</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowTimeZoneSettings(true)}
                >
                  <Settings2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Moon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Quiet Hours</span>
                </div>
                <Button
                  variant={timeZoneSettings.quietHours.enabled ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => updateQuietHours({ enabled: !timeZoneSettings.quietHours.enabled })}
                >
                  {timeZoneSettings.quietHours.enabled ? 'On' : 'Off'}
                </Button>
              </div>
              {timeZoneSettings.quietHours.enabled && (
                <p className="text-[10px] text-muted-foreground pl-4">
                  {formatTimeDisplay(timeZoneSettings.quietHours.startTime)} - {formatTimeDisplay(timeZoneSettings.quietHours.endTime)}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Business Hours</span>
                </div>
                <Button
                  variant={timeZoneSettings.businessHours.enabled ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => updateBusinessHours({ enabled: !timeZoneSettings.businessHours.enabled })}
                >
                  {timeZoneSettings.businessHours.enabled ? 'On' : 'Off'}
                </Button>
              </div>
              {timeZoneSettings.businessHours.enabled && (
                <p className="text-[10px] text-muted-foreground pl-4">
                  {formatTimeDisplay(timeZoneSettings.businessHours.startTime)} - {formatTimeDisplay(timeZoneSettings.businessHours.endTime)}
                  {timeZoneSettings.businessHours.weekdaysOnly && ' (weekdays)'}
                </p>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Category Filters (only show if there are schedule entries) */}
      {scheduleEntries.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filter:</span>
          <Button
            variant={categoryFilter === null ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setCategoryFilter(null)}
          >
            All ({scheduleEntries.length})
          </Button>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat} ({count})
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}
