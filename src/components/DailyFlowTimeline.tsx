import { useState, useEffect } from 'react';
import { TimeBlock, ScheduledTask, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { TimeBlockEditor } from './TimeBlockEditor';
import { ScheduledTaskCard } from './ScheduledTaskCard';
import { Plus, Sparkles, Upload, Loader2 } from 'lucide-react';
import { timeToPercentage, getCurrentTimePercentage, getCurrentTime, isTimeInRange, timeToMinutes, isWeekday } from '@/lib/timeUtils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScheduleEntry {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category: string;
  source: string;
  location?: string;
}

interface DailyFlowTimelineProps {
  timeBlocks: TimeBlock[];
  scheduledTasks: ScheduledTask[];
  tasks: Task[];
  onAddBlock: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onUpdateBlock: (id: string, block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onDeleteBlock: (id: string) => void;
  onToggleComplete: (taskId: string) => void;
  onUpdateTask?: (task: Task) => void;
  onAskAI?: (message: string) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  showQuickActions?: boolean;
}

export function DailyFlowTimeline({
  timeBlocks,
  scheduledTasks,
  tasks,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onToggleComplete,
  onUpdateTask,
  onAskAI,
  onAddTask,
  showQuickActions = true,
}: DailyFlowTimelineProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTimePercentage, setCurrentTimePercentage] = useState(getCurrentTimePercentage());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>();
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimePercentage(getCurrentTimePercentage());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Load schedule entries from database
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

