import { GripVertical, Plus, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/types';

interface TodaysPrioritiesProps {
  priorities: Task[];
  onToggleComplete: (id: string) => void;
  onAddPriority: () => void;
}

export function TodaysPriorities({ priorities, onToggleComplete, onAddPriority }: TodaysPrioritiesProps) {
  return (
    <Card className="card-elevated border-2" data-tutorial="priorities">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-current" />
          Today's Priorities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {priorities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">Drag tasks here to prioritize them</p>
            <Button onClick={onAddPriority} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Priority
            </Button>
          </div>
        ) : (
          <>
            {priorities.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-card/50 rounded-lg hover:bg-card/70 transition-colors"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id)}
                />
                <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                  {task.title}
                </span>
              </div>
            ))}
            <Button onClick={onAddPriority} variant="ghost" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
