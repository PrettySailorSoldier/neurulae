import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { Task, TaskList } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useEffect } from 'react';

// Default categories
export const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Tasks', icon: '📋' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'school', name: 'School', icon: '📚' },
  { id: 'personal', name: 'Personal', icon: '👤' },
  { id: 'home', name: 'Home', icon: '🏠' },
  { id: 'urgent', name: 'Urgent', icon: '🚨' },
];

// Default task lists for new users
const createDefaultTaskLists = (): TaskList[] => [
  {
    id: 'default-today',
    name: 'Today',
    icon: '📅',
    order: 0,
    createdAt: new Date().toISOString(),
  },
];

export const useTasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useSyncedStorage<Task[]>('neurulae-tasks', []);
  const [taskLists, setTaskLists] = useSyncedStorage<TaskList[]>('neurulae-task-lists', []);

  // Initialize default task lists if empty
  useEffect(() => {
    if (taskLists.length === 0) {
      setTaskLists(createDefaultTaskLists());
    }
  }, []);

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

  const addTask = async (title: string, category: string = 'personal', estimatedMinutes?: number, taskListId?: string) => {
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
      taskListId: taskListId || taskLists[0]?.id, // Default to first list
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

  // --- Task List Management ---

  const addTaskList = (name: string, icon?: string, color?: string) => {
    const newList: TaskList = {
      id: crypto.randomUUID(),
      name,
      icon,
      color,
      order: taskLists.length,
      createdAt: new Date().toISOString(),
    };
    setTaskLists(prev => [...prev, newList]);
    return newList;
  };

  const updateTaskList = (listId: string, updates: Partial<TaskList>) => {
    setTaskLists(prev => prev.map(list => 
      list.id === listId ? { ...list, ...updates } : list
    ));
  };

  const deleteTaskList = (listId: string) => {
    // Move tasks from deleted list to first remaining list
    const remainingLists = taskLists.filter(l => l.id !== listId);
    const firstListId = remainingLists[0]?.id;
    
    if (firstListId) {
      setTasks(prev => prev.map(task => 
        task.taskListId === listId ? { ...task, taskListId: firstListId } : task
      ));
    }
    
    setTaskLists(remainingLists);
  };

  const reorderTaskLists = (newOrder: TaskList[]) => {
    setTaskLists(newOrder.map((list, index) => ({ ...list, order: index })));
  };

  const moveTaskToList = (taskId: string, targetListId: string) => {
    updateTask(taskId, { taskListId: targetListId });
  };

  const getTasksByList = (listId: string) => {
    return tasks.filter(t => t.taskListId === listId && !t.parentId);
  };

  // --- Subtask Management ---

  const createSubtask = async (parentId: string, title: string) => {
    const parent = tasks.find(t => t.id === parentId);
    if (!parent) return;

    // Enforce max depth 2 (Parent -> Child)
    if (parent.parentId) {
        toast({
            title: "Maximum nesting depth reached",
            description: "Subtasks cannot have their own subtasks.",
            variant: "destructive"
        });
        return;
    }

    const subtaskId = crypto.randomUUID();
    const newSubtask: Task = {
        id: subtaskId,
        title,
        completed: false,
        parentId: parentId,
        category: parent.category, // Inherit category
        createdAt: new Date().toISOString(),
        type: 'daily'
    };
    
    // Add subtask to parent's subtasks array AND to main task list (if we want them addressable)
    // Design decision: Are subtasks strictly nested in the data, or flattened?
    // Based on `subtasks?: Task[]` in parent, it implies nested structure or reference.
    // Let's go with nested structure for `subtasks` array, but also keep them addressable if needed.
    // Actually, simpler to just update the parent struct.
    
    // Update parent
    const updatedSubtasks = [...(parent.subtasks || []), newSubtask];
    await updateTask(parentId, { subtasks: updatedSubtasks });
    
    return newSubtask;
  };

  const toggleSubtask = async (parentId: string, subtaskId: string) => {
    const parent = tasks.find(t => t.id === parentId);
    if (!parent || !parent.subtasks) return;

    const updatedSubtasks = parent.subtasks.map(s => 
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );

    await updateTask(parentId, { subtasks: updatedSubtasks });
  };

  const deleteSubtask = async (parentId: string, subtaskId: string) => {
    const parent = tasks.find(t => t.id === parentId);
    if (!parent || !parent.subtasks) return;

    const updatedSubtasks = parent.subtasks.filter(s => s.id !== subtaskId);
    await updateTask(parentId, { subtasks: updatedSubtasks });
  };

  const nestTaskAsSubtask = async (taskIdToNest: string, newParentId: string) => {
      // 1. Find the task to nest
      const taskToNest = tasks.find(t => t.id === taskIdToNest);
      const newParent = tasks.find(t => t.id === newParentId);
      
      if (!taskToNest || !newParent) return;

      if (newParent.parentId) {
         toast({ title: "Cannot nest under a subtask" });
         return;
      }

      // 2. Remove from top level
      const remainingTasks = tasks.filter(t => t.id !== taskIdToNest);
      
      // 3. Add as subtask to parent
      const newSubtask: Task = {
          ...taskToNest,
          parentId: newParentId,
          subtasks: undefined, // Strip any subtasks if moving a parent (or prevent moving parents with children)
      };

      if (taskToNest.subtasks && taskToNest.subtasks.length > 0) {
          toast({ title: "Cannot nest a task that already has subtasks" });
          return;
      }

      const updatedParent = {
          ...newParent,
          subtasks: [...(newParent.subtasks || []), newSubtask]
      };

      // 4. Update state atomically (ideally)
      // Since we can't do atomic updates easily with this hook structure, we update state directly
      const finalTasks = remainingTasks.map(t => t.id === newParentId ? updatedParent : t);
      setTasks(finalTasks);
      
      // Sync (simplified for now, ideally batch updates)
      // Delete old top level
      await syncToDb(taskToNest, 'delete'); 
      // Update parent (which contains new child)
      await syncToDb(updatedParent, 'update');
  };

  const unnestSubtask = async (parentId: string, subtaskId: string) => {
      const parent = tasks.find(t => t.id === parentId);
      if (!parent || !parent.subtasks) return;

      const subtaskToPromote = parent.subtasks.find(s => s.id === subtaskId);
      if (!subtaskToPromote) return;

      // 1. Remove from parent
      const updatedParentSubtasks = parent.subtasks.filter(s => s.id !== subtaskId);
      const updatedParent = { ...parent, subtasks: updatedParentSubtasks };

      // 2. Create new top level task
      const newTopLevelTask: Task = {
          ...subtaskToPromote,
          parentId: undefined, // Remove parent link
      };

      // 3. Update state
      const updatedTasks = tasks.map(t => t.id === parentId ? updatedParent : t);
      setTasks([...updatedTasks, newTopLevelTask]);

      await syncToDb(updatedParent, 'update');
      await syncToDb(newTopLevelTask, 'insert');
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
    DEFAULT_CATEGORIES,
    // Task list management
    taskLists,
    addTaskList,
    updateTaskList,
    deleteTaskList,
    reorderTaskLists,
    moveTaskToList,
    getTasksByList,
    // Subtask functions
    createSubtask,
    toggleSubtask,
    deleteSubtask,
    nestTaskAsSubtask,
    unnestSubtask,
  };
};
