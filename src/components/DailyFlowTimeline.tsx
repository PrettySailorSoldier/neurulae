import { useState, useEffect, useRef } from 'react';
import { TimeBlock, ScheduledTask, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { TimeBlockEditor } from './TimeBlockEditor';
import { ScheduledTaskCard } from './ScheduledTaskCard';
import { Plus, Sparkles, Loader2, Calendar, CalendarCheck, Trash2 } from 'lucide-react';
import { timeToPercentage, getCurrentTimePercentage, getCurrentTime, isTimeInRange, timeToMinutes, isWeekday } from '@/lib/timeUtils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

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
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  
  const [currentTimePercentage, setCurrentTimePercentage] = useState(getCurrentTimePercentage());
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isTimeBlockEditorOpen, setIsTimeBlockEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>();
  const [scheduleType, setScheduleType] = useState<'weekday' | 'weekend'>(() => {
    const day = new Date().getDay();
    return (day === 0 || day === 6) ? 'weekend' : 'weekday';
  });
  const [activeDedicatedBlock, setActiveDedicatedBlock] = useState<TimeBlock | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<any>(null);
  const [clearScheduleDialogOpen, setClearScheduleDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimePercentage(getCurrentTimePercentage());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      loadScheduleEntries();
    }
  }, [user]);

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

  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !user) return;
    
    setIsUploading(true);
    const file = event.target.files[0];
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data, error } = await supabase.functions.invoke('parse-assignment-screenshot', {
        body: formData,
      });

      if (error) throw error;

      const { entries, count } = data;
      console.log('Extracted assignments from screenshot:', entries);

      if (!entries || entries.length === 0) {
        toast({
          title: "No Assignments Found",
          description: "Could not extract any assignments from this screenshot. Please try a clearer image.",
          variant: "destructive",
        });
        setIsUploading(false);
        if (event.target) event.target.value = '';
        return;
      }

      // Check for duplicates
      const startDate = new Date(entries[0].startTime);
      const endDate = new Date(entries[entries.length - 1].endTime);

      const { data: existingEntries, error: checkError } = await supabase
        .from('schedule_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());

      if (checkError) throw checkError;

      // Check for duplicates
      const duplicates = entries.filter((newEntry: any) =>
        existingEntries?.some((existing: any) =>
          existing.title === newEntry.title &&
          existing.start_time === newEntry.startTime
        )
      );

      if (duplicates.length > 0 && existingEntries && existingEntries.length > 0) {
        setPendingUploadData({ entries, existingEntries, startDate, endDate });
        setDuplicateDialogOpen(true);
        setIsUploading(false);
        if (event.target) event.target.value = '';
        return;
      }

      // No duplicates, proceed with upload
      await proceedWithUpload(entries);
      
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process screenshot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const proceedWithUpload = async (entries: any[], replaceExisting: boolean = false) => {
    if (!user) return;

    try {
      if (entries && entries.length > 0) {
        // If replacing, delete existing entries in date range
        if (replaceExisting && pendingUploadData) {
          const { startDate, endDate } = pendingUploadData;
          const { error: deleteError } = await supabase
            .from('schedule_entries')
            .delete()
            .eq('user_id', user.id)
            .gte('start_time', startDate.toISOString())
            .lte('start_time', endDate.toISOString());

          if (deleteError) throw deleteError;
        }

        const scheduleEntries = entries.map((entry: any) => ({
          user_id: user.id,
          title: entry.title || 'Untitled',
          description: entry.description || entry.category || null,
          start_time: entry.startTime,
          end_time: entry.endTime,
          category: entry.category || 'other',
          location: entry.location || null,
          source: 'imported'
        }));

        const { error: insertError } = await supabase
          .from('schedule_entries')
          .insert(scheduleEntries);

        if (insertError) throw insertError;

        await loadScheduleEntries();
        
        toast({
          title: "✅ Schedule Imported",
          description: `Added ${scheduleEntries.length} entries.`,
        });
      }

      setPendingUploadData(null);
    } catch (error) {
      console.error('Error in proceedWithUpload:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error importing your schedule.",
        variant: "destructive",
      });
    }
  };

  const handleClearSchedule = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Delete all schedule entries from today onwards (not just next 7 days)
      // This covers entries with any source type (work, class, homework, imported)
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

      console.log(`Deleted ${deletedEntries?.length || 0} schedule entries`);

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
          left: `${groupIndex * 12}px`,
          width: `calc(100% - ${groupIndex * 12}px)`,
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
            <p className="text-[11px] text-muted-foreground truncate">📍 {entry.location}</p>
          )}
        </div>
      </div>
    );
  };

  const renderBlock = (block: TimeBlock, isActive: boolean) => {
    const topPercentage = timeToPercentage(block.startTime);
    const bottomPercentage = timeToPercentage(block.endTime);
    const height = bottomPercentage - topPercentage;
    const duration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);

    const blockTasks = scheduledTasks
      .filter(st => st.blockId === block.id)
      .map(st => tasks.find(t => t.id === st.taskId))
      .filter(Boolean) as Task[];

    return (
      <div
        key={block.id}
        className={`absolute left-0 right-0 border border-border rounded-lg p-2 cursor-pointer transition-all hover:shadow-lg ${
          isActive ? 'bg-primary/20 border-primary animate-pulse' : 'bg-card/80'
        }`}
        style={{
          top: `${topPercentage}%`,
          height: `${height}%`,
          backgroundColor: block.color ? `${block.color}20` : undefined,
          borderColor: block.color || undefined,
        }}
        onClick={() => {
          setEditingBlock(block);
          setIsTimeBlockEditorOpen(true);
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-xs">{block.title}</h4>
            <p className="text-[10px] text-muted-foreground">
              {block.startTime} - {block.endTime}
            </p>
          </div>
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

  const mainBlocks = filteredBlocks.filter(b => b.type === 'main');
  const dedicatedBlocks = filteredBlocks.filter(b => b.type === 'dedicated');

  const currentTime = getCurrentTime();
  const activeMainBlock = mainBlocks.find(b => isTimeInRange(currentTime, b.startTime, b.endTime));

  const filteredEntries = categoryFilter
    ? scheduleEntries.filter(e => e.category === categoryFilter)
    : scheduleEntries;

  const categoryCounts = scheduleEntries.reduce((acc, entry) => {
    const cat = entry.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <section className="space-y-6">
      {/* Dialogs */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Schedule Entries Found</AlertDialogTitle>
            <AlertDialogDescription>
              Some schedule entries for these dates already exist. Would you like to replace them with the new upload?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingUploadData(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              proceedWithUpload(pendingUploadData.entries, true);
              setDuplicateDialogOpen(false);
            }}>
              Replace All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Daily Flow Timeline</h3>
          <Badge variant="secondary">{scheduleEntries.length} entries</Badge>
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
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="file"
          ref={screenshotInputRef}
          onChange={handleScreenshotUpload}
          accept="image/*"
          className="hidden"
          id="screenshot-upload"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => screenshotInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Import Assignments
            </>
          )}
        </Button>
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

      {/* View Mode & Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'timeline' | 'list')}>
          <TabsList>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={categoryFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(null)}
          >
            All ({scheduleEntries.length})
          </Button>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'work' && '💼'}
              {cat === 'class' && '📚'}
              {cat === 'homework' && '📝'}
              {cat === 'personal' && '✨'}
              {cat === 'other' && '📌'}
              {' '}{cat} ({count})
            </Button>
          ))}
        </div>
      </div>

      {/* Daily Flow Section */}
      {viewMode === 'timeline' ? (
        <div className="grid grid-cols-4 gap-4">
          {/* Time Blocks (25%) - Visual Reference */}
          <div className="col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground">Time Blocks</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Visual reference
            </p>
            <div className="relative h-[600px] bg-card/50 border border-border rounded-lg p-2">
              {mainBlocks.map(block => renderBlock(block, false))}
              {dedicatedBlocks.map(block => renderBlock(block, block.id === activeDedicatedBlock?.id))}
            </div>
          </div>

          {/* Today's Schedule (75%) - Detailed View */}
          <div className="col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground">Today's Schedule</h4>
              <p className="text-xs text-muted-foreground">{filteredEntries.length} entries</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled activities and commitments
            </p>
            <div className="relative h-[600px] bg-card/50 border border-border rounded-lg p-4">
              {/* Hour markers */}
              <div className="absolute left-0 top-0 bottom-0 w-12 text-xs text-muted-foreground">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0"
                    style={{ top: `${(i / 24) * 100}%` }}
                  >
                    {i.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              <div className="ml-14 relative h-full">
                {groupOverlappingEntries(dedupeEntries(filteredEntries)).map(group => 
                  group.map((entry, idx) => renderScheduleEntry(entry, idx, group.length))
                )}
                
                {/* Current time indicator */}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-accent shadow-lg z-20"
                  style={{ top: `${currentTimePercentage}%` }}
                >
                  <div className="absolute right-0 -top-2 text-xs font-bold text-accent">
                    NOW
                  </div>
                </div>

                {filteredEntries.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">No schedule entries for today</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                      className="w-1 h-full rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                    <div className="space-y-1">
                      <h4 className="font-semibold">{entry.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(startDate)} - {formatTime(endDate)}
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
          {filteredEntries.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No schedule entries found</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
