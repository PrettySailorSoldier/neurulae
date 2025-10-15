import { useState } from 'react';
import { Task } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, GripVertical, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ScheduledTaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onUpdateTask?: (task: Task) => void;
  estimatedMinutes?: number;
}

export function ScheduledTaskCard({ task, onToggleComplete, onUpdateTask, estimatedMinutes }: ScheduledTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');

  const handleToggleSubtask = (subtaskId: string) => {
    if (!onUpdateTask) return;
    
    const updatedSubtasks = task.subtasks?.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !onUpdateTask) return;
    
    const newSubtaskItem = {
      id: `${task.id}-sub-${Date.now()}`,
      title: newSubtask,
      completed: false
    };
    
    const updatedSubtasks = [...(task.subtasks || []), newSubtaskItem];
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
    setNewSubtask('');
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!onUpdateTask) return;
    
    const updatedSubtasks = task.subtasks?.filter(st => st.id !== subtaskId);
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleSaveNotes = () => {
    if (!onUpdateTask) return;
    onUpdateTask({ ...task, notes });
    setIsEditingNotes(false);
  };

  const hasDetails = task.subtasks?.length || task.notes || estimatedMinutes;

  return (
    <div className="group bg-card border border-border rounded-lg hover:shadow-sm transition-all">
      <div className="flex items-start gap-2 p-3 cursor-move">
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
        
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          className="mt-0.5 flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </p>
            
            {hasDetails && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          
          {estimatedMinutes && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              {formatDuration(estimatedMinutes)}
            </div>
          )}
        </div>
      </div>

      {isExpanded && hasDetails && (
        <div className="px-3 pb-3 pl-11 space-y-3 border-t border-border/50 pt-3">
          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 group/subtask">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => handleToggleSubtask(subtask.id)}
                    className="flex-shrink-0"
                  />
                  <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {subtask.title}
                  </span>
                  {onUpdateTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover/subtask:opacity-100"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                    >
                      <Trash2 className="h-3 w-3" />
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
                className="h-8 text-sm"
              />
              <Button
                onClick={handleAddSubtask}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Notes */}
          {onUpdateTask && (
            <div className="space-y-2">
              {isEditingNotes ? (
                <>
                  <Textarea
                    placeholder="Add notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNotes} size="sm" variant="secondary">
                      Save
                    </Button>
                    <Button 
                      onClick={() => {
                        setNotes(task.notes || '');
                        setIsEditingNotes(false);
                      }} 
                      size="sm" 
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div onClick={() => setIsEditingNotes(true)} className="cursor-pointer">
                  {task.notes ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50">Add notes...</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
