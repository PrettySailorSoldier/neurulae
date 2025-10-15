import { useState } from 'react';
import { Plus, Search, Filter, Check, Pencil, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onAddTask: (title: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskList({ tasks, onToggleComplete, onAddTask, onUpdateTask, onDeleteTask }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

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

  const handleBulkAdd = () => {
    if (bulkText.trim()) {
      const lines = bulkText.split('\n').filter(line => line.trim());
      lines.forEach(line => onAddTask(line.trim()));
      setBulkText('');
      setBulkMode(false);
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = (task: Task) => {
    if (editingTitle.trim()) {
      onUpdateTask({ ...task, title: editingTitle.trim() });
    }
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTitle('');
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
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Button
              variant={bulkMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setBulkMode(!bulkMode)}
              className="text-xs"
            >
              {bulkMode ? 'Single' : 'Bulk'} Add
            </Button>
          </div>
          
          {bulkMode ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Paste your task list here... (one task per line)"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <div className="flex gap-2">
                <Button onClick={handleBulkAdd} className="btn-primary flex-1">
                  Add All Tasks
                </Button>
                <Button onClick={() => { setBulkText(''); setBulkMode(false); }} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
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
          )}
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
                className="flex items-center gap-2 p-3 bg-card/50 rounded-lg hover:bg-card/70 transition-colors group"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id)}
                />
                {editingTaskId === task.id ? (
                  <>
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(task);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleSaveEdit(task)} variant="ghost">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleCancelEdit} variant="ghost">
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {task.completed && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(task)}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteTask(task.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
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
