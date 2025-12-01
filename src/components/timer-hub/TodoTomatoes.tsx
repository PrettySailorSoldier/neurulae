import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Undo2, Edit2, Check } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}

interface DragState {
  isDragging: boolean;
  draggedId: string | null;
}

export const TodoTomatoes = memo(function TodoTomatoes() {
  const [todos, setTodos] = useLocalStorage<Todo[]>('neurulae-tomatoes', []);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [lastCompleted, setLastCompleted] = useState<Todo | null>(null);
  const [dragState, setDragState] = useState<DragState>({ isDragging: false, draggedId: null });

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: newTodoText,
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setNewTodoText('');
  };

  const handleToggleTodo = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    if (!todo.completed) {
      setLastCompleted(todo);
      toast.success('🍅 Tomato completed!', { 
        description: 'Great work! Keep it up!' 
      });
    }

    setTodos(todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
    ));
  };

  const handleDeleteTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodos(todos.filter(t => t.id !== id));
    toast.success('Task deleted');
  };

  const handleStartEdit = (todo: Todo, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editText.trim()) return;
    setTodos(todos.map(t => t.id === editingId ? { ...t, text: editText } : t));
    setEditingId(null);
    setEditText('');
  };

  const handleUndoLast = () => {
    if (!lastCompleted) return;
    setTodos(todos.map(t => 
      t.id === lastCompleted.id ? { ...t, completed: false, completedAt: undefined } : t
    ));
    setLastCompleted(null);
    toast.success('Undo successful');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', id);
    setDragState({ isDragging: true, draggedId: id });
  };

  const handleDragEnd = () => {
    setDragState({ isDragging: false, draggedId: null });
  };

  const handleDrop = (e: React.DragEvent, completed: boolean) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/html');
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed } : todo
    ));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);
  const todayCompletions = completedTodos.filter(t => {
    if (!t.completedAt) return false;
    const completedDate = new Date(t.completedAt).toDateString();
    return completedDate === new Date().toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Add Todo */}
      <div className="flex gap-2">
        <Input
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
          placeholder="Add a task..."
          className="bg-input border-border"
        />
        <Button onClick={handleAddTodo} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Pomodoro Counter */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 rounded-lg p-6 text-center">
        <div className="text-5xl mb-3 animate-pulse">🍅</div>
        <div className="text-3xl font-bold text-primary mb-1">{completedTodos.length}</div>
        <div className="text-sm text-muted-foreground mb-3">Total Tomatoes</div>
        <div className="text-xs text-muted-foreground bg-background/50 rounded-full px-3 py-1 inline-block">
          Today: {todayCompletions} 🔥
        </div>
      </div>

      {/* Undo Button */}
      {lastCompleted && (
        <Button
          onClick={handleUndoLast}
          variant="outline"
          size="sm"
          className="w-full animate-fade-in"
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Undo "{lastCompleted.text}"
        </Button>
      )}

      {/* Two Columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* To-Do Column */}
        <div
          className={`bg-card border-2 border-dashed rounded-lg p-4 min-h-64 transition-all ${
            dragState.isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDrop={(e) => handleDrop(e, false)}
          onDragOver={handleDragOver}
        >
          <h4 className="font-semibold mb-3 text-center flex items-center justify-center gap-2">
            <span>📝 To-Do</span>
            <span className="text-xs text-muted-foreground">({activeTodos.length})</span>
          </h4>
          <div className="space-y-2">
            {activeTodos.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8 animate-fade-in">
                Add tasks above or drag completed tasks here
              </div>
            ) : (
              activeTodos.map(todo => (
                <div
                  key={todo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, todo.id)}
                  onDragEnd={handleDragEnd}
                  className={`group bg-gradient-to-r from-background to-card border border-border rounded-lg p-3 cursor-move hover:border-primary hover:shadow-md transition-all ${
                    dragState.draggedId === todo.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  {editingId === todo.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 h-8"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2" onClick={() => handleToggleTodo(todo.id)}>
                      <span className="text-2xl">🍅</span>
                      <span className="flex-1">{todo.text}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => handleStartEdit(todo, e)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 hover:bg-destructive/20"
                          onClick={(e) => handleDeleteTodo(todo.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div
          className={`bg-card border-2 border-dashed rounded-lg p-4 min-h-64 transition-all ${
            dragState.isDragging ? 'border-accent bg-accent/5' : 'border-accent/30'
          }`}
          onDrop={(e) => handleDrop(e, true)}
          onDragOver={handleDragOver}
        >
          <h4 className="font-semibold mb-3 text-center flex items-center justify-center gap-2">
            <span>✅ Completed</span>
            <span className="text-xs text-muted-foreground">({completedTodos.length})</span>
          </h4>
          <div className="space-y-2">
            {completedTodos.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8 animate-fade-in">
                Drag tomatoes here when complete
              </div>
            ) : (
              completedTodos.map(todo => (
                <div
                  key={todo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, todo.id)}
                  onDragEnd={handleDragEnd}
                  className={`group bg-gradient-to-r from-background to-accent/5 border border-accent/30 rounded-lg p-3 cursor-move hover:border-accent hover:shadow-md transition-all ${
                    dragState.draggedId === todo.id ? 'opacity-50 scale-95' : 'opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2" onClick={() => handleToggleTodo(todo.id)}>
                    <span className="text-2xl animate-scale-in">✅</span>
                    <span className="flex-1 line-through text-muted-foreground">{todo.text}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                      onClick={(e) => handleDeleteTodo(todo.id, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});