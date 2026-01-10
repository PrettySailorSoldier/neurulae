import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { Task, TimeBlock } from '@/types';
import { MobileTaskView } from '@/components/MobileTaskView';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BulkTaskInput {
  title: string;
  estimatedMinutes?: number;
}

const Tasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useSyncedStorage<Task[]>('neurulae-tasks', []);
  const [timeBlocks] = useSyncedStorage<TimeBlock[]>('neurulae-timeblocks', []);
  const [userName, setUserName] = useState('User');
  const [userAvatar, setUserAvatar] = useState<string | undefined>();

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        // Use email username or first part as name
        const emailName = user.email?.split('@')[0] || 'User';
        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
      }
    };
    
    loadProfile();
  }, [user]);

  const handleAddTask = async (
    title: string, 
    estimatedMinutes?: number, 
    taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other'
  ) => {
    const taskId = crypto.randomUUID();
    const newTask: Task = {
      id: taskId,
      title,
      completed: false,
      recurring: 'none',
      createdAt: new Date().toISOString(),
      ...(estimatedMinutes && { estimatedMinutes }),
      ...(taskType && { taskType }),
    };
    
    setTasks(prev => [...prev, newTask]);
    
    if (user) {
      try {
        await supabase
          .from('tasks')
          .insert({
            id: taskId,
            user_id: user.id,
            name: newTask.title,
            estimated_minutes: newTask.estimatedMinutes || null,
            type: newTask.type || 'daily',
            status: 'pending',
            is_completed: false,
          });
      } catch (err) {
        console.error('Error inserting task to database:', err);
      }
    }
  };

  const handleBulkAddTasks = async (tasksToAdd: BulkTaskInput[]): Promise<void> => {
    const newTasks: Task[] = tasksToAdd.map(t => ({
      id: crypto.randomUUID(),
      title: t.title,
      completed: false,
      recurring: 'none',
      createdAt: new Date().toISOString(),
      ...(t.estimatedMinutes && { estimatedMinutes: t.estimatedMinutes }),
    }));

    setTasks(prev => [...prev, ...newTasks]);

    if (user) {
      for (const task of newTasks) {
        try {
          await supabase
            .from('tasks')
            .insert({
              id: task.id,
              user_id: user.id,
              name: task.title,
              estimated_minutes: task.estimatedMinutes || null,
              type: 'daily',
              status: 'pending',
              is_completed: false,
            });
        } catch (err) {
          console.error('Error inserting task to database:', err);
        }
      }
    }
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompletedState = !task.completed;
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: newCompletedState } : t));

    if (newCompletedState) {
      toast({
        title: "Task completed",
        description: task.title.length > 30 ? task.title.substring(0, 30) + "..." : task.title,
        action: (
          <ToastAction altText="Undo" onClick={() => {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: false } : t));
          }}>
            Undo
          </ToastAction>
        ),
      });
    }

    if (user) {
      try {
        await supabase
          .from('tasks')
          .update({
            is_completed: newCompletedState,
            status: newCompletedState ? 'completed' : 'pending'
          })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error updating task completion:', err);
      }
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const handleDeleteTask = async (id: string) => {
    const deletedTask = tasks.find(task => task.id === id);
    if (!deletedTask) return;

    setTasks(tasks.filter(task => task.id !== id));

    toast({
      title: "Task deleted",
      description: deletedTask.title.length > 30 ? deletedTask.title.substring(0, 30) + "..." : deletedTask.title,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          setTasks(prev => [...prev, deletedTask]);
        }}>
          Undo
        </ToastAction>
      ),
    });

    if (user) {
      try {
        await supabase
          .from('tasks')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleOpenAIChat = (context: string) => {
    // Navigate to main dashboard with AI chat open
    window.location.href = `/?ai=${encodeURIComponent(context)}`;
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      {/* Back button */}
      <div className="w-full max-w-[420px] mb-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Mobile Task View Container */}
      <div className="w-full max-w-[420px] h-[85vh] min-h-[600px]">
        <MobileTaskView
          tasks={tasks}
          userName={userName}
          userAvatar={userAvatar}
          onToggleComplete={handleToggleComplete}
          onAddTask={handleAddTask}
          onBulkAddTasks={handleBulkAddTasks}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onOpenAIChat={handleOpenAIChat}
          onOpenDailyReview={() => {
            // Navigate to main dashboard with daily review open
            window.location.href = '/?dailyReview=true';
          }}
        />
      </div>
    </div>
  );
};

export default Tasks;
