import { Suspense, lazy } from 'react';
import { Task, Playbook } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Lazy load the FocusTimer component
const FocusTimer = lazy(() => 
  import('@/components/FocusTimer').then(m => ({ default: m.FocusTimer }))
);

interface TimerDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Close the drawer */
  onClose: () => void;
  /** Selected task to work on */
  selectedTask?: Task | null;
  /** All tasks for timer */
  tasks: Task[];
  /** All playbooks for timer */
  playbooks: Playbook[];
}

// Loading fallback
const TimerLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export function TimerDrawer({
  open,
  onClose,
  selectedTask,
  tasks,
  playbooks,
}: TimerDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[450px] sm:max-w-[450px]">
        <SheetHeader>
          <SheetTitle>Focus Timer</SheetTitle>
          <SheetDescription>
            {selectedTask 
              ? `Working on: ${selectedTask.title}` 
              : 'Select a task or start a free focus session'
            }
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 h-[calc(100vh-120px)] overflow-y-auto">
          <Suspense fallback={<TimerLoader />}>
            <FocusTimer 
              tasks={tasks} 
              playbooks={playbooks}
              // The FocusTimer will use the timer context to manage state
            />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}
