import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { Check, MoreHorizontal, Pencil, Trash2, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  categories: { id: string; name: string; icon: string }[];
}

export const TaskItem = ({ task, onToggleComplete, onDelete, onEdit, categories }: TaskItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const category = categories.find(c => c.id === task.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 shadow-sm transition-all hover:shadow-md hover:border-primary/20",
        task.completed && "opacity-60 bg-muted/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Category Indicator Strip */}
      <div className={cn(
        "w-1 h-8 rounded-full opacity-50",
        task.category === 'urgent' ? "bg-red-500" :
        task.category === 'work' ? "bg-blue-500" :
        task.category === 'school' ? "bg-indigo-500" :
        "bg-primary/50"
      )} />

      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(task.id)}
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
          task.completed 
            ? "bg-primary border-primary text-primary-foreground" 
            : "border-muted-foreground/30 hover:border-primary"
        )}
      >
        {task.completed && <Check className="w-3.5 h-3.5" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-sm font-medium transition-colors",
          task.completed ? "text-muted-foreground line-through" : "text-foreground"
        )}>
          {task.title}
        </div>
        {(category || task.estimatedMinutes) && (
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {category && (
              <span className="flex items-center gap-1 opacity-80">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </span>
            )}
            {task.estimatedMinutes && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                <span>{task.estimatedMinutes}m</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={cn(
        "flex items-center gap-1 transition-opacity",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        {onEdit && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(task)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(task.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};
