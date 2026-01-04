import { useState } from 'react';
import { Task, SubTask, ScheduledTask } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, ChevronDown, ChevronRight, Plus, Trash2, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ScheduledTaskCardProps {
  task: Task;
  scheduledTask?: ScheduledTask;
  onUpdateTask?: (task: Task) => void;
  onToggleComplete?: (taskId: string) => void;
  onDelete?: () => void;
  className?: string;
}

export function ScheduledTaskCard({ 
  task, 
  scheduledTask, 
  onUpdateTask, 
  onToggleComplete, 
  onDelete,
  className 
}: ScheduledTaskCardProps) {
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleSubtask = (subtaskId: string) => {
    if (!onUpdateTask) return;
    const updatedSubtasks = (task.subtasks || []).map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleAddSubtask = () => {
    if (!onUpdateTask || !newSubtask.trim()) return;
    
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
    if (!onUpdateTask) return;
    const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleSaveNotes = () => {
    if (!onUpdateTask) return;
    onUpdateTask({ ...task, notes: notes.trim() });
    setIsEditingNotes(false);
  };

  const hasDetails = (task.subtasks && task.subtasks.length > 0) || task.notes;

  return (
    <div className={cn("bg-card border border-border rounded-lg shadow-sm p-3 hover:shadow-md transition-all", className)}>
      <div className="flex items-start gap-3">
        {onToggleComplete && (
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            className="mt-1"
          />
        )}
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn("font-medium text-sm", task.completed && "line-through text-muted-foreground")}>
              {task.title}
            </h4>
            {scheduledTask?.estimatedMinutes && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 flex gap-1 items-center flex-shrink-0">
                <Clock className="w-3 h-3" />
                {scheduledTask.estimatedMinutes}m
              </Badge>
            )}
          </div>
          
          {(task.taskType || task.course) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {task.taskType && <span className="capitalize">{task.taskType}</span>}
              {task.taskType && task.course && <span>•</span>}
              {task.course && <span>{task.course}</span>}
            </div>
          )}

          {/* Expand/Collapse Toggle */}
          {hasDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 -ml-2 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
              {isExpanded ? 'Hide details' : 'Show details'}
            </Button>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-2 space-y-3 pl-2 border-l-2 border-primary/10">
              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-1.5">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="group/subtask flex items-center gap-2">
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(subtask.id)}
                        className="h-3.5 w-3.5"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-xs block truncate",
                          subtask.completed ? 'line-through text-muted-foreground' : ''
                        )}>
                          {subtask.title}
                        </span>
                        {(subtask.description || subtask.tip) && !subtask.completed && (
                          <div className="text-[10px] text-muted-foreground ml-1">
                             {subtask.description}
                          </div>
                        )}
                      </div>
                      
                      {onUpdateTask && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover/subtask:opacity-100"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add subtask */}
              {onUpdateTask && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add subtask..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    className="h-7 text-xs"
                  />
                  <Button
                    onClick={handleAddSubtask}
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Notes */}
              {onUpdateTask && (
                <div className="space-y-2 pt-1">
                  {isEditingNotes ? (
                    <>
                      <Textarea
                        placeholder="Add notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[60px] text-xs resize-none"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveNotes} size="sm" variant="secondary" className="h-6 text-xs">
                          Save
                        </Button>
                        <Button 
                          onClick={() => {
                            setNotes(task.notes || '');
                            setIsEditingNotes(false);
                          }} 
                          size="sm" 
                          variant="ghost"
                          className="h-6 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div 
                      onClick={() => setIsEditingNotes(true)} 
                      className="cursor-pointer hover:bg-muted/50 p-1.5 rounded -ml-1.5"
                    >
                      {task.notes ? (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{task.notes}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Add notes...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
