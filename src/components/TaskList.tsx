import { useState } from 'react';
import { Plus, Search, Filter, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onAddTask: (title: string) => void;
}

export function TaskList({ tasks, onToggleComplete, onAddTask }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompleted = showCompleted || !task.completed;
    return matchesSearch && matchesCompleted;
  });

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle);
      setNewTaskTitle('');
    }
  };

  return (
    <Card className="card-elevated h-full">
      <CardHeader>
        <CardTitle>Unscheduled Tasks</CardTitle>
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <Filter className={`h-4 w-4 ${showCompleted ? 'text-primary' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="New task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <Button onClick={handleAddTask} className="btn-primary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tasks yet. Add one above!</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-card/50 rounded-lg hover:bg-card/70 transition-colors draggable"
                draggable
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id)}
                />
                <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </span>
                {task.completed && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))
          )}
        </div>

        <div className="text-sm text-muted-foreground pt-2 border-t border-border">
          {filteredTasks.filter(t => !t.completed).length} active •{' '}
          {filteredTasks.filter(t => t.completed).length} completed
        </div>
      </CardContent>
    </Card>
  );
}
