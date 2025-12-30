import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Plus,
  ListTodo,
  Timer,
  Calendar,
  Settings,
  MessageSquare,
  Sparkles,
  BookOpen,
  LayoutDashboard,
  Moon,
  Sun,
  Palette,
  Target,
  Brain,
  Zap,
} from 'lucide-react';
import { Task } from '@/types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: (title: string, estimatedMinutes?: number, taskType?: 'school' | 'work' | 'home' | 'appointment' | 'call' | 'other') => void;
  onOpenAIChat?: () => void;
  onOpenTimer?: () => void;
  onOpenFocusMode?: () => void;
  onToggleTheme?: () => void;
  tasks: Task[];
  currentTab?: string;
  onChangeTab?: (tab: string) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onAddTask,
  onOpenAIChat,
  onOpenTimer,
  onOpenFocusMode,
  onToggleTheme,
  tasks,
  currentTab,
  onChangeTab,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'default' | 'add-task'>('default');
  const [taskType, setTaskType] = useState<'school' | 'work' | 'home' | 'appointment' | 'call' | 'other'>('school');

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('');
      setMode('default');
      setTaskType('school');
    }
  }, [open]);

  const handleAddTask = useCallback(() => {
    if (search.trim()) {
      onAddTask(search.trim(), undefined, taskType);
      setSearch('');
      onOpenChange(false);
    }
  }, [search, taskType, onAddTask, onOpenChange]);

  const incompleteTasks = tasks.filter(t => !t.completed);
  const recentTasks = incompleteTasks.slice(0, 5);

  // Quick add mode
  if (mode === 'add-task') {
    return (
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput
          placeholder="Enter task title... (press Enter to add)"
          value={search}
          onValueChange={setSearch}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && search.trim()) {
              handleAddTask();
            } else if (e.key === 'Escape') {
              setMode('default');
              setSearch('');
            }
          }}
        />
        <CommandList>
          <CommandGroup heading="Task Type">
            {(['school', 'work', 'home', 'appointment', 'call', 'other'] as const).map((type) => (
              <CommandItem
                key={type}
                onSelect={() => {
                  setTaskType(type);
                  if (search.trim()) {
                    onAddTask(search.trim(), undefined, type);
                    setSearch('');
                    onOpenChange(false);
                  }
                }}
                className={taskType === type ? 'bg-accent' : ''}
              >
                {type === 'school' && <BookOpen className="mr-2 h-4 w-4" />}
                {type === 'work' && <Target className="mr-2 h-4 w-4" />}
                {type === 'home' && <LayoutDashboard className="mr-2 h-4 w-4" />}
                {type === 'appointment' && <Calendar className="mr-2 h-4 w-4" />}
                {type === 'call' && <MessageSquare className="mr-2 h-4 w-4" />}
                {type === 'other' && <ListTodo className="mr-2 h-4 w-4" />}
                <span className="capitalize">{type}</span>
                {taskType === type && <span className="ml-auto text-xs text-primary">Selected</span>}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem onSelect={() => setMode('default')}>
              <span className="text-muted-foreground">Back to menu</span>
              <CommandShortcut>Esc</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => setMode('add-task')}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Add new task</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          {onOpenAIChat && (
            <CommandItem onSelect={() => { onOpenAIChat(); onOpenChange(false); }}>
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Ask AI Assistant</span>
              <CommandShortcut>A</CommandShortcut>
            </CommandItem>
          )}
          {onOpenTimer && (
            <CommandItem onSelect={() => { onOpenTimer(); onOpenChange(false); }}>
              <Timer className="mr-2 h-4 w-4" />
              <span>Start Focus Timer</span>
              <CommandShortcut>T</CommandShortcut>
            </CommandItem>
          )}
          {onOpenFocusMode && (
            <CommandItem onSelect={() => { onOpenFocusMode(); onOpenChange(false); }}>
              <Zap className="mr-2 h-4 w-4" />
              <span>Enter Focus Mode</span>
              <CommandShortcut>F</CommandShortcut>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          {onChangeTab && (
            <>
              <CommandItem onSelect={() => { onChangeTab('tasks'); onOpenChange(false); }}>
                <ListTodo className="mr-2 h-4 w-4" />
                <span>Tasks</span>
              </CommandItem>
              <CommandItem onSelect={() => { onChangeTab('schedule'); onOpenChange(false); }}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Schedule</span>
              </CommandItem>
              <CommandItem onSelect={() => { onChangeTab('playbooks'); onOpenChange(false); }}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Playbooks</span>
              </CommandItem>
              <CommandItem onSelect={() => { onChangeTab('timers'); onOpenChange(false); }}>
                <Timer className="mr-2 h-4 w-4" />
                <span>Timers</span>
              </CommandItem>
            </>
          )}
          <CommandItem onSelect={() => { navigate('/settings'); onOpenChange(false); }}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Theme */}
        <CommandGroup heading="Appearance">
          {onToggleTheme && (
            <CommandItem onSelect={() => { onToggleTheme(); onOpenChange(false); }}>
              <Palette className="mr-2 h-4 w-4" />
              <span>Change Theme</span>
            </CommandItem>
          )}
        </CommandGroup>

        {/* Recent Tasks */}
        {recentTasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Tasks">
              {recentTasks.map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => {
                    // Could implement task focus/edit here
                    onOpenChange(false);
                  }}
                >
                  <ListTodo className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{task.title}</span>
                  {task.estimatedMinutes && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {task.estimatedMinutes}m
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
