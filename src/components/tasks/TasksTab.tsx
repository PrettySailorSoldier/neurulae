import { TasksList } from './TasksList';
import { useEffect, useMemo } from 'react';
import { migrateTasksToCategories } from '@/utils/taskMigration';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { Task } from '@/types';
import { BrainDumpFAB } from '@/components/brain-dump/BrainDumpFAB';
import { BrainDumpPanel } from '@/components/brain-dump/BrainDumpPanel';
import { useBrainDump } from '@/hooks/useBrainDump';
import { useActiveWorkSessionState } from '@/contexts/ActiveWorkSessionContext';

export const TasksTab = () => {
    // Run migration on mount
    const [tasks, setTasks] = useSyncedStorage<Task[]>('neurulae-tasks', []);
    const brainDump = useBrainDump();
    
    // Get active work session context (returns null outside provider)
    const session = useActiveWorkSessionState();
    
    // Derive active task info from session
    const activeTaskId = session?.activeSession?.taskId ?? null;
    const activeElapsed = useMemo(() => {
        if (!session?.totalTime || !session?.timeRemaining) return 0;
        return session.totalTime - session.timeRemaining;
    }, [session?.totalTime, session?.timeRemaining]);
    
    useEffect(() => {
        const migrated = migrateTasksToCategories(tasks);
        // Only update if changes were made
        if (JSON.stringify(migrated) !== JSON.stringify(tasks)) {
            setTasks(migrated);
            console.log('Migrated tasks to new category structure');
        }
    }, []); // Run once on mount

    return (
        <div className="h-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between pb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground">Capture and organize your to-dos.</p>
                </div>
            </div>
            <TasksList 
                activeTaskId={activeTaskId}
                activeElapsed={activeElapsed}
                onStartWork={session?.startFromTaskList}
            />

            {/* Brain Dump FAB - Fixed bottom-right relative to this container or viewport via fixed/absolute */}
            <BrainDumpFAB onClick={brainDump.openPanel} />
            
            {/* Brain Dump Panel - Slide-out */}
            <BrainDumpPanel 
                {...brainDump} // Spread all hook props: isOpen, onClose, capturedItems, etc.
            />
        </div>
    );
};
export default TasksTab;
