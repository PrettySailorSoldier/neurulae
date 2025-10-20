import { GripVertical, Plus, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/types';

interface TodaysPrioritiesProps {
  priorities: Task[];
  onToggleComplete: (id: string) => void;
  onAddPriority: () => void;
  showAIHint?: boolean;
}

export function TodaysPriorities({ priorities, onToggleComplete, onAddPriority, showAIHint = true }: TodaysPrioritiesProps) {
  return (
    <Card 
      className="shadow-lg border-2 transition-shadow hover:shadow-xl" 
      data-tutorial="priorities"
      role="region"
      aria-label="Today's Priorities"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-current text-primary" aria-hidden="true" />
          Today's Priorities
        </CardTitle>
        {showAIHint && priorities.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">💡 Need help? Ask AI below</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {priorities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" role="status">
            <p className="mb-4">Drag tasks here to prioritize them</p>
            <Button 
              onClick={onAddPriority} 
              variant="outline" 
              size="sm"
              aria-label="Add new priority task"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Priority
            </Button>
          </div>
        ) : (
          <>
            {priorities.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-card/50 rounded-lg hover:bg-card/70 transition-colors"
                role="listitem"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" aria-label="Drag to reorder" />
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id)}
                  aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                />
                <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                  {task.title}
                </span>
              </div>
            ))}
            <Button 
              onClick={onAddPriority} 
              variant="ghost" 
              size="sm" 
              className="w-full"
              aria-label="Add another priority task"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Another
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