  const handleScheduleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !user) return;

    setUploading(true);

    let totalEntries = 0;
    let totalHomework = 0;
    const allEntries: any[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const allowedTypes = ['application/pdf','image/png','image/jpeg','image/jpg','image/webp','image/heic'];
        const ext = file.name?.split('.').pop()?.toLowerCase() || '';
        const allowedExts = ['pdf','png','jpg','jpeg','webp','heic'];
        if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
          continue;
        }

        try {
          const formData = new FormData();
          formData.append('file', file);

          const invokeOptions: any = { body: formData };
          if (session?.access_token) {
            invokeOptions.headers = { Authorization: `Bearer ${session.access_token}` };
          }

          const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-schedule', invokeOptions);

          if (parseError) throw parseError;

          if (parseResult?.entries && parseResult.entries.length > 0) {
            const scheduleEntries = parseResult.entries.map((entry: any) => {
              let source = 'manual';
              if (entry.category === 'work') source = 'work';
              else if (entry.category === 'class') source = 'class';
              else if (entry.category === 'homework') {
                source = 'homework';
                // Add homework as tasks
                if (onAddTask) {
                  onAddTask({
                    title: entry.title,
                    completed: false,
                    recurring: 'none',
                    notes: entry.description || '',
                    dueDate: entry.startTime,
                  });
                }
                totalHomework++;
              }
              
              return {
                user_id: user.id,
                title: entry.title,
                description: entry.description,
                start_time: entry.startTime,
                end_time: entry.endTime,
                category: entry.category || 'other',
                location: entry.location,
                source: source,
              };
            });

            allEntries.push(...scheduleEntries);
            totalEntries += scheduleEntries.length;
          }
        } catch (fileError: any) {
          console.error(`Error processing file ${file.name}:`, fileError);
        }
      }

      if (allEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('schedule_entries')
          .insert(allEntries);

        if (insertError) throw insertError;

        let message = `Imported ${totalEntries} entries from ${files.length} file${files.length > 1 ? 's' : ''}`;
        if (totalHomework > 0) {
          message += `. ${totalHomework} homework tasks added to your to-do list`;
        }

        toast({
          title: '✓ Schedule uploaded!',
          description: message,
        });

        // Reload schedule entries
        await loadScheduleEntries();
      } else {
        toast({
          title: 'No entries found',
          description: 'Could not extract schedule from files',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error uploading schedule:', error);
      const status = error?.status || error?.cause?.status;
      let description = 'Failed to parse schedule';
      if (status === 429) description = 'Rate limit exceeded. Please wait a minute.';
      else if (status === 402) description = 'AI usage limit reached. Please add credits.';
      else if (error?.message) description = error.message;
      
      toast({ 
        title: 'Upload Failed', 
        description, 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddBlock = () => {
    setEditingBlock(undefined);
    setEditorOpen(true);
  };

  const handleEditBlock = (block: TimeBlock) => {
    setEditingBlock(block);
    setEditorOpen(true);
  };

  const handleSaveBlock = (blockData: Omit<TimeBlock, 'id' | 'createdAt'>) => {
    if (editingBlock) {
      onUpdateBlock(editingBlock.id, blockData);
    } else {
      onAddBlock(blockData);
    }
  };

  const handleDeleteBlock = () => {
    if (editingBlock) {
      onDeleteBlock(editingBlock.id);
      setEditorOpen(false);
    }
  };


  const isToday = isWeekday();
  const visibleBlocks = timeBlocks.filter(block => {
    if (block.scheduleType === 'everyday') return true;
    if (block.scheduleType === 'weekday') return isToday;
    if (block.scheduleType === 'weekend') return !isToday;
    return true;
  });

  const mainBlocks = visibleBlocks.filter(b => b.type === 'main');
  const dedicatedBlocks = visibleBlocks.filter(b => b.type === 'dedicated');

  const currentTime = getCurrentTime();
  const activeMainBlock = mainBlocks.find(b => isTimeInRange(currentTime, b.startTime, b.endTime));
  const activeDedicatedBlock = dedicatedBlocks.find(b => isTimeInRange(currentTime, b.startTime, b.endTime));

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
        className={`absolute left-0 right-0 border border-border rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg ${
          isActive ? 'bg-primary/20 border-primary animate-pulse' : 'bg-card/80'
        }`}
        style={{
          top: `${topPercentage}%`,
          height: `${height}%`,
          backgroundColor: block.color ? `${block.color}20` : undefined,
          borderColor: block.color || undefined,
        }}
        onClick={() => handleEditBlock(block)}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold text-sm">{block.title}</h4>
            <p className="text-xs text-muted-foreground">
              {block.startTime} - {block.endTime} ({Math.round(duration / 60)}h)
            </p>
          </div>
        </div>
        
        {blockTasks.length > 0 && (
          <div className="space-y-1 mt-2">
            {blockTasks.slice(0, 3).map(task => (
              <ScheduledTaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onUpdateTask={onUpdateTask}
              />
            ))}
            {blockTasks.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{blockTasks.length - 3} more
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render schedule entries from database
  const renderScheduleEntry = (entry: ScheduleEntry) => {
    const startDate = new Date(entry.start_time);
    const endDate = new Date(entry.end_time);
    const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    
    const topPercentage = timeToPercentage(startTime);
    const bottomPercentage = timeToPercentage(endTime);
    const height = bottomPercentage - topPercentage;
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

    const categoryColors: Record<string, string> = {
      work: '#ef4444',
      class: '#3b82f6',
      homework: '#f59e0b',
      other: '#6b7280',
    };

    const color = categoryColors[entry.category] || categoryColors.other;

    return (
      <div
        key={entry.id}
        className="absolute left-0 right-0 border-2 rounded-lg p-3 pointer-events-none"
        style={{
          top: `${topPercentage}%`,
          height: `${height}%`,
          backgroundColor: `${color}20`,
          borderColor: color,
        }}
      >
        <div>
          <h4 className="font-semibold text-sm">{entry.title}</h4>
          <p className="text-xs text-muted-foreground">
            {startTime} - {endTime} ({Math.round(duration / 60)}h)
          </p>
          {entry.location && (
            <p className="text-xs text-muted-foreground mt-1">📍 {entry.location}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <section 
        className="relative bg-card border-2 border-border rounded-lg p-4" 
        data-tutorial="timeline"
        aria-label="Daily Flow Timeline"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Daily Flow Timeline</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('schedule-upload-input')?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
            <input
              id="schedule-upload-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
              className="hidden"
              multiple
              onChange={handleScheduleUpload}
            />
            <Button 
              onClick={handleAddBlock} 
              size="sm" 
              className="bg-primary hover:bg-primary/90"
              aria-label="Add new time block"
            >
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Add Block
            </Button>
          </div>
        </div>

        <div className="relative bg-card/50 border border-border rounded-lg p-4 min-h-[600px]">
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

          {/* Timeline grid */}
          <div className="ml-14 grid grid-cols-2 gap-4 relative h-full">
            {/* Main blocks (left) */}
            <div className="relative border-r border-border pr-2">
              <p className="text-xs text-muted-foreground mb-2 text-center sticky top-0 bg-card/90 backdrop-blur-sm py-1">
                Main Activities
              </p>
              <div className="relative h-[600px]">
                {mainBlocks.map(block => renderBlock(block, block.id === activeMainBlock?.id))}
              </div>
            </div>

            {/* Dedicated blocks (right) - includes schedule entries from uploads */}
            <div className="relative pl-2">
              <p className="text-xs text-muted-foreground mb-2 text-center sticky top-0 bg-card/90 backdrop-blur-sm py-1">
                Dedicated Time
              </p>
              <div className="relative h-[600px]">
                {dedicatedBlocks.map(block => renderBlock(block, block.id === activeDedicatedBlock?.id))}
                {scheduleEntries.map(entry => renderScheduleEntry(entry))}
              </div>
            </div>

            {/* Current time indicator */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-accent shadow-lg z-10 transition-all duration-1000"
              style={{ top: `${currentTimePercentage}%` }}
            >
              <div className="absolute right-0 -top-2 text-xs font-bold text-accent">
                NOW
              </div>
            </div>
          </div>

          {visibleBlocks.length === 0 && scheduleEntries.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground" role="status">
              <div className="text-center space-y-3">
                <p className="mb-2">No time blocks yet</p>
                <p className="text-sm">Click "Add Block" to create your first one</p>
                {showQuickActions && onAskAI && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAskAI('Help me create a daily schedule')}
                    className="gap-2"
                    aria-label="Ask AI assistant to help create a daily schedule"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Ask AI to help
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <TimeBlockEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        block={editingBlock}
        onSave={handleSaveBlock}
        onDelete={editingBlock ? handleDeleteBlock : undefined}
      />
    </>
  );
}
