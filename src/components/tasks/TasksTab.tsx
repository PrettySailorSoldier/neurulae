import { TasksList } from './TasksList';
import { useEffect } from 'react';
import { migrateTasksToCategories } from '@/utils/taskMigration';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { Task } from '@/types';

export const TasksTab = () => {
    // Run migration on mount
    const [tasks, setTasks] = useSyncedStorage<Task[]>('neurulae-tasks', []);
    
    useEffect(() => {
        const migrated = migrateTasksToCategories(tasks);
        // Only update if changes were made
        if (JSON.stringify(migrated) !== JSON.stringify(tasks)) {
            setTasks(migrated);
            console.log('Migrated tasks to new category structure');
        }
    }, []); // Run once on mount

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground">Capture and organize your to-dos.</p>
                </div>
            </div>
            <TasksList />
        </div>
    );
};
export default TasksTab;
