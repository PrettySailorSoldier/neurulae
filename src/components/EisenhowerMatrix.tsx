import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';
import { Grid3x3, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface EisenhowerMatrixProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

type Quadrant = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

const quadrantConfig = {
  'urgent-important': {
    title: 'Do First',
    subtitle: 'Urgent & Important',
    color: 'bg-red-500/10 border-red-500/30',
    textColor: 'text-red-600 dark:text-red-400',
  },
  'not-urgent-important': {
    title: 'Schedule',
    subtitle: 'Not Urgent but Important',
    color: 'bg-blue-500/10 border-blue-500/30',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  'urgent-not-important': {
    title: 'Delegate',
    subtitle: 'Urgent but Not Important',
    color: 'bg-yellow-500/10 border-yellow-500/30',
    textColor: 'text-yellow-600 dark:text-yellow-400',
  },
  'not-urgent-not-important': {
    title: 'Eliminate',
    subtitle: 'Neither Urgent nor Important',
    color: 'bg-gray-500/10 border-gray-500/30',
    textColor: 'text-gray-600 dark:text-gray-400',
  },
};

function EisenhowerMatrix({ open, onOpenChange, tasks, onUpdateTask }: EisenhowerMatrixProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const getTasksByQuadrant = (quadrant: Quadrant) => {
    return tasks.filter(task => task.eisenhowerQuadrant === quadrant);
  };

  const unassignedTasks = tasks.filter(task => !task.eisenhowerQuadrant);

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (quadrant: Quadrant) => {
    if (draggedTask) {
      onUpdateTask(draggedTask, { eisenhowerQuadrant: quadrant });
      setDraggedTask(null);
    }
  };

  const handleRemoveFromMatrix = (taskId: string) => {
    onUpdateTask(taskId, { eisenhowerQuadrant: undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "h-[90vh] flex flex-col",
        isMobile ? "w-full max-w-full" : "max-w-6xl"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5" />
            Eisenhower Priority Matrix
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Unassigned Tasks */}
          {unassignedTasks.length > 0 && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <h3 className="text-sm font-semibold mb-2">Unassigned Tasks</h3>
              <div className="flex flex-wrap gap-2">
                {unassignedTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className="px-3 py-1.5 bg-background border rounded-md cursor-move hover:shadow-md transition-shadow text-sm"
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matrix Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-auto">
            {(Object.keys(quadrantConfig) as Quadrant[]).map(quadrant => {
              const config = quadrantConfig[quadrant];
              const quadrantTasks = getTasksByQuadrant(quadrant);

              return (
                <div
                  key={quadrant}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(quadrant)}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-4 flex flex-col gap-3 min-h-[200px]',
                    config.color,
                    draggedTask && 'ring-2 ring-primary/50'
                  )}
                >
                  <div>
                    <h3 className={cn('font-bold text-lg', config.textColor)}>
                      {config.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{config.subtitle}</p>
                  </div>

                  <div className="flex-1 space-y-2 overflow-auto">
                    {quadrantTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        className="group relative px-3 py-2 bg-background border rounded-md cursor-move hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm pr-6">{task.title}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromMatrix(task.id)}
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Drag tasks between quadrants to prioritize them
          </p>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EisenhowerMatrix;
