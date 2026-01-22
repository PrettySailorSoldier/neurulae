import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleExplosion } from '@/components/ui/ParticleExplosion';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  categories: { id: string; name: string; icon: string }[];
  onToggleSubtask?: (parentId: string, subtaskId: string) => void;
  onDeleteSubtask?: (parentId: string, subtaskId: string) => void;

  onIndent?: (taskId: string) => void;
  onOutdent?: (taskId: string) => void;
  depth?: number;
}

// Category color map
const categoryColors: Record<string, string> = {
  work: 'hsl(217, 91%, 60%)',
  school: 'hsl(239, 84%, 67%)',
  personal: 'hsl(262, 83%, 58%)',
  home: 'hsl(43, 96%, 56%)',
  urgent: 'hsl(0, 84%, 60%)',
};

export const TaskItem = ({ 
    task, 
    onToggleComplete, 
    onDelete, 
    categories,
    onToggleSubtask,
    onDeleteSubtask,
    onEdit,
    onIndent,
    onOutdent,
    depth = 0
}: TaskItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default open for visibility
  const [isHovered, setIsHovered] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  
  // Calculate subtasks recursively if needed, but for depth 0 we just show direct children
  const subtaskList = task.subtasks || [];

  // Trigger particles on completion
  const handleToggle = () => {
      if (!task.completed) {
          setShowParticles(true);
          setTimeout(() => setShowParticles(false), 500);
      }
      onToggleComplete(task.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // Indent (Tab) / Outdent (Shift+Tab)
      if (e.key === 'Tab') {
          e.preventDefault(); // Prevent focus change
          if (e.shiftKey) {
              // Outdent
              if (onOutdent) onOutdent(task.id);
          } else {
              // Indent
              if (onIndent) onIndent(task.id);
          }
      }
  };

  return (
    <div 
        className={cn("flex flex-col outline-none", depth > 0 && "ml-4 lg:ml-6 border-l border-border/20 pl-2")}
        onKeyDown={handleKeyDown}
        // Make the row focusable so it can receive keyboard events for indentation
        tabIndex={0} 
    >
        <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
            "group flex items-center gap-2 py-2 px-2 border-b border-border/30 last:border-b-0 transition-colors hover:bg-muted/30 rounded-lg",
            task.completed && "opacity-50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        >
        {/* Expand/Collapse Arrow */}
        <div className="w-4 flex justify-center flex-shrink-0">
            {hasSubtasks ? (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-muted-foreground/50 hover:text-foreground transition-colors p-0.5"
                >
                    <Check className={cn("w-3 h-3 transition-transform", isExpanded ? "rotate-0" : "-rotate-90")} />
                    {/* Reuse Check icon as Chevron for now or import ChevronRight */}
                </button>
            ) : (
                /* Category dot if no subtasks or space filler */
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    categoryColors[task.category || 'personal'] || 'bg-muted-foreground/30'
                )} />
            )}
        </div>

        {/* Checkbox */}
        <button
            onClick={handleToggle}
            className={cn(
            "flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all relative", // Added relative
            task.completed 
                ? "bg-primary/80 border-primary/80 text-primary-foreground" 
                : "border-muted-foreground/40 hover:border-primary/60"
            )}
        >
            {task.completed && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
            {showParticles && <ParticleExplosion />}
        </button>

        {/* Task title - single line */}
        <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2">
                <span className={cn(
                    "text-sm truncate",
                    task.completed && "line-through text-muted-foreground",
                    depth === 0 && "font-medium"
                )}>
                    {task.title}
                </span>
                
                {/* Subtask Progress Badge */}
                {hasSubtasks && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                        {completedSubtasks}/{subtaskList.length}
                    </span>
                )}
            </div>
            
            {/* Details Preview (if collapsed) or just icon */}
            {task.details && !isDetailsOpen && (
                 <span className="text-[10px] text-muted-foreground/60 truncate max-w-[200px]">
                    {task.details}
                 </span>
            )}
        </div>

        {/* Time estimate - tiny inline */}
        {task.estimatedMinutes && !task.completed && (
            <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
            {task.estimatedMinutes}m
            </span>
        )}

        {/* Actions Group (Show on hover) */}
        <div className={cn(
            "flex items-center gap-1 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0 md:opacity-0" // Always show on mobile? Maybe keep opacity logic for desktop
        )}>
             {/* Details Toggle */}
             <button
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="p-1 text-muted-foreground/40 hover:text-primary"
                title="Add details"
             >
                 {/* Note icon placeholder */}
                 <span className="text-xs">📝</span>
             </button>

            {/* Delete */}
            <button
                onClick={() => onDelete(task.id)}
                className="p-1 text-muted-foreground/40 hover:text-destructive"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
        </motion.div>

        {/* Details Section - Premium Design */}
        <AnimatePresence>
            {isDetailsOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="ml-10 mr-2 mb-2 overflow-hidden"
                >
                    <div 
                        className="rounded-lg overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, ${categoryColors[task.category || 'personal']}08 0%, transparent 100%)`,
                            border: `1px solid ${categoryColors[task.category || 'personal']}20`,
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
                        }}
                    >
                        {/* Header */}
                        <div 
                            className="flex items-center justify-between px-3 py-2 border-b"
                            style={{ 
                                background: `${categoryColors[task.category || 'personal']}08`,
                                borderColor: `${categoryColors[task.category || 'personal']}15`,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm">📝</span>
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Notes</span>
                            </div>
                            <button 
                                onClick={() => setIsDetailsOpen(false)}
                                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/60 hover:bg-black/10 hover:text-foreground transition-all"
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-3">
                            <textarea 
                                className="w-full text-sm bg-transparent rounded-md p-0 border-none focus:ring-0 focus:outline-none min-h-[80px] resize-y placeholder:text-muted-foreground/40 placeholder:italic"
                                placeholder="Add notes, links, or context..."
                                defaultValue={task.details}
                                onBlur={(e) => {
                                    if (onEdit) {
                                        onEdit({ ...task, details: e.target.value });
                                    }
                                }}
                            />
                        </div>
                        
                        {/* Footer with quick actions */}
                        <div 
                            className="flex items-center gap-2 px-3 py-2 border-t"
                            style={{ 
                                background: `${categoryColors[task.category || 'personal']}05`,
                                borderColor: `${categoryColors[task.category || 'personal']}10`,
                            }}
                        >
                            <button className="text-[10px] px-2 py-1 rounded border border-transparent hover:border-current text-muted-foreground/60 hover:text-muted-foreground transition-all">
                                📎 Attach
                            </button>
                            <button className="text-[10px] px-2 py-1 rounded border border-transparent hover:border-current text-muted-foreground/60 hover:text-muted-foreground transition-all">
                                🔗 Link
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Recursive Subtasks */}
        <AnimatePresence>
            {isExpanded && hasSubtasks && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    {subtaskList.map(subtask => (
                        <TaskItem 
                            key={subtask.id}
                            task={subtask}
                            onToggleComplete={(id) => onToggleSubtask && onToggleSubtask(task.id, id)}
                            onDelete={(id) => onDeleteSubtask && onDeleteSubtask(task.id, id)}
                            onToggleSubtask={onToggleSubtask} // Pass down for deeper nesting if allowed
                            onDeleteSubtask={onDeleteSubtask}
                            categories={categories}
                            depth={depth + 1}
                            onEdit={onEdit}
                            onIndent={onIndent}
                            onOutdent={onOutdent}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};
