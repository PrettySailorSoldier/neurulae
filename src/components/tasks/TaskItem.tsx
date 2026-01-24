import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Trash2, Play, GripVertical, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleExplosion } from '@/components/ui/ParticleExplosion';
import { Badge } from '@/components/ui/badge';
import { getContrastColor, isLightBackground } from '@/lib/getContrastColor';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

// Format elapsed time (seconds) to MM:SS or H:MM:SS
const formatElapsedTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  categories: { id: string; name: string; icon: string }[];
  onToggleSubtask?: (parentId: string, subtaskId: string) => void;
  onDeleteSubtask?: (parentId: string, subtaskId: string) => void;

  onIndent?: () => void;
  onOutdent?: () => void;
  depth?: number;
  
  // Active work session props
  isActive?: boolean;
  activeElapsed?: number; // seconds elapsed in current session
  onStartWork?: (task: Task) => void;
  
  // Drag and drop props
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging?: boolean;
}

// Category color map with accessible text colors
const categoryColors: Record<string, { bg: string; text: string }> = {
  work: { 
    bg: 'hsl(217, 91%, 60%)', 
    text: 'hsl(0, 0%, 100%)' 
  },
  school: { 
    bg: 'hsl(239, 84%, 67%)', 
    text: 'hsl(0, 0%, 100%)' 
  },
  personal: { 
    bg: 'hsl(262, 83%, 58%)', 
    text: 'hsl(0, 0%, 100%)' 
  },
  home: { 
    bg: 'hsl(43, 96%, 56%)', 
    text: 'hsl(0, 0%, 10%)' // Dark text for yellow background
  },
  urgent: { 
    bg: 'hsl(0, 84%, 60%)', 
    text: 'hsl(0, 0%, 100%)' 
  },
};

// Get category color with automatic contrast text
const getCategoryStyle = (category: string | undefined) => {
  const categoryKey = category || 'personal';
  const colors = categoryColors[categoryKey];
  
  if (colors) {
    return {
      backgroundColor: colors.bg,
      color: colors.text,
    };
  }
  
  // Fallback with dynamic contrast calculation
  const defaultBg = 'hsl(262, 83%, 58%)';
  return {
    backgroundColor: defaultBg,
    color: getContrastColor(defaultBg),
  };
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
    depth = 0,
    isActive = false,
    activeElapsed = 0,
    onStartWork,
    dragHandleProps,
    isDragging = false,
}: TaskItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default open for visibility
  const [isHovered, setIsHovered] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  
  // Calculate subtasks recursively if needed, but for depth 0 we just show direct children
  const subtaskList = task.subtasks || [];
  
  // Get category styling with accessible contrast
  const categoryStyle = getCategoryStyle(task.category);
  const categoryBgColor = categoryStyle.backgroundColor;

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
              // Outdent - make subtask back into regular task
              if (onOutdent) onOutdent();
          } else {
              // Indent - make task a subtask of the one above
              if (onIndent) onIndent();
          }
      }
  };

  return (
    <div 
        className={cn(
          "flex flex-col outline-none", 
          depth > 0 && "ml-4 lg:ml-6 border-l border-border/20 pl-2",
          isDragging && "opacity-90"
        )}
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
            "group flex items-center gap-2 py-2 px-2 border-b border-border/30 last:border-b-0 transition-all hover:bg-muted/30 rounded-lg",
            task.completed && "opacity-50",
            isActive && "border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500/50 border-l-4 border-l-green-500",
            isDragging && "shadow-lg bg-background/95 backdrop-blur-sm"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        >
        {/* Drag Handle */}
        {dragHandleProps && (
          <div 
            {...dragHandleProps}
            className={cn(
              "flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded transition-colors",
              "text-muted-foreground/30 hover:text-muted-foreground/60",
              isHovered && "text-muted-foreground/50"
            )}
            title="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Expand/Collapse Arrow */}
        <div className="w-4 flex justify-center flex-shrink-0">
            {hasSubtasks ? (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-muted-foreground/50 hover:text-foreground transition-colors p-0.5"
                >
                    <ChevronRight className={cn(
                      "w-3 h-3 transition-transform duration-200", 
                      isExpanded && "rotate-90"
                    )} />
                </button>
            ) : (
                /* Category dot if no subtasks or space filler */
                <div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: categoryBgColor }}
                />
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
                
                {/* Category Badge with accessible contrast */}
                {task.category && !task.completed && (
                  <span 
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide"
                    style={categoryStyle}
                  >
                    {task.category}
                  </span>
                )}
                
                {/* Subtask Progress Badge */}
                {hasSubtasks && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                        {completedSubtasks}/{subtaskList.length}
                    </span>
                )}
                
                {/* Active Session Badge */}
                {isActive && (
                    <Badge variant="outline" className="ml-1 border-green-500 text-green-700 dark:text-green-300 text-[10px] px-1.5 py-0">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
                        Active
                    </Badge>
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

        {/* Active Session Elapsed Time */}
        {isActive && (
            <span className="text-xs text-green-600 dark:text-green-400 font-mono flex-shrink-0 tabular-nums">
                {formatElapsedTime(activeElapsed)}
            </span>
        )}

        {/* Start Work Button - shows for incomplete, non-active tasks */}
        {!task.completed && !isActive && onStartWork && (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onStartWork(task);
                }}
                className="flex-shrink-0 p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full hover:scale-110 transition-all"
                title="Start working on this task"
                aria-label={`Start working on ${task.title}`}
            >
                <Play className="w-3 h-3 fill-current" />
            </button>
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

        {/* Details Section - Premium Design with accessible contrast */}
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
                            background: `linear-gradient(135deg, ${categoryBgColor}08 0%, transparent 100%)`,
                            border: `1px solid ${categoryBgColor}20`,
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
                        }}
                    >
                        {/* Header */}
                        <div 
                            className="flex items-center justify-between px-3 py-2 border-b"
                            style={{ 
                                background: `${categoryBgColor}08`,
                                borderColor: `${categoryBgColor}15`,
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
                                background: `${categoryBgColor}05`,
                                borderColor: `${categoryBgColor}10`,
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
