import { useState, useEffect } from 'react';
import { Brain, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';
import { AIAssistant } from './AIAssistant';
import { Task, TimeBlock, Playbook } from '@/types';

interface AICommandBarProps {
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onUpdateTimeBlock: (blockId: string, updates: Partial<TimeBlock>) => void;
  onAddTimeBlock: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  playbooks: Playbook[];
  onAddPlaybook: (playbook: Omit<Playbook, 'id' | 'createdAt'>) => void;
  onUpdatePlaybook: (id: string, updates: Partial<Playbook>) => void;
  stuckMode?: boolean;
  onStuckModeComplete?: () => void;
  initialMessage?: string;
  onInitialMessageHandled?: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

type DrawerState = 'minimized' | 'compact' | 'expanded';

export function AICommandBar(props: AICommandBarProps) {
  const { initialMessage, onInitialMessageHandled, externalOpen, onExternalOpenChange, ...restProps } = props;
  const [drawerState, setDrawerState] = useLocalStorage<DrawerState>('neurulae-ai-drawer-state', 'compact');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sync external open state with internal state
  useEffect(() => {
    if (externalOpen !== undefined && externalOpen !== isDialogOpen) {
      setIsDialogOpen(externalOpen);
    }
  }, [externalOpen]);

  // Auto-open when initialMessage is provided
  useEffect(() => {
    if (initialMessage) {
      handleOpenChange(true);
      if (onInitialMessageHandled) {
        // Clear the message after opening
        setTimeout(() => onInitialMessageHandled(), 100);
      }
    }
  }, [initialMessage, onInitialMessageHandled]);

  // Notify parent when internal state changes
  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    onExternalOpenChange?.(open);
  };

  if (drawerState === 'minimized') {
    return (
      <button
        onClick={() => {
          setDrawerState('compact');
          handleOpenChange(true);
        }}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-primary text-primary-foreground p-4 shadow-lg hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Open AI Assistant"
      >
        <Brain className="h-6 w-6" />
      </button>
    );
  }

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border transition-all duration-300",
          "h-16"
        )}
        role="region"
        aria-label="AI Assistant Command Bar"
      >
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => handleOpenChange(true)}
            className="flex-1 flex items-center gap-3 text-left py-3 px-4 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Open AI Assistant (Keyboard shortcut: Command or Control plus K)"
          >
            <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="text-muted-foreground">
              What do you need to accomplish? 💬 (Press <kbd className="text-xs px-1 py-0.5 bg-muted rounded border border-border">Cmd+K</kbd>)
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerState('minimized')}
            aria-label="Minimize AI assistant to floating button"
            title="Minimize AI bar"
            className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Minimize2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      
      <AIAssistant
        open={isDialogOpen}
        onOpenChange={handleOpenChange}
        initialMessage={initialMessage}
        {...restProps}
      />
    </>
  );
}