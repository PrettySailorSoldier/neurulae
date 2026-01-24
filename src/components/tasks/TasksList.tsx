import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { TaskListsGrid } from './TaskListsGrid';
import { CategorySidebar } from './CategorySidebar';
import { QuickAddModal } from './QuickAddModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, LayoutGrid, List } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Task } from '@/types';

interface TasksListProps {
  // Active work session props
  activeTaskId?: string | null;
  activeElapsed?: number; // seconds elapsed in current session
  onStartWork?: (task: Task) => void;
}

export const TasksList = ({ 
  activeTaskId,
  activeElapsed = 0,
  onStartWork,
}: TasksListProps = {}) => {
  const { 
    tasks, 
    addTask, 
    toggleTask, 
    deleteTask, 
    updateTask, 
    DEFAULT_CATEGORIES,
    toggleSubtask,
    deleteSubtask,
    // Task list management
    taskLists,
    addTaskList,
    updateTaskList,
    deleteTaskList,
    getTasksByList,
    // Indent/Outdent for Tab key subtask creation
    nestTaskAsSubtask,
    unnestSubtask,
    // Reorder for drag and drop
    reorderTasksInList,
  } = useTasks();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Filter tasks by category and search (applied across all lists)
  const filteredTasksByList = useMemo(() => {
    return (listId: string) => {
      const listTasks = tasks.filter(t => t.taskListId === listId && !t.parentId);
      return listTasks.filter(task => {
        const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
        const matchesSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }).sort((a, b) => {
        // Active task always first
        if (activeTaskId) {
          if (a.id === activeTaskId) return -1;
          if (b.id === activeTaskId) return 1;
        }
        // Sort by completion status (incomplete first), then by creation date
        if (a.completed === b.completed) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.completed ? 1 : -1;
      });
    };
  }, [tasks, selectedCategory, searchQuery, activeTaskId]);

  // Counts for sidebar
  const counts = useMemo(() => {
    const acc = DEFAULT_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {} as Record<string, number>);
    tasks.forEach(task => {
       if (!task.completed) {
         acc['all']++;
         if (task.category && acc[task.category] !== undefined) acc[task.category]++;
         // Fallback for types if migration hasn't run fully or for legacy data compatibility
         else if (task.taskType && acc[task.taskType] !== undefined) acc[task.taskType]++;
       }
    });
    return acc;
  }, [tasks, DEFAULT_CATEGORIES]);

  // Handle Quick Add
  const handleAddTask = (title: string, category: string, estimatedMinutes?: number, listId?: string) => {
    addTask(title, category, estimatedMinutes, listId);
  };

  return (
    <div className={cn(
      "flex h-[calc(100vh-140px)] w-full overflow-hidden rounded-xl",
      // Transparent background to show wallpaper/theme through
      "bg-transparent"
    )}>
      {/* Sidebar - Solid background, hidden on mobile */}
      {!isMobile && (
        <div className={cn(
          "w-64 min-w-[250px] flex-shrink-0",
          // Solid background for sidebar
          "bg-card border-r border-border/40"
        )}>
          <CategorySidebar 
            categories={DEFAULT_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={counts}
            onAddList={() => {
              // Will be handled by the grid's add list button
            }}
          />
        </div>
      )}

      {/* Main Content - Transparent */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Glassmorphic */}
        <div className={cn(
          "p-3 flex items-center gap-3",
          "bg-background/40 backdrop-blur-sm",
          "border-b border-border/20"
        )}>
          {isMobile && (
             // Mobile category selector
             <div className="overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
               {DEFAULT_CATEGORIES.slice(0, 4).map(cat => (
                 <Button
                   key={cat.id}
                   variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                   size="sm"
                   className="h-7 rounded-full px-2.5 text-xs flex-shrink-0"
                   onClick={() => setSelectedCategory(cat.id)}
                 >
                   <span className="mr-1">{cat.icon}</span>
                   {cat.name}
                 </Button>
               ))}
             </div>
          )}
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 bg-background/50 border-border/30 focus:bg-background/80 transition-colors text-sm"
            />
          </div>
          
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            size="sm"
            className="gap-1.5 h-8 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>

        {/* Multi-column Task Lists Grid */}
        <TaskListsGrid
          taskLists={taskLists}
          tasks={tasks}
          onToggleComplete={toggleTask}
          onDeleteTask={deleteTask}
          onUpdateTask={(task) => updateTask(task.id, task)}
          onAddTask={handleAddTask}
          onAddTaskList={addTaskList}
          onUpdateTaskList={updateTaskList}
          onDeleteTaskList={deleteTaskList}
          getTasksByList={filteredTasksByList}
          categories={DEFAULT_CATEGORIES}
          onToggleSubtask={toggleSubtask}
          onDeleteSubtask={deleteSubtask}
          activeTaskId={activeTaskId}
          activeElapsed={activeElapsed}
          onStartWork={onStartWork}
          onNestTaskAsSubtask={nestTaskAsSubtask}
          onUnnestSubtask={unnestSubtask}
          onReorderTasksInList={reorderTasksInList}
        />
      </div>

      <QuickAddModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddTask}
        defaultCategory={selectedCategory}
      />
    </div>
  );
};
