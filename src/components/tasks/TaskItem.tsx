import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  categories: { id: string; name: string; icon: string }[];
}

// Category color map
const categoryColors: Record<string, string> = {
  work: 'bg-blue-500',
  school: 'bg-indigo-500',
  personal: 'bg-violet-500',
  home: 'bg-amber-500',
  urgent: 'bg-red-500',
};

export const TaskItem = ({ task, onToggleComplete, onDelete, categories }: TaskItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "group flex items-center gap-2 py-1.5 px-1 border-b border-border/30 last:border-b-0 transition-colors hover:bg-muted/30",
        task.completed && "opacity-50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Category dot */}
      <div className={cn(
        "w-1.5 h-1.5 rounded-full flex-shrink-0",
        categoryColors[task.category || 'personal'] || 'bg-muted-foreground/30'
      )} />

      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(task.id)}
        className={cn(
          "flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all",
          task.completed 
            ? "bg-primary/80 border-primary/80 text-primary-foreground" 
            : "border-muted-foreground/40 hover:border-primary/60"
        )}
      >
        {task.completed && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
      </button>

      {/* Task title - single line */}
      <span className={cn(
        "flex-1 text-sm truncate",
        task.completed && "line-through text-muted-foreground"
      )}>
        {task.title}
      </span>

      {/* Time estimate - tiny inline */}
      {task.estimatedMinutes && !task.completed && (
        <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
          {task.estimatedMinutes}m
        </span>
      )}

      {/* Delete on hover */}
      <button
        onClick={() => onDelete(task.id)}
        className={cn(
          "flex-shrink-0 p-0.5 text-muted-foreground/40 hover:text-destructive transition-opacity",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </motion.div>
  );
};
