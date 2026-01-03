import { useState } from 'react';
import { Task } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, GripVertical, ChevronDown, ChevronRight, Plus, Trash2, Sparkles } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ... (existing code omitted) ...

              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="group/subtask">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => handleToggleSubtask(subtask.id)}
                      className="mt-0.5 self-start flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-sm transition-colors",
                          subtask.completed ? 'line-through text-muted-foreground' : ''
                        )}>
                          {subtask.title}
                        </span>
                        
                        {/* Subtask Meta Badges */}
                        {!subtask.completed && (
                          <div className="flex items-center gap-1.5 opacity-80">
                            {subtask.estimatedMinutes && (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/50 px-1 rounded">
                                <Clock className="w-2.5 h-2.5" />
                                {subtask.estimatedMinutes}m
                              </span>
                            )}
                            {subtask.energyLevel && (
                              <span className={cn(
                                "flex items-center gap-0.5 text-[10px] px-1 rounded bg-muted/50",
                                subtask.energyLevel === 'high' ? "text-red-500" :
                                subtask.energyLevel === 'medium' ? "text-orange-500" :
                                "text-green-500"
                              )}>
                                <Sparkles className="w-2.5 h-2.5" />
                                {subtask.energyLevel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Subtask Description/Tip */}
                      {(subtask.description || subtask.tip || subtask.potentialBlocker) && !subtask.completed && (
                        <div className="mt-1 text-[11px] text-muted-foreground pl-2 border-l-2 border-primary/20 space-y-0.5">
                          {subtask.description && <p>{subtask.description}</p>}
                          {subtask.tip && <p className="text-primary/80">💡 {subtask.tip}</p>}
                          {subtask.potentialBlocker && <p className="text-red-500/80">⚠️ {subtask.potentialBlocker}</p>}
                        </div>
                      )}
                    </div>
                    {onUpdateTask && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover/subtask:opacity-100 self-start"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
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
