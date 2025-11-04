import { useState, useEffect } from 'react';
import { TimeBlock, ScheduledTask, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { TimeBlockEditor } from './TimeBlockEditor';
import { ScheduledTaskCard } from './ScheduledTaskCard';
import { Plus, Sparkles } from 'lucide-react';
import { timeToPercentage, getCurrentTimePercentage, getCurrentTime, isTimeInRange, timeToMinutes, isWeekday } from '@/lib/timeUtils';

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
  showQuickActions = true,
}: DailyFlowTimelineProps) {
  const [currentTimePercentage, setCurrentTimePercentage] = useState(getCurrentTimePercentage());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>();
  

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimePercentage(getCurrentTimePercentage());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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

  return (
    <>
      <section 
        className="relative bg-card border-2 border-border rounded-lg p-4" 
        data-tutorial="timeline"
        aria-label="Daily Flow Timeline"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Daily Flow Timeline</h3>
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

            {/* Dedicated blocks (right) */}
            <div className="relative pl-2">
              <p className="text-xs text-muted-foreground mb-2 text-center sticky top-0 bg-card/90 backdrop-blur-sm py-1">
                Dedicated Time
              </p>
              <div className="relative h-[600px]">
                {dedicatedBlocks.map(block => renderBlock(block, block.id === activeDedicatedBlock?.id))}
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

          {visibleBlocks.length === 0 && (
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
