import { useState, useEffect } from 'react';
import { Sparkles, Loader2, MoveVertical, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Task, TimeBlock } from '@/types';
import { useToast } from '@/hooks/use-toast';

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
}: AIOrganizeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Automatically trigger organization when dialog opens
  useEffect(() => {
    if (open && !result && !loading) {
      handleOrganize();
    }
  }, [open]);

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

      // Fetch all pending tasks directly from database
      const { data: dbTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name, due_date, estimated_minutes, type')
        .eq('user_id', session.user.id)
        .eq('status', 'pending');

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        throw new Error('Failed to fetch tasks from database');
      }

      // Fetch all availability blocks directly from database
      const { data: availabilityBlocks, error: availError } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', session.user.id)
        .order('day_of_week')
        .order('start_time');

      if (availError) {
        console.error('Error fetching availability:', availError);
        throw new Error('Failed to fetch availability from database');
      }

      console.log('Fetched data:', { 
        taskCount: dbTasks?.length || 0, 
        availabilityCount: availabilityBlocks?.length || 0 
      });

      // Send everything to the edge function
      const { data, error: invokeError } = await supabase.functions.invoke('organize-tasks', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          tasks: dbTasks || [],
          availability: availabilityBlocks || [],
          today,
        },
      });

      if (invokeError) throw invokeError;
      if (data.error) throw new Error(data.error);

      setResult(data);
      toast({
        title: "✨ AI Analysis Complete",
        description: `Analyzed ${dbTasks?.length || 0} tasks and ${availabilityBlocks?.length || 0} availability blocks`,
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                {result.schedule.map((item: any, idx: number) => {
                  const task = getTaskById(item.taskId);
                  const block = getBlockById(item.blockId);
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
                  ) : null;
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
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Schedule
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
