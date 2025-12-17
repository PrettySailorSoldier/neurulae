import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types';

interface ForceSyncButtonProps {
  tasks: Task[];
  userId: string;
  onSyncComplete?: () => void;
}

export function ForceSyncButton({ tasks, userId, onSyncComplete }: ForceSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<'success' | 'partial' | 'error' | null>(null);
  const { toast } = useToast();

  const handleForceSync = async () => {
    if (!userId) {
      toast({
        title: "Not Logged In",
        description: "Please log in to sync tasks to the cloud.",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    setLastResult(null);

    try {
      // Filter to only uncompleted tasks to avoid syncing old data
      const tasksToSync = tasks.filter(t => !t.completed && t.title?.trim());
      
      if (tasksToSync.length === 0) {
        toast({
          title: "Nothing to Sync",
          description: "No active tasks found in local storage.",
        });
        setSyncing(false);
        return;
      }

      console.log(`Force syncing ${tasksToSync.length} tasks to Supabase...`);

      // Prepare rows for upsert (insert or update on conflict)
      const dbRows = tasksToSync.map(task => ({
        id: task.id,
        user_id: userId,
        name: task.title,
        due_date: task.dueDate || null,
        estimated_minutes: task.estimatedMinutes || null,
        type: task.type || 'daily',
        status: task.completed ? 'completed' : 'pending',
        is_completed: task.completed || false,
        // Don't set deleted_at - these are active tasks
      }));

      // Use upsert to handle both new and existing tasks
      const { data, error } = await supabase
        .from('tasks')
        .upsert(dbRows, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Force sync error:', error);
        setLastResult('error');
        toast({
          title: "❌ Sync Failed",
          description: `Database error: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Verify the sync by counting tasks in DB
      const { count: dbCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', false)
        .is('deleted_at', null);

      console.log(`Sync complete. ${tasksToSync.length} local tasks pushed. ${dbCount || 0} tasks now in database.`);

      setLastResult('success');
      toast({
        title: "✅ Force Sync Complete",
        description: `Successfully synced ${tasksToSync.length} tasks to cloud. ${dbCount || 0} active tasks now in database.`,
      });

      onSyncComplete?.();

    } catch (err: any) {
      console.error('Force sync exception:', err);
      setLastResult('error');
      toast({
        title: "❌ Sync Error",
        description: err.message || "An unexpected error occurred during sync.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleForceSync}
      disabled={syncing}
      className="gap-2"
    >
      {syncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : lastResult === 'success' ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Synced!
        </>
      ) : lastResult === 'error' ? (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          Retry Sync
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Force Sync to Cloud
        </>
      )}
    </Button>
  );
}
