import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { TaskItem } from './TaskItem';
import { CategorySidebar } from './CategorySidebar';
import { QuickAddModal } from './QuickAddModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export const TasksList = () => {
  const { 
    tasks, 
    addTask, 
    toggleTask, 
    deleteTask, 
    updateTask, 
    DEFAULT_CATEGORIES,
    toggleSubtask,
    deleteSubtask 
  } = useTasks();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      // Sort by completion status first (incomplete first), then creation date
      if (a.completed === b.completed) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.completed ? 1 : -1;
    });
  }, [tasks, selectedCategory, searchQuery]);

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
  const handleAddTask = (title: string, category: string, estimatedMinutes?: number) => {
    addTask(title, category, estimatedMinutes);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-background rounded-xl border border-border shadow-sm">
      {/* Sidebar - Hidden on mobile unless we add a drawer, but for now stack or use Tabs on mobile */}
      {!isMobile && (
        <div className="w-64 min-w-[250px] flex-shrink-0">
          <CategorySidebar 
            categories={DEFAULT_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={counts}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-card/50">
        {/* Header */}
        <div className="p-4 border-b border-border/40 flex items-center gap-4 bg-background/50 backdrop-blur-sm">
          {isMobile && (
             // Simple category selector for mobile if needed, or rely on top tabs
             // For now, let's just keep it simple
             <div className="md:hidden">
                {/* Mobile Category Dropdown could go here */}
             </div>
          )}
          
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/20 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>

        {/* Categories Horizontal Scroll for Mobile */}
        {isMobile && (
           <div className="overflow-x-auto whitespace-nowrap p-2 border-b border-border/40 flex gap-2 scrollbar-none">
             {DEFAULT_CATEGORIES.map(cat => (
               <Button
                 key={cat.id}
                 variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                 size="sm"
                 className="h-8 rounded-full px-3 text-xs"
                 onClick={() => setSelectedCategory(cat.id)}
               >
                 <span className="mr-1">{cat.icon}</span>
                 {cat.name}
                 {counts[cat.id] > 0 && <span className="ml-1.5 opacity-60">({counts[cat.id]})</span>}
               </Button>
             ))}
           </div>
        )}

        {/* Tasks List - Compact */}
        <ScrollArea className="flex-1">
          <div className="px-3 py-2 max-w-2xl mx-auto">
            <AnimatePresence mode="popLayout">
              {filteredTasks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <p className="text-sm">No tasks in this list.</p>
                  <Button variant="link" size="sm" onClick={() => setIsAddModalOpen(true)}>Add one</Button>
                </motion.div>
              ) : (
              ) : (
                filteredTasks
                    .filter(task => !task.parentId) // Only show top-level tasks
                    .map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggleComplete={toggleTask}
                    onDelete={deleteTask}
                    onEdit={(updatedTask) => updateTask(updatedTask.id, updatedTask)}
                    categories={DEFAULT_CATEGORIES}
                    // Subtask handlers
                    onToggleSubtask={toggleSubtask}
                    onDeleteSubtask={deleteSubtask}
                  />
                ))
              )}
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
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
