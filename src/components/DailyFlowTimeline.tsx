import { useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { TimeBlock, ScheduledTask, Task, DayTemplate, StructureSettings, DEFAULT_STRUCTURE_SETTINGS } from '@/types';
import { Button } from '@/components/ui/button';
import { TimeBlockEditor } from './TimeBlockEditor';
import { Plus, Trash2, Clock, Moon, Briefcase, Sun, Settings2, Sparkles, Layers, Play } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import {
  timeToPercentage,
  getCurrentTimePercentage,
  getCurrentTime,
  isTimeInRange,
  timeToMinutes,
  getComputedTimeZones,
  formatTimeDisplay,
  type TimeZoneConfig
} from '@/lib/timeUtils';
import { timeToMinutes as temporalTimeToMinutes } from '@/lib/temporalContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useTimeZoneSettings } from '@/hooks/useTimeZoneSettings';
import { cn } from '@/lib/utils';
import { TimeZoneSettingsDialog } from './TimeZoneSettingsDialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useStructureAnalysis, StructureSuggestion } from '@/hooks/useStructureAnalysis';
import { PhaseBackgrounds, StructureCoach, GhostSuggestionBlock, DayTemplateManager, StartMyDayButton, showPhaseTransitionToast } from './structure';

// Wrapper component that conditionally applies DragDropContext
function DragDropContextWrapper({
  useExternalContext,
  onDragEnd,
  children,
}: {
  useExternalContext: boolean;
  onDragEnd: (result: DropResult) => void;
  children: ReactNode;
}) {
  if (useExternalContext) {
    // When using external context, just render children (context is provided by parent)
    return <>{children}</>;
  }
  // Otherwise, wrap with our own DragDropContext
  return <DragDropContext onDragEnd={onDragEnd}>{children}</DragDropContext>;
}

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

// Active timer state for visual integration
interface ActiveTimerState {
  isRunning: boolean;
  isPaused: boolean;
  taskId: string | null;
  taskTitle: string | null;
  timeRemaining: number; // seconds
  totalTime: number; // seconds
}

interface DailyFlowTimelineProps {
  timeBlocks: TimeBlock[];
  scheduledTasks: ScheduledTask[];
  tasks: Task[];
  onAddTimeBlock: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onUpdateTimeBlock: (id: string, block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onDeleteTimeBlock: (id: string) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onScheduleTask?: (scheduledTask: Omit<ScheduledTask, 'id'>) => void;
  // When true, the component doesn't wrap with its own DragDropContext (expects external context)
  useExternalDragContext?: boolean;
  // Callback for handling drag end events (used when useExternalDragContext is true)
  onExternalDragEnd?: (result: DropResult) => void;
  // Active timer state for showing timer progress in timeline
  activeTimerState?: ActiveTimerState;
  // Callback to start a work session on a task
  onStartWorkSession?: (task: Task) => void;
}

export function DailyFlowTimeline({
  timeBlocks,
  scheduledTasks,
  tasks,
  onAddTimeBlock,
  onUpdateTimeBlock,
  onDeleteTimeBlock,
  onAddTask,
  onScheduleTask,
  useExternalDragContext = false,
  onExternalDragEnd,
  activeTimerState,
  onStartWorkSession,
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
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  
  // Structure coaching state
  const [structureSettings, setStructureSettings] = useLocalStorage<StructureSettings>(
    'neurulae-structure-settings',
    DEFAULT_STRUCTURE_SETTINGS
  );
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  
  // User profile defaults (could be fetched from user settings)
  const userProfileDefaults = useMemo(() => ({
    wakeTime: '07:00',
    sleepTime: '23:00',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    workStartTime: '09:00',
    workEndTime: '17:00'
  }), []);
  
  // Structure Analysis - provides coaching insights
  const structureAnalysis = useStructureAnalysis(
    timeBlocks,
    [], // scheduleEntries would go here if typed
    timeZoneSettings,
    userProfileDefaults
  );

  // Track if user has "started their day"
  const [dayStarted, setDayStarted] = useLocalStorage<string | null>(
    'neurulae-day-started',
    null
  );
  const today = format(new Date(), 'yyyy-MM-dd');
  const isDayStarted = dayStarted === today;

  // Phase transition detection
  const previousPhaseRef = useRef<string | null>(null);

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTimePercentage(getCurrentTimePercentage());
      setCurrentTimeDisplay(formatTimeDisplay(getCurrentTime()));
    };

    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Detect phase transitions and show toast
  useEffect(() => {
    const currentPhase = structureAnalysis.context.currentPhase;
    
    if (previousPhaseRef.current !== null && 
        previousPhaseRef.current !== currentPhase &&
        structureSettings.notifyPhaseTransitions) {
      // Phase just changed - show toast
      showPhaseTransitionToast({
        phase: currentPhase,
        phaseLabel: structureAnalysis.context.phaseLabel,
        suggestion: structureAnalysis.suggestions[0],
        onAcceptSuggestion: handleAcceptSuggestion
      });
    }
    
    previousPhaseRef.current = currentPhase;
  }, [structureAnalysis.context.currentPhase, structureSettings.notifyPhaseTransitions]);

  const handleStartMyDay = () => {
    setDayStarted(today);
    toast({
      title: "☀️ Day Started!",
      description: "Your morning is set up. Let's make it a great day!",
    });
  };

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

  // Handle drag-and-drop of tasks onto time blocks
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside a valid droppable
    if (!destination) return;
    
    // Check if dropped on a time block (droppableId starts with 'timeblock-')
    if (destination.droppableId.startsWith('timeblock-')) {
      const blockId = destination.droppableId.replace('timeblock-', '');
      const taskId = draggableId.replace('task-', '');
      
      // Find the task to get its details
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Check if already scheduled to this block today
      const today = format(new Date(), 'yyyy-MM-dd');
      const alreadyScheduled = scheduledTasks.some(
        st => st.taskId === taskId && st.blockId === blockId && st.date === today
      );
      
      if (alreadyScheduled) {
        toast({
          title: "Already Scheduled",
          description: `"${task.title}" is already scheduled to this time block today.`,
          variant: "default",
        });
        return;
      }
      
      // Create the scheduled task
      if (onScheduleTask) {
        onScheduleTask({
          taskId,
          blockId,
          date: today,
          estimatedMinutes: task.estimatedMinutes,
        });
        
        toast({
          title: "Task Scheduled",
          description: `"${task.title}" has been scheduled to this time block.`,
        });
      }
    }
  };

  // Structure coaching handlers
  const handleAcceptSuggestion = (suggestion: StructureSuggestion) => {
    const newBlock: Omit<TimeBlock, 'id' | 'createdAt'> = {
      title: suggestion.title,
      startTime: suggestion.suggestedTime.start,
      endTime: suggestion.suggestedTime.end,
      type: suggestion.type === 'deep-work' ? 'dedicated' : 'main',
      scheduleType: suggestion.weekdayOnly ? 'weekday' : suggestion.weekendOnly ? 'weekend' : 'everyday',
    };
    
    onAddTimeBlock(newBlock);
    setDismissedSuggestions(prev => new Set([...prev, suggestion.id]));
    toast({
      title: 'Block Added',
      description: `"${suggestion.title}" has been added to your schedule.`,
    });
  };

  const handleDismissSuggestion = (suggestionId: string, _dismissType?: 'not-today' | 'never') => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const handleApplyTemplate = (template: DayTemplate) => {
    // Clear existing blocks of the same schedule type and add template blocks
    const newBlocks: Omit<TimeBlock, 'id' | 'createdAt'>[] = template.timeBlocks.map(tb => ({
      title: tb.blockName || 'Untitled Block',
      startTime: tb.startTime,
      endTime: tb.endTime,
      type: tb.type === 'routine' ? 'main' as const : 'dedicated' as const,
      scheduleType: template.suggestedFor === 'weekday' ? 'weekday' as const : 
                    template.suggestedFor === 'weekend' ? 'weekend' as const : 'everyday' as const,
      color: tb.color,
    }));
    
    // Add each block
    newBlocks.forEach(block => onAddTimeBlock(block));
    
    toast({
      title: 'Template Applied',
      description: `"${template.name}" has been applied with ${newBlocks.length} blocks.`,
    });
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

    // Get tasks scheduled to this block today
    const today = format(new Date(), 'yyyy-MM-dd');
    const scheduledToBlock = scheduledTasks.filter(
      st => st.blockId === block.id && st.date === today
    );
    const scheduledTaskDetails = scheduledToBlock
      .map(st => tasks.find(t => t.id === st.taskId))
      .filter(Boolean);

    // Check if this block contains the actively timed task
    const hasActiveTimerTask = activeTimerState?.taskId &&
      scheduledToBlock.some(st => st.taskId === activeTimerState.taskId);
    const isTimerRunning = activeTimerState?.isRunning && !activeTimerState?.isPaused;
    const timerProgress = activeTimerState?.totalTime
      ? ((activeTimerState.totalTime - activeTimerState.timeRemaining) / activeTimerState.totalTime) * 100
      : 0;

    // Determine positioning based on block type
    // MAIN blocks: Narrow solid stripe on the LEFT for general time categories (e.g., "Working Hours", "Morning")
    // DEDICATED blocks: Wider area on the RIGHT for specific tasks that fit "inside" the main blocks
    const isMainBlock = block.type === 'main';
    
    // Main blocks: narrow vertical stripe (50px wide) after hour labels
    // Dedicated blocks: fill the remaining space to the right
    const blockLeft = isMainBlock ? '65px' : '120px';
    const blockRight = isMainBlock ? 'calc(100% - 115px)' : '8px';
    
    // Colors - Main blocks are more solid/opaque
    const defaultMainColor = '#3B82F6'; // Blue-500
    const defaultDedicatedColor = '#8B5CF6'; // Violet-500
    const blockColor = block.color || (isMainBlock ? defaultMainColor : defaultDedicatedColor);

    return (
      <Droppable key={block.id} droppableId={`timeblock-${block.id}`} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "absolute cursor-pointer transition-all hover:shadow-lg overflow-hidden group",
              // Main blocks: solid stripe, no rounded corners on right
              isMainBlock 
                ? 'rounded-l-md border-l-4 bg-opacity-90' 
                : 'rounded-lg border-2 shadow-md backdrop-blur-sm',
              // Active state
              isActive && 'ring-2 ring-primary/50 shadow-lg',
              // Drag over state
              snapshot.isDraggingOver && 'ring-2 ring-green-500/50 bg-green-500/10 border-green-500',
              // Active timer styling
              hasActiveTimerTask && isTimerRunning && 'ring-2 ring-primary animate-pulse'
            )}
            style={{
              top: `${topPercentage}%`,
              height: `${Math.max(height, 2.5)}%`, // Ensure minimum visibility
              left: blockLeft,
              right: blockRight,
              // Main blocks are more solid, dedicated are slightly transparent
              backgroundColor: snapshot.isDraggingOver
                ? undefined
                : isMainBlock 
                  ? `${blockColor}CC` // ~80% opacity for main (solid feel)
                  : `${blockColor}40`, // ~25% opacity for dedicated
              borderColor: snapshot.isDraggingOver 
                ? undefined 
                : (hasActiveTimerTask ? 'hsl(var(--primary))' : blockColor),
              // Main blocks behind dedicated blocks
              zIndex: snapshot.isDraggingOver ? 10 : (hasActiveTimerTask ? 6 : (isMainBlock ? 2 : 4)),
            }}
            onClick={() => {
              setEditingBlock(block);
              setIsTimeBlockEditorOpen(true);
            }}
          >
            {/* Block content - different layouts for main vs dedicated */}
            {isMainBlock ? (
              /* Main blocks: Vertical text for narrow stripe */
              <div className="h-full flex flex-col items-center justify-start py-2 px-1">
                <h4 
                  className="font-bold text-xs whitespace-nowrap"
                  style={{ 
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                  }}
                >
                  {block.title}
                </h4>
                <span 
                  className="text-[9px] mt-2 opacity-80"
                  style={{ 
                    writingMode: 'vertical-rl',
                    color: '#fff',
                  }}
                >
                  {block.startTime}
                </span>
              </div>
            ) : (
              /* Dedicated blocks: Full horizontal content */
              <div className="flex flex-col h-full p-2">
                <div className="flex items-center gap-2 mb-1">
                  <h4 
                    className="font-semibold text-sm truncate flex-1"
                    style={{ 
                      color: blockColor,
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                  >
                    {block.title}
                  </h4>
                  {/* Active timer badge */}
                  {hasActiveTimerTask && (
                    <Badge
                      variant="default"
                      className={cn(
                        "text-[8px] px-1 py-0 h-4 flex-shrink-0",
                        isTimerRunning ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                      )}
                    >
                      {isTimerRunning ? 'Active' : 'Paused'}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {block.startTime} - {block.endTime}
                </p>
                {/* Show scheduled tasks with active indicator */}
                {scheduledTaskDetails.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {scheduledTaskDetails.slice(0, 3).map((t, idx) => {
                      const isActiveTask = t?.id === activeTimerState?.taskId;
                      return (
                        <Badge
                          key={idx}
                          variant={isActiveTask ? "default" : "secondary"}
                          className={cn(
                            "text-[9px] px-1 py-0 truncate max-w-[80px]",
                            isActiveTask && isTimerRunning && "bg-primary animate-pulse"
                          )}
                        >
                          {isActiveTask && <Clock className="h-2 w-2 mr-0.5 inline" />}
                          {t?.title}
                        </Badge>
                      );
                    })}
                    {scheduledTaskDetails.length > 3 && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        +{scheduledTaskDetails.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
              {snapshot.isDraggingOver && (
                <div className="flex-shrink-0 text-green-600">
                  <Plus className="h-4 w-4" />
                </div>
              )}
              {/* Start Work button - shows when there are scheduled tasks and not actively running */}
              {!snapshot.isDraggingOver && scheduledTaskDetails.length > 0 && !hasActiveTimerTask && onStartWorkSession && (
                <button
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 bg-primary/10 hover:bg-primary/20 rounded-full p-1 text-primary hover:scale-110 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    const firstTask = scheduledTaskDetails[0];
                    if (firstTask) {
                      onStartWorkSession(firstTask);
                    }
                  }}
                  title={`Start working on ${scheduledTaskDetails[0]?.title}`}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    zIndex: 20
                  }}
                >
                  <Play className="h-3 w-3 fill-current" />
                </button>
              )}

            {/* Timer progress bar at bottom of block */}
            {hasActiveTimerTask && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50 rounded-b">
                <div
                  className={cn(
                    "h-full rounded-b transition-all duration-1000",
                    isTimerRunning ? "bg-primary" : "bg-yellow-500"
                  )}
                  style={{ width: `${timerProgress}%` }}
                />
              </div>
            )}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
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
          "absolute left-0 right-0 transition-all duration-300 group/zone",
          zone.isActive && "ring-1 ring-inset ring-primary/20"
        )}
        style={{
          top: `${zone.startPercentage}%`,
          height: `${zone.heightPercentage}%`,
          backgroundColor: zone.color,
          zIndex: 1,
        }}
      >
        {/* Zone label - very subtle, only icon by default */}
        <div
          className={cn(
            "absolute right-1 top-1 flex items-center gap-1 px-1 py-0.5 rounded text-[9px]",
            "opacity-40 group-hover/zone:opacity-80 transition-opacity",
            zone.isActive
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {getZoneIcon(zone.name)}
          {/* Only show full name on hover */}
          <span className="hidden group-hover/zone:inline text-[9px]">{zone.name}</span>
        </div>
      </div>
    );
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  
  const filteredBlocks = timeBlocks.filter(block => {
    if (block.scheduleType === 'everyday') return true;
    if (block.scheduleType === 'weekday') return scheduleType === 'weekday';
    if (block.scheduleType === 'weekend') return scheduleType === 'weekend';
    // 'today' blocks only show on their scheduled date
    if (block.scheduleType === 'today') {
      return block.scheduledDate === today;
    }
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

      {/* Start My Day Button - only shows in morning */}
      {structureSettings.enableCoaching && (
        <StartMyDayButton
          currentPhase={structureAnalysis.context.currentPhase}
          morningTemplateExists={false}
          topTasks={tasks.slice(0, 3)}
          dayStarted={isDayStarted}
          onStartDay={handleStartMyDay}
        />
      )}

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
          {/* Day Template Manager */}
          {structureSettings.enableCoaching && (
            <DayTemplateManager
              currentBlocks={filteredBlocks}
              currentDayType={scheduleType === 'weekend' ? 'weekend' : 'weekday'}
              onApplyTemplate={handleApplyTemplate}
              onSaveAsTemplate={(name, dayType) => {
                toast({ title: 'Template Saved', description: `"${name}" saved successfully` });
              }}
            />
          )}
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

      {/* Main Content - wrapped in DragDropContext unless using external context */}
      <DragDropContextWrapper
        useExternalContext={useExternalDragContext}
        onDragEnd={handleDragEnd}
      >
        {/* Timeline View (full width now) */}
        <div className={cn("space-y-3", viewMode === 'timeline' ? 'lg:col-span-4' : 'lg:col-span-4')}>
          {viewMode === 'timeline' ? (
            <div className="relative h-[600px] bg-card/50 border border-border rounded-lg overflow-hidden">
              {/* Phase Backgrounds - render first, behind everything */}
              {structureSettings.showPhaseBackgrounds && (
                <PhaseBackgrounds
                  wakeTime={userProfileDefaults.wakeTime}
                  sleepTime={userProfileDefaults.sleepTime}
                  currentPhase={structureAnalysis.context.currentPhase}
                  showLabels={true}
                />
              )}

              {/* Time Zone Background Regions */}
              {computedZones.map(zone => renderTimeZone(zone))}

              {/* Ghost Suggestion Blocks */}
              {structureSettings.showGhostSuggestions && structureAnalysis.suggestions
                .filter(s => !dismissedSuggestions.has(s.id))
                .slice(0, 3)
                .map(suggestion => {
                  const startMinutes = temporalTimeToMinutes(suggestion.suggestedTime.start);
                  const endMinutes = temporalTimeToMinutes(suggestion.suggestedTime.end);
                  const topPercent = (startMinutes / (24 * 60)) * 100;
                  const heightPercent = ((endMinutes - startMinutes) / (24 * 60)) * 100;
                  
                  return (
                    <GhostSuggestionBlock
                      key={suggestion.id}
                      suggestion={suggestion}
                      topPercent={topPercent}
                      heightPercent={heightPercent}
                      onAccept={handleAcceptSuggestion}
                      onDismiss={handleDismissSuggestion}
                    />
                  );
                })
              }

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

              {/* Empty state - clickable to create block */}
              {filteredEntries.length === 0 && filteredBlocks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-5">
                  <button
                    onClick={() => {
                      setEditingBlock(undefined);
                      setIsTimeBlockEditorOpen(true);
                    }}
                    className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground bg-background/80 hover:bg-background px-6 py-4 rounded-lg border border-dashed border-border/50 hover:border-border transition-all hover:shadow-md cursor-pointer"
                  >
                    <Plus className="h-6 w-6" />
                    <p className="text-sm font-medium">Add your first time block</p>
                    <p className="text-xs text-muted-foreground">Click to create a block and visualize your day</p>
                  </button>
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

        {/* Structure Coach - below timeline */}
        {structureSettings.enableCoaching && viewMode === 'timeline' && (
          <StructureCoach
            analysis={structureAnalysis}
            onAcceptSuggestion={handleAcceptSuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onOpenTemplates={() => setShowTemplatesDialog(true)}
            className="mt-4"
          />
        )}
      </DragDropContextWrapper>

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
