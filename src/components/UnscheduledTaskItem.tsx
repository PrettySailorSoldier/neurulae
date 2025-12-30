import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Trash2, Sparkles, BookOpen, Briefcase, Home, Calendar, Phone, FileText, Target, ListTodo } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Task, SubTask } from '@/types';
import { cn } from '@/lib/utils';

interface UnscheduledTaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAskAI?: (message: string) => void;
  onBreakdownTask?: (task: Task) => void;
  onStartIntention?: (task: Task) => void;
  isActiveIntention?: boolean;
  showQuickActions?: boolean;
}

export function UnscheduledTaskItem({
  task,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onAskAI,
  onBreakdownTask,
  onStartIntention,
  isActiveIntention = false,
  showQuickActions = true
}: UnscheduledTaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [justCompleted, setJustCompleted] = useState(false);
  const isMobile = useIsMobile();

  // Calculate priority based on due date
  const getPriorityLevel = (): 'high' | 'medium' | 'low' | null => {
    if (!task.dueDate) return null;

    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) return 'high'; // Overdue
    if (hoursUntilDue <= 24) return 'high'; // Due within 24 hours
    if (hoursUntilDue <= 72) return 'medium'; // Due within 3 days
    return 'low'; // Due later
  };

  const priority = getPriorityLevel();

  // Calculate progress for tasks with subtasks
  const getProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter(st => st.completed).length;
    const total = task.subtasks.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const progress = getProgress();

  // Get priority color classes
  const getPriorityColors = () => {
    if (!priority) return null;

    switch (priority) {
      case 'high':
        return {
          border: 'border-red-500/40',
          ring: 'ring-1 ring-red-500/20',
          bg: 'bg-red-500/5',
          badge: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
        };
      case 'medium':
        return {
          border: 'border-yellow-500/40',
          ring: 'ring-1 ring-yellow-500/20',
          bg: 'bg-yellow-500/5',
          badge: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
        };
      case 'low':
        return {
          border: 'border-green-500/40',
          ring: 'ring-1 ring-green-500/20',
          bg: 'bg-green-500/5',
          badge: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30'
        };
    }
  };

  const priorityColors = getPriorityColors();

  // Handle completion with animation
  const handleToggleComplete = () => {
    if (!task.completed) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onToggleComplete(task.id);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = (task.subtasks || []).map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const newSubtaskItem: SubTask = {
      id: crypto.randomUUID(),
      title: newSubtask.trim(),
      completed: false,
    };
    
    onUpdateTask({
      ...task,
      subtasks: [...(task.subtasks || []), newSubtaskItem],
    });
    
    setNewSubtask('');
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleSaveNotes = () => {
    onUpdateTask({ ...task, notes: notes.trim() });
    setIsEditingNotes(false);
  };

  const hasDetails = (task.subtasks && task.subtasks.length > 0) || task.notes || isExpanded;

  const getTaskTypeIcon = () => {
    switch (task.taskType) {
      case 'school':
        return <BookOpen className="h-4 w-4 text-primary" />;
      case 'work':
        return <Briefcase className="h-4 w-4 text-primary" />;
      case 'home':
        return <Home className="h-4 w-4 text-primary" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'call':
        return <Phone className="h-4 w-4 text-primary" />;
      default:
        return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  // Progress ring SVG component
  const ProgressRing = ({ progress }: { progress: number }) => {
    const size = 20;
    const strokeWidth = 2.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted-foreground/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-primary transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[8px] font-semibold text-primary">
          {progress}
        </span>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "border rounded-lg shadow-sm transition-all duration-300",
        justCompleted && "animate-pulse scale-[0.98]",
        isActiveIntention
          ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
          : priorityColors
          ? `${priorityColors.border} ${priorityColors.ring} ${priorityColors.bg}`
          : 'border-border bg-card',
        !task.completed && "hover:shadow-md hover:scale-[1.01]",
        task.completed && "opacity-60"
      )}
    >
      {/* Main row - always visible */}
      <div className="flex items-center gap-3 p-3 group">
        {hasDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
        
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleToggleComplete}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-transform"
        />

        {/* Progress ring or task type icon */}
        {progress ? (
          <div className="flex-shrink-0">
            <ProgressRing progress={progress.percentage} />
          </div>
        ) : task.taskType ? (
          <div className="flex-shrink-0">
            {getTaskTypeIcon()}
          </div>
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-sm font-medium transition-all",
              task.completed ? 'line-through text-muted-foreground' : 'text-card-foreground'
            )}>
              {task.title}
            </span>
            {task.course && (
              <span className="text-xs text-primary/80">({task.course})</span>
            )}
            {priority && (
              <Badge
                variant="outline"
                className={cn("text-xs px-2 py-0", priorityColors?.badge)}
              >
                {priority === 'high' ? '🔴 Urgent' : priority === 'medium' ? '🟡 Soon' : '🟢 Later'}
              </Badge>
            )}
            {task.type && (
              <Badge variant="outline" className="text-xs">
                {task.type === 'daily' ? '📅 Today' : '🎯 Ongoing'}
              </Badge>
            )}
            {progress && (
              <span className="text-xs text-muted-foreground">
                {progress.completed}/{progress.total} done
              </span>
            )}
          </div>
        </div>

        {task.focusTimeMinutes && (
          <span className="text-xs text-muted-foreground">
            {task.focusTimeMinutes}m
          </span>
        )}

        {showQuickActions && onStartIntention && !task.completed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStartIntention(task);
            }}
            className={`h-6 w-6 p-0 transition-opacity ${
              isActiveIntention
                ? 'opacity-100 text-primary'
                : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary'
            }`}
            title={isActiveIntention ? "Currently working on this" : "Start working on this task"}
            aria-label="Start intention"
          >
            <Target className="h-3.5 w-3.5" />
          </Button>
        )}

        {showQuickActions && onBreakdownTask && !task.subtasks?.length && !task.completed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBreakdownTask(task);
            }}
            className={`h-6 w-6 p-0 transition-opacity ${
              isMobile ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Break down this task with AI"
            aria-label="Break down task"
          >
            <ListTodo className="h-3.5 w-3.5 text-primary" />
          </Button>
        )}

        {showQuickActions && onAskAI && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAskAI(`Help me schedule: ${task.title}`);
            }}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Schedule with AI (S)"
            aria-label="Schedule task with AI"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteTask(task.id)}
          className={`h-6 w-6 p-0 transition-opacity text-muted-foreground hover:text-destructive ${
            isMobile ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>

        {!hasDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className={`h-6 w-6 p-0 transition-opacity ${
              isMobile ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-3 border-t border-border/50 pt-2 ml-8">
          {/* Subtasks */}
          <div className="space-y-1">
            {task.subtasks?.map((subtask) => (
              <div key={subtask.id} className="flex items-center gap-2 group/subtask">
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={() => handleToggleSubtask(subtask.id)}
                  className="h-3.5 w-3.5"
                />
                <span className={`flex-1 text-xs ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {subtask.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  className="h-5 w-5 p-0 opacity-0 group-hover/subtask:opacity-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            <div className="flex gap-2 items-center">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add subtask..."
                className="h-7 text-xs"
              />
              <Button
                onClick={handleAddSubtask}
                variant="ghost"
                size="sm"
                className="h-7 px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setNotes(task.notes || '');
                      setIsEditingNotes(false);
                    }
                  }}
                  placeholder="Add notes..."
                  className="text-xs min-h-[60px] resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveNotes} size="sm" className="h-7 text-xs">
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setNotes(task.notes || '');
                      setIsEditingNotes(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingNotes(true)}
                className="text-xs text-muted-foreground cursor-text hover:text-card-foreground transition-colors p-2 rounded border border-dashed border-border/50 hover:border-border min-h-[40px]"
              >
                {task.notes || 'Add notes...'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
