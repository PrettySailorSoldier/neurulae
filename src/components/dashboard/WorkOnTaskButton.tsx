import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Play, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Task } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface WorkOnTaskButtonProps {
  onStartSession: (task: Task) => void;
  className?: string;
}

export const WorkOnTaskButton = ({ onStartSession, className }: WorkOnTaskButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { tasks } = useTasks();

  const filteredTasks = tasks.filter(t => 
    !t.completed && 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (task: Task) => {
    onStartSession(task);
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        className={cn("gap-2 shadow-lg hover:shadow-xl transition-all", className)}
        size="lg"
      >
        <Play className="w-4 h-4 fill-current" />
        Work on Next Task
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>What would you like to work on?</DialogTitle>
          </DialogHeader>

          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search active tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px] mt-4 pr-4">
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No matching tasks found.
                </div>
              ) : (
                filteredTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => handleSelect(task)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between group border border-transparent hover:border-border/50"
                  >
                    <span className="font-medium truncate">{task.title}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      Start
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
