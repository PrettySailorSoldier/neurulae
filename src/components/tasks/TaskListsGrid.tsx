import { useState } from 'react';
import { Task, TaskList } from '@/types';
import { TaskListColumn } from './TaskListColumn';
import { CreateListDialog } from './CreateListDialog';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskListsGridProps {
  taskLists: TaskList[];
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onAddTask: (title: string, category: string, estimatedMinutes?: number, listId?: string) => void;
  onAddTaskList: (name: string, icon?: string, color?: string) => TaskList;
  onUpdateTaskList: (listId: string, updates: Partial<TaskList>) => void;
  onDeleteTaskList: (listId: string) => void;
  getTasksByList: (listId: string) => Task[];
  categories: { id: string; name: string; icon: string }[];
  // Subtask handlers
  onToggleSubtask?: (parentId: string, subtaskId: string) => void;
  onDeleteSubtask?: (parentId: string, subtaskId: string) => void;
  // Active work session
  activeTaskId?: string | null;
  activeElapsed?: number;
  onStartWork?: (task: Task) => void;
  // Indent/Outdent handlers (Tab key subtask creation)
  onNestTaskAsSubtask?: (taskId: string, newParentId: string) => void;
  onUnnestSubtask?: (parentId: string, subtaskId: string) => void;
  // Reorder handler
  onReorderTasksInList?: (listId: string, orderedTaskIds: string[]) => void;
}

export const TaskListsGrid = ({
  taskLists,
  tasks,
  onToggleComplete,
  onDeleteTask,
  onUpdateTask,
  onAddTask,
  onAddTaskList,
  onUpdateTaskList,
  onDeleteTaskList,
  getTasksByList,
  categories,
  onToggleSubtask,
  onDeleteSubtask,
  activeTaskId,
  activeElapsed = 0,
  onStartWork,
  onNestTaskAsSubtask,
  onUnnestSubtask,
  onReorderTasksInList,
}: TaskListsGridProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Sort lists by order
  const sortedLists = [...taskLists].sort((a, b) => a.order - b.order);

  const handleAddTaskToList = (title: string, listId: string) => {
    onAddTask(title, 'personal', undefined, listId);
  };

  const handleCreateList = (name: string, icon?: string, color?: string) => {
    onAddTaskList(name, icon, color);
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="flex-1 overflow-hidden">
      {/* Horizontal scroll container */}
      <div className={cn(
        "flex gap-4 h-full overflow-x-auto overflow-y-hidden",
        "px-4 py-3",
        "scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
      )}>
        {/* Task list columns */}
        {sortedLists.map(list => (
          <TaskListColumn
            key={list.id}
            list={list}
            tasks={getTasksByList(list.id)}
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
            onAddTask={handleAddTaskToList}
            onUpdateList={onUpdateTaskList}
            onDeleteList={onDeleteTaskList}
            categories={categories}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
            activeTaskId={activeTaskId}
            activeElapsed={activeElapsed}
            onStartWork={onStartWork}
            onNestTaskAsSubtask={onNestTaskAsSubtask}
            onUnnestSubtask={onUnnestSubtask}
            onReorderTasks={onReorderTasksInList}
          />
        ))}

        {/* Add new list button */}
        <div className="flex-shrink-0 w-[280px] min-w-[280px] h-full">
          <Button
            variant="ghost"
            onClick={() => setIsCreateDialogOpen(true)}
            className={cn(
              "w-full h-12 justify-start gap-2",
              "bg-background/20 hover:bg-background/30",
              "border border-dashed border-border/40 hover:border-border/60",
              "rounded-xl text-muted-foreground hover:text-foreground",
              "transition-all duration-200"
            )}
          >
            <Plus className="h-4 w-4" />
            Add another list
          </Button>
        </div>
      </div>

      {/* Create List Dialog */}
      <CreateListDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreateList}
      />
    </div>
  );
};
