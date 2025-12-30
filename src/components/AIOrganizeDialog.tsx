import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, MoveVertical, Calendar, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Task, TimeBlock } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AIOrganizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  onApply: (result: {
    priorities: string[];
    schedule: Array<{
      taskId: string;
      blockId: string;
      estimatedMinutes?: number;
      order?: number;
      reason?: string;
    }>;
  }) => void;
}

export function AIOrganizeDialog({
  open,
  onOpenChange,
  tasks,
  timeBlocks,
  onApply,
  onOpenChat,
}: AIOrganizeDialogProps & { onOpenChat?: (context: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Automatically trigger organization when dialog opens
  useEffect(() => {
    if (open && !result && !loading) {
      handleOrganize();
    }
  }, [open]);

  // Timer for elapsed time during loading
  useEffect(() => {
    if (loading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loading]);

  const handleOrganize = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get the current session to ensure we have auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to organize tasks');
      }

      // Get the real current date
      const today = new Date().toISOString();

      let tasksToProcess = tasks.filter(t => !t.completed).map(t => ({
        id: t.id,
        name: t.title, // Map title to name for consistency
        due_date: t.dueDate,
        estimated_minutes: t.estimatedMinutes,
        type: t.type
      }));

      // Fallback to DB fetch only if no tasks passed
      if (tasksToProcess.length === 0) {
        const { data: dbTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, name, due_date, estimated_minutes, type')
          .eq('user_id', session.user.id)
          .eq('is_completed', false) // Filter out completed tasks
          .is('deleted_at', null);   // Filter out deleted tasks

        if (tasksError) {
          console.error('Error fetching tasks :', tasksError);
          throw new Error('Failed to fetch tasks from database');
        }
        tasksToProcess = (dbTasks || []).map(t => ({
          ...t,
          type: (t.type === 'daily' || t.type === 'ongoing' ? t.type : 'daily') as 'daily' | 'ongoing'
        }));
      }

      // Use the timeBlocks passed from the parent (these have the correct IDs that the UI expects)
      // Convert to the format expected by the AI
      let blocksForAI = timeBlocks.map(block => ({
        id: block.id,
        title: block.title,
        start_time: block.startTime,
        end_time: block.endTime,
        type: block.type,
        scheduleType: block.scheduleType
      }));

      // If no time blocks exist, create default blocks for scheduling
      if (blocksForAI.length === 0) {
        console.log('No time blocks found, creating default blocks');
        // Create a default "Available" block for typical working hours
        blocksForAI = [
          {
            id: crypto.randomUUID(),
            title: 'Morning Block',
            start_time: '08:00',
            end_time: '12:00',
            type: 'main',
            scheduleType: 'weekday'
          },
          {
            id: crypto.randomUUID(),
            title: 'Afternoon Block',
            start_time: '13:00',
            end_time: '17:00',
            type: 'main',
            scheduleType: 'weekday'
          },
          {
            id: crypto.randomUUID(),
            title: 'Evening Block',
            start_time: '18:00',
            end_time: '21:00',
            type: 'dedicated',
            scheduleType: 'everyday'
          }
        ];
      }

      console.log('Sending data to AI:', { 
        taskCount: tasksToProcess?.length || 0, 
        blockCount: blocksForAI.length 
      });

      // Send everything to the edge function
      const { data, error: invokeError } = await supabase.functions.invoke('organize-tasks', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          tasks: tasksToProcess,
          timeBlocks: blocksForAI,
          today,
        },
      });

      if (invokeError) throw invokeError;
      if (data.error) throw new Error(data.error);

      setResult(data);
      toast({
        title: "✨ AI Analysis Complete",
        description: `Analyzed ${tasksToProcess.length} tasks and ${blocksForAI.length} time blocks`,
      });
    } catch (err: any) {
      console.error('Organization error:', err);
      setError(err.message || 'Failed to organize tasks');
      toast({
        title: "Organization Failed",
        description: err.message || 'Failed to organize tasks. Please try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      onOpenChange(false);
      toast({
        title: "✨ Tasks Organized",
        description: `Prioritized ${result.priorities.length} tasks and scheduled ${result.schedule.length} for today.`,
      });
    }
  };

  const getTaskById = (id: string) => tasks.find(t => t.id === id);
  const getBlockById = (id: string) => timeBlocks.find(b => b.id === id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[80vh] overflow-y-auto",
        isMobile ? "w-full max-w-full" : "max-w-2xl"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Task Organizer
          </DialogTitle>
          <DialogDescription>
            Let AI analyze your tasks and create an optimized schedule based on urgency, impact, and energy levels.
          </DialogDescription>
        </DialogHeader>


        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing tasks and creating your schedule...</p>
            <p className="text-xs text-muted-foreground/70">
              {elapsedSeconds < 60
                ? `${elapsedSeconds}s elapsed`
                : `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s elapsed`}
            </p>
            {elapsedSeconds > 30 && (
              <p className="text-xs text-muted-foreground/50 text-center max-w-xs">
                AI is analyzing your schedule and availability. This may take up to a minute for complex schedules.
              </p>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-6 py-4">
            {/* Priorities */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MoveVertical className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Prioritized Tasks</h3>
              </div>
              <div className="space-y-1">
                {result.priorities.slice(0, 5).map((taskId: string, idx: number) => {
                  const task = getTaskById(taskId);
                  return task ? (
                    <div key={taskId} className="flex items-center gap-2 p-2 bg-card/50 rounded text-sm">
                      <span className="font-semibold text-primary min-w-[24px]">#{idx + 1}</span>
                      <span>{task.title}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Today's Schedule</h3>
              </div>
              <div className="space-y-2">
                {result.schedule.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No tasks scheduled - you may need to add time blocks first.</p>
                )}
                {result.schedule.map((item: any, idx: number) => {
                  const task = getTaskById(item.taskId);
                  const block = getBlockById(item.blockId);
                  // Debug: log if task or block is not found
                  if (!task || !block) {
                    console.log('Schedule item missing match:', { taskId: item.taskId, blockId: item.blockId, taskFound: !!task, blockFound: !!block });
                  }
                  return task && block ? (
                    <div key={idx} className="p-3 bg-card/50 rounded space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{task.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.estimatedMinutes ? `${item.estimatedMinutes}m` : ''}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {block.title} ({block.startTime} - {block.endTime})
                      </div>
                      {item.reason && (
                        <div className="text-xs text-muted-foreground italic">
                          {item.reason}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show fallback for items where we can't find the block
                    task ? (
                      <div key={idx} className="p-3 bg-card/30 rounded space-y-1 border border-dashed border-muted">
                        <span className="font-medium text-sm">{task.title}</span>
                        {item.estimatedMinutes && (
                          <span className="text-xs text-muted-foreground ml-2">{item.estimatedMinutes}m</span>
                        )}
                      </div>
                    ) : null
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            {result.tips && result.tips.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">💡 Tips</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.tips.map((tip: string, idx: number) => (
                    <li key={idx}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {result && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {onOpenChat && (
              <Button
                variant="secondary"
                onClick={() => {
                  const scheduleSummary = result.schedule
                    .map((item: any) => {
                      const task = getTaskById(item.taskId);
                      const block = getBlockById(item.blockId);
                      return task && block ? `- ${task.title} during ${block.title} (${block.startTime}-${block.endTime})` : null;
                    })
                    .filter(Boolean)
                    .join('\n');

                  const context = `I just received an AI-generated schedule. Here's what was suggested:\n\n${scheduleSummary}\n\nI'd like to discuss or adjust this schedule.`;
                  onOpenChat(context);
                  onOpenChange(false);
                }}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Discuss with AI
              </Button>
            )}
            <Button onClick={handleApply}>
              Apply Schedule
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
