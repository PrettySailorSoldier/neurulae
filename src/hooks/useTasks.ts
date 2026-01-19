import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

// Default categories
export const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Tasks', icon: '📋' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'school', name: 'School', icon: '📚' },
  { id: 'personal', name: 'Personal', icon: '👤' },
  { id: 'home', name: 'Home', icon: '🏠' },
  { id: 'urgent', name: 'Urgent', icon: '🚨' },
];

export const useTasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useSyncedStorage<Task[]>('neurulae-tasks', []);

  // Sync to database helper
  const syncToDb = async (task: Task, operation: 'insert' | 'update' | 'delete') => {
    if (!user) return;

    try {
      if (operation === 'insert') { await supabase
          .from('tasks')
          .insert({
            id: task.id,
            user_id: user.id,
            name: task.title,
            estimated_minutes: task.estimatedMinutes || null,
            type: task.type || 'daily',
            status: task.completed ? 'completed' : 'pending',
            is_completed: task.completed,
            // Map category to existing fields or json if needed, for now we rely on local sync primarily for custom fields
            // In a real app we'd add a category column to supabase tasks table
          });
      } else if (operation === 'update') {
        await supabase
          .from('tasks')
          .update({
            name: task.title,
            is_completed: task.completed,
            status: task.completed ? 'completed' : 'pending',
            estimated_minutes: task.estimatedMinutes,
          })
          .eq('id', task.id)
          .eq('user_id', user.id);
      } else if (operation === 'delete') {
        await supabase
          .from('tasks')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', task.id)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error(`Error performing ${operation} on task:`, err);
    }
  };

  const addTask = async (title: string, category: string = 'personal', estimatedMinutes?: number) => {
    const taskId = crypto.randomUUID();
    const newTask: Task = {
      id: taskId,
      title,
      completed: false,
      category,
      recurring: 'none',
      createdAt: new Date().toISOString(),
      estimatedMinutes,
      type: 'daily',
    };

    setTasks(prev => [...prev, newTask]);
    await syncToDb(newTask, 'insert');
    return newTask;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    let updatedTask: Task | undefined;
    
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        updatedTask = { ...t, ...updates };
        return updatedTask;
      }
      return t;
    }));

    if (updatedTask) {
      await syncToDb(updatedTask, 'update');
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    await updateTask(taskId, { completed: newCompleted });
    
    // Toast notification handled by UI components usually, but we can return status
    return newCompleted;
  };

  const deleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev => prev.filter(t => t.id !== taskId));
    await syncToDb(task, 'delete');
  };

  // Get tasks by category
  const getTasksByCategory = (categoryId: string) => {
    if (categoryId === 'all') return tasks;
    if (categoryId === 'urgent') return tasks.filter(t => t.eisenhowerQuadrant?.includes('urgent'));
    return tasks.filter(t => t.category === categoryId || t.taskType === categoryId); // Fallback to taskType for migration compatibility
  };

  return {
    tasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    getTasksByCategory,
    DEFAULT_CATEGORIES
  };
};
