import { Button } from '@/components/ui/button';
import { Calendar, Trash2, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useTasks } from '@/hooks/useTasks';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onAssignCategory: (categoryId: string) => void;
  onDelete: () => void;
  onCreateSubtasks: (parentId: string) => void;
}

export const BulkActionsBar = ({
  selectedCount,
  onClearSelection,
  onAssignCategory,
  onDelete,
  onCreateSubtasks
}: BulkActionsBarProps) => {
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const { tasks } = useTasks();

  // Filter only potential parent tasks (exclude those that are already subtasks if deeper nesting disallowed)
  // For now, allow nesting under any top-level task
  const potentialParents = tasks.filter(t => !t.parentId && !t.completed);

  return (
    <AnimatePresence>
        {selectedCount > 0 && (
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-white/10 z-10"
            >
                <div className="flex items-center justify-between mb-3 text-sm px-1">
                    <span className="font-semibold text-primary">{selectedCount} items selected</span>
                    <button onClick={onClearSelection} className="text-muted-foreground hover:text-foreground text-xs">
                        Clear selection
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {/* Work Category */}
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex flex-col gap-1 h-16 hover:bg-primary/20 hover:text-primary transition-colors border border-white/5"
                        onClick={() => onAssignCategory('work')}
                    >
                        <span className="text-xl">💼</span>
                        <span className="text-[10px]">Work</span>
                    </Button>

                    {/* Personal Category */}
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex flex-col gap-1 h-16 hover:bg-primary/20 hover:text-primary transition-colors border border-white/5"
                        onClick={() => onAssignCategory('personal')}
                    >
                        <span className="text-xl">👤</span>
                        <span className="text-[10px]">Personal</span>
                    </Button>

                    {/* Create Subtasks (Dialog) */}
                    <Dialog open={isTaskSelectorOpen} onOpenChange={setIsTaskSelectorOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                className="flex flex-col gap-1 h-16 hover:bg-primary/20 hover:text-primary transition-colors border border-white/5"
                            >
                                <Network className="w-5 h-5 mb-0.5 opacity-70" />
                                <span className="text-[10px] text-center leading-none">Make<br/>Child</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Select Parent Task</DialogTitle>
                            </DialogHeader>
                            <Command>
                                <CommandInput placeholder="Search tasks..." />
                                <CommandList>
                                    <CommandEmpty>No tasks found.</CommandEmpty>
                                    <CommandGroup heading="Available Tasks">
                                        {potentialParents.map((task) => (
                                            <CommandItem
                                                key={task.id}
                                                onSelect={() => {
                                                    onCreateSubtasks(task.id);
                                                    setIsTaskSelectorOpen(false);
                                                }}
                                            >
                                                <span>{task.title}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </DialogContent>
                    </Dialog>

                     {/* Delete */}
                     <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex flex-col gap-1 h-16 hover:bg-destructive/90 transition-colors border border-white/5"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-5 h-5 mb-0.5 opacity-70" />
                        <span className="text-[10px]">Delete</span>
                    </Button>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};
