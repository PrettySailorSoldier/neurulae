import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export function TodoTomatoes() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');

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
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', id);
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
      <div className="bg-card border border-border rounded-lg p-4 text-center">
        <div className="text-4xl mb-2">🍅</div>
        <div className="text-2xl font-bold">{completedTodos.length}</div>
        <div className="text-sm text-muted-foreground">Tomatoes Completed</div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* To-Do Column */}
        <div
          className="bg-card border-2 border-dashed border-border rounded-lg p-4 min-h-64"
          onDrop={(e) => handleDrop(e, false)}
          onDragOver={handleDragOver}
        >
          <h4 className="font-semibold mb-3 text-center">To-Do</h4>
          <div className="space-y-2">
            {activeTodos.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Add tasks above or drag completed tasks here
              </div>
            ) : (
              activeTodos.map(todo => (
                <div
                  key={todo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, todo.id)}
                  onClick={() => handleToggleTodo(todo.id)}
                  className="bg-background border border-border rounded-md p-3 cursor-move hover:bg-card transition-colors flex items-center gap-2"
                >
                  <span className="text-2xl">🍅</span>
                  <span className="flex-1">{todo.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div
          className="bg-card border-2 border-dashed border-primary/50 rounded-lg p-4 min-h-64"
          onDrop={(e) => handleDrop(e, true)}
          onDragOver={handleDragOver}
        >
          <h4 className="font-semibold mb-3 text-center">Completed</h4>
          <div className="space-y-2">
            {completedTodos.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Drag tomatoes here when complete
              </div>
            ) : (
              completedTodos.map(todo => (
                <div
                  key={todo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, todo.id)}
                  onClick={() => handleToggleTodo(todo.id)}
                  className="bg-background border border-border rounded-md p-3 cursor-move hover:bg-card transition-colors flex items-center gap-2 opacity-70"
                >
                  <span className="text-2xl">✅</span>
                  <span className="flex-1 line-through">{todo.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}