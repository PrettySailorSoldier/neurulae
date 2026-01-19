import { Task } from '@/types';

// Run this function once when the Tasks tab is first loaded
export const migrateTasksToCategories = (tasks: Task[]): Task[] => {
  const needsMigration = tasks.some(t => !t.category);
  
  if (!needsMigration) return tasks;

  return tasks.map(task => {
    if (task.category) return task;

    // Map existing taskType to category
    let category = 'personal';
    if (task.taskType) {
      // Map 'other' to 'personal' if needed, or keep as is.
      // We will map based on the DEFAULT_CATEGORIES in useTasks
      switch (task.taskType) {
        case 'work': category = 'work'; break;
        case 'school': category = 'school'; break;
        case 'home': category = 'home'; break;
        // 'appointment' and 'call' might fit better in specific categories or stay as is if we add them
        case 'appointment': category = 'personal'; break;
        case 'call': category = 'work'; break; // Assumption
        default: category = 'personal';
      }
    } else {
        // Simple heuristic based on title keywords if no type
        const lowerTitle = task.title.toLowerCase();
        if (lowerTitle.includes('work') || lowerTitle.includes('meeting') || lowerTitle.includes('email')) category = 'work';
        else if (lowerTitle.includes('study') || lowerTitle.includes('exam') || lowerTitle.includes('class')) category = 'school';
        else if (lowerTitle.includes('clean') || lowerTitle.includes('buy') || lowerTitle.includes('dishes')) category = 'home';
    }

    return {
      ...task,
      category
    };
  });
};
