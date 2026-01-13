import { useState, useMemo } from 'react';
import { Task } from '@/types';
import { 
  ArrowLeft, Search, Check, MoreHorizontal, 
  Play, Clock, Briefcase, GraduationCap, Home, User, Calendar, Phone,
  Trash2, Pencil, ChevronDown, ChevronRight, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TaskLibraryProps {
  /** All tasks */
  tasks: Task[];
  /** Toggle task completion */
  onToggleComplete: (id: string) => void;
  /** Update a task */
  onUpdateTask: (task: Task) => void;
  /** Delete a task */
  onDeleteTask: (id: string) => void;
  /** Start work session on a task */
  onStartWorkSession?: (task: Task) => void;
  /** Close the library (mobile drawer only) */
  onClose?: () => void;
  /** Whether this is rendered as a drawer (mobile) vs inline panel (desktop) */
  isDrawer?: boolean;
  /** Currently active task ID from timer */
  activeTaskId?: string | null;
  /** Extra classes */
  className?: string;
}

// Category configuration
const categoryConfig: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  work: { name: 'Work', icon: <Briefcase className="h-4 w-4" />, color: 'text-blue-500' },
  school: { name: 'School', icon: <GraduationCap className="h-4 w-4" />, color: 'text-purple-500' },
  home: { name: 'Health & Home', icon: <Home className="h-4 w-4" />, color: 'text-green-500' },
  other: { name: 'Personal', icon: <User className="h-4 w-4" />, color: 'text-orange-500' },
  appointment: { name: 'Appointments', icon: <Calendar className="h-4 w-4" />, color: 'text-rose-500' },
  call: { name: 'Calls', icon: <Phone className="h-4 w-4" />, color: 'text-teal-500' },
};

export function TaskLibrary({
  tasks,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onStartWorkSession,
  onClose,
  isDrawer = false,
  activeTaskId,
  className,
}: TaskLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['work', 'other']));

  // Filter tasks by search
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    
    filteredTasks.forEach(task => {
      const type = task.taskType || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(task);
    });
    
    // Sort categories by task count (descending)
    const sortedCategories = Object.entries(groups)
      .sort(([, a], [, b]) => b.length - a.length);
    
    return sortedCategories;
  }, [filteredTasks]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(taskId);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      "bg-background text-foreground",
      isDrawer && "fixed inset-0 z-50",
      !isDrawer && "flex-1 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "shrink-0 p-4 border-b border-border",
        isDrawer && "bg-card"
      )}>
        <div className="flex items-center gap-3">
          {isDrawer && onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold">Task Library</h2>
            <p className="text-xs text-muted-foreground">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9"
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {tasksByCategory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No tasks found</p>
              {searchQuery && (
                <p className="text-sm">Try a different search term</p>
              )}
            </div>
          ) : (
            tasksByCategory.map(([category, categoryTasks]) => {
              const config = categoryConfig[category] || categoryConfig.other;
              const incompleteTasks = categoryTasks.filter(t => !t.completed);
              const completedTasks = categoryTasks.filter(t => t.completed);
              const isExpanded = expandedCategories.has(category);

              return (
                <Collapsible
                  key={category}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger asChild>
                    <button className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl",
                      "bg-card border border-border",
                      "hover:bg-accent/10 transition-colors"
                    )}>
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-xl",
                        "bg-muted",
                        config.color
                      )}>
                        {config.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-foreground">{config.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {incompleteTasks.length} task{incompleteTasks.length !== 1 ? 's' : ''}
                          {completedTasks.length > 0 && ` • ${completedTasks.length} done`}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-2 space-y-1 pl-2">
                      {/* Incomplete tasks first */}
                      {incompleteTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          isActive={activeTaskId === task.id}
                          onToggleComplete={onToggleComplete}
                          onStartWorkSession={onStartWorkSession}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                      
                      {/* Completed tasks */}
                      {completedTasks.length > 0 && (
                        <div className="pt-2 border-t border-border/50 mt-2">
                          <p className="text-xs text-muted-foreground mb-2 px-2">
                            Completed ({completedTasks.length})
                          </p>
                          {completedTasks.slice(0, 3).map(task => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              isActive={false}
                              onToggleComplete={onToggleComplete}
                              onStartWorkSession={onStartWorkSession}
                              onDelete={handleDeleteTask}
                            />
                          ))}
                          {completedTasks.length > 3 && (
                            <p className="text-xs text-muted-foreground px-2">
                              +{completedTasks.length - 3} more completed
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Individual task item component
interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onToggleComplete: (id: string) => void;
  onStartWorkSession?: (task: Task) => void;
  onDelete: (id: string) => void;
}

function TaskItem({ task, isActive, onToggleComplete, onStartWorkSession, onDelete }: TaskItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-2.5 rounded-lg group",
      "hover:bg-muted/50 transition-all",
      isActive && "bg-primary/10 ring-1 ring-primary"
    )}>
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggleComplete(task.id)}
        className={cn(
          "h-4 w-4",
          task.completed && "opacity-50"
        )}
      />
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm block truncate",
          task.completed && "line-through text-muted-foreground",
          isActive && "font-semibold text-primary"
        )}>
          {task.title}
        </span>
        {task.estimatedMinutes && !task.completed && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.estimatedMinutes < 60 
              ? `${task.estimatedMinutes}m` 
              : `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`
            }
          </span>
        )}
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <span className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-full shrink-0">
          <Play className="h-2 w-2 fill-current" />
          Active
        </span>
      )}

      {/* Start work button */}
      {!task.completed && onStartWorkSession && !isActive && (
        <button
          className="opacity-0 group-hover:opacity-100 shrink-0 bg-primary/10 rounded-full p-1.5 text-primary hover:bg-primary/20 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onStartWorkSession(task);
          }}
        >
          <Play className="h-3 w-3 fill-current" />
        </button>
      )}

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {onStartWorkSession && !task.completed && (
            <>
              <DropdownMenuItem onClick={() => onStartWorkSession(task)}>
                <Play className="h-4 w-4 mr-2" />
                Start Work
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem 
            onClick={() => onDelete(task.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
