import { useState } from 'react';
import { Task, TaskList } from '@/types';
import { TaskItem } from './TaskItem';
import { cn } from '@/lib/utils';
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatePresence, motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface TaskListColumnProps {
  list: TaskList;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onAddTask: (title: string, listId: string) => void;
  onUpdateList: (listId: string, updates: Partial<TaskList>) => void;
  onDeleteList: (listId: string) => void;
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
  onReorderTasks?: (listId: string, reorderedTaskIds: string[]) => void;
}

export const TaskListColumn = ({
  list,
  tasks,
  onToggleComplete,
  onDeleteTask,
  onUpdateTask,
  onAddTask,
  onUpdateList,
  onDeleteList,
  categories,
  onToggleSubtask,
  onDeleteSubtask,
  activeTaskId,
  activeElapsed = 0,
  onStartWork,
  onNestTaskAsSubtask,
  onUnnestSubtask,
  onReorderTasks,
}: TaskListColumnProps) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(list.name);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), list.id);
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleRename = () => {
    if (editedName.trim() && editedName !== list.name) {
      onUpdateList(list.id, { name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // Handle drag end for reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Don't do anything if dropped in same position
    if (source.index === destination.index) return;
    
    // Reorder incomplete tasks
    const reordered = Array.from(incompleteTasks);
    const [movedTask] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, movedTask);
    
    // Call reorder handler with new order
    if (onReorderTasks) {
      const newOrder = [
        ...reordered.map(t => t.id),
        ...completedTasks.map(t => t.id),
      ];
      onReorderTasks(list.id, newOrder);
    }
  };

  // Handle indent (Tab key) - make task a subtask of the one above it
  const handleIndentTask = (taskId: string) => {
    const taskIndex = incompleteTasks.findIndex(t => t.id === taskId);
    
    // Can't indent if it's the first task or has no task above
    if (taskIndex <= 0) return;
    
    const taskAbove = incompleteTasks[taskIndex - 1];
    
    // Don't nest under a task that's already a subtask
    if (taskAbove.parentId) return;
    
    if (onNestTaskAsSubtask) {
      onNestTaskAsSubtask(taskId, taskAbove.id);
    }
  };

  // Handle outdent (Shift+Tab) - promote subtask to regular task
  const handleOutdentTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.parentId) return;
    
    if (onUnnestSubtask) {
      onUnnestSubtask(task.parentId, taskId);
    }
  };

  return (
    <div className="flex flex-col w-[280px] min-w-[280px] h-full">
      {/* Column Container - Glassmorphic */}
      <div className={cn(
        "flex flex-col h-full rounded-xl overflow-hidden",
        "bg-background/30 backdrop-blur-md",
        "border border-border/30"
      )}>
        {/* Column Header */}
        <div className={cn(
          "flex items-center justify-between px-3 py-2.5",
          "border-b border-border/20"
        )}>
          {isEditingName ? (
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setEditedName(list.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="h-7 text-sm font-semibold bg-transparent border-none px-1 focus-visible:ring-1"
            />
          ) : (
            <div className="flex items-center gap-2">
              {list.icon && <span className="text-sm">{list.icon}</span>}
              <h3 className="font-semibold text-sm text-foreground/90">{list.name}</h3>
              <span className="text-xs text-muted-foreground">
                {incompleteTasks.length}
              </span>
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteList(list.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Add Task Button/Input */}
        <div className="px-2 py-2 border-b border-border/10">
          {isAddingTask ? (
            <div className="flex flex-col gap-1">
              <Input
                placeholder="Task name..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newTaskTitle.trim()) {
                    setIsAddingTask(false);
                  }
                }}
                autoFocus
                className="h-8 text-sm bg-background/50"
              />
              <div className="flex gap-1">
                <Button size="sm" onClick={handleAddTask} className="h-6 text-xs flex-1">
                  Add
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setNewTaskTitle('');
                    setIsAddingTask(false);
                  }}
                  className="h-6 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingTask(true)}
              className="w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add a task
            </Button>
          )}
        </div>

        {/* Tasks List with Drag and Drop */}
        <ScrollArea className="flex-1">
          <div className="px-1 py-1">
            {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground/60"
              >
                <p className="text-xs">No tasks yet</p>
              </motion.div>
            ) : (
              <>
                {/* Incomplete tasks - Draggable */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId={`list-${list.id}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "min-h-[20px] transition-colors duration-200",
                          snapshot.isDraggingOver && "bg-primary/5 rounded-lg"
                        )}
                      >
                        <AnimatePresence mode="popLayout">
                          {incompleteTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  className={cn(
                                    "transition-shadow duration-200",
                                    dragSnapshot.isDragging && "shadow-lg rounded-lg bg-background/80 backdrop-blur-sm"
                                  )}
                                >
                                  <TaskItem
                                    task={task}
                                    onToggleComplete={onToggleComplete}
                                    onDelete={onDeleteTask}
                                    onEdit={onUpdateTask}
                                    categories={categories}
                                    onToggleSubtask={onToggleSubtask}
                                    onDeleteSubtask={onDeleteSubtask}
                                    isActive={task.id === activeTaskId}
                                    activeElapsed={task.id === activeTaskId ? activeElapsed : 0}
                                    onStartWork={onStartWork}
                                    onIndent={() => handleIndentTask(task.id)}
                                    onOutdent={() => handleOutdentTask(task.id)}
                                    dragHandleProps={dragProvided.dragHandleProps}
                                    isDragging={dragSnapshot.isDragging}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </AnimatePresence>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                
                {/* Completed tasks section */}
                {completedTasks.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-border/20">
                    <p className="text-xs text-muted-foreground/60 px-2 mb-1">
                      Completed ({completedTasks.length})
                    </p>
                    {completedTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onDelete={onDeleteTask}
                        onEdit={onUpdateTask}
                        categories={categories}
                        onToggleSubtask={onToggleSubtask}
                        onDeleteSubtask={onDeleteSubtask}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
